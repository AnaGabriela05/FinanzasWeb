const { Op } = require('sequelize');
const HttpError = require('../errors/HttpError');
const currencyConfig = require('../config/currency');

const DEFAULT_CACHE_DAYS = Number(process.env.ADVICE_CACHE_DAYS) || 7;
const ANALYSIS_WINDOW_DAYS = 90;

// Mapeo entre los keys del FinancialHealthAnalyzer y los niveles esperados por el advisor.
const LEVEL_MAP = {
  danger: 'rojo',
  warning: 'amarillo',
  success: 'verde',
  neutral: 'neutral'
};

const TIPOS_VALIDOS = new Set(['ahorro', 'gasto', 'presupuesto', 'deuda']);

class AdviceService {
  constructor({
    consejoIaRepository,
    financialHealthAnalyzer,
    transactionRepository,
    categoryRepository,
    budgetRepository,
    advisor,
    cacheDays = DEFAULT_CACHE_DAYS
  }) {
    this.consejoIaRepository = consejoIaRepository;
    this.financialHealthAnalyzer = financialHealthAnalyzer;
    this.transactionRepository = transactionRepository;
    this.categoryRepository = categoryRepository;
    this.budgetRepository = budgetRepository;
    this.advisor = advisor;
    this.cacheDays = cacheDays;
  }

  /**
   * Retorna los consejos vigentes (cache <= cacheDays). Si no hay vigentes,
   * construye el contexto financiero, llama al advisor, persiste y retorna.
   */
  async getOrGenerateAdvice(userId) {
    const vigentes = await this.consejoIaRepository.findVigentesByUserId(userId, this.cacheDays);
    if (vigentes.length > 0) {
      return { generated: false, advices: vigentes };
    }
    return this.generateAndPersist(userId);
  }

  /**
   * Retorna el historial paginado de consejos con filtro opcional por tipo.
   */
  async getAdviceHistory(userId, options = {}) {
    const tipo = options.tipo && TIPOS_VALIDOS.has(options.tipo) ? options.tipo : null;
    const limit = Math.min(Number(options.limit) || 30, 100);
    const offset = Math.max(Number(options.offset) || 0, 0);

    const { count, rows } = await this.consejoIaRepository.findHistoryByUserId(userId, {
      limit,
      offset,
      tipo
    });

    return {
      items: rows,
      total: count,
      limit,
      offset,
      hasMore: offset + rows.length < count
    };
  }

  /**
   * Fuerza la generacion de nuevos consejos ignorando el cache.
   */
  async forceRegenerate(userId) {
    return this.generateAndPersist(userId);
  }

  /**
   * Estadisticas para mostrar en la seccion de Aprendizaje.
   */
  async getAdviceStats(userId) {
    const [total, porTipo, ultimo] = await Promise.all([
      this.consejoIaRepository.countTotalByUser(userId),
      this.consejoIaRepository.countByUserAndType(userId),
      this.consejoIaRepository.findLastByUserId(userId)
    ]);

    const tipoMasFrecuente = Object.entries(porTipo).reduce(
      (acc, [tipo, count]) => (count > acc.count ? { tipo, count } : acc),
      { tipo: null, count: 0 }
    );

    let proximaRegeneracion = null;
    if (ultimo) {
      const next = new Date(ultimo.fechaGeneracion);
      next.setDate(next.getDate() + this.cacheDays);
      proximaRegeneracion = next.toISOString();
    }

    return {
      total,
      porTipo,
      tipoMasFrecuente: tipoMasFrecuente.tipo,
      fechaUltimo: ultimo ? ultimo.fechaGeneracion : null,
      proximaRegeneracion,
      cacheDays: this.cacheDays
    };
  }

  async generateAndPersist(userId) {
    const context = await this.buildFinancialContext(userId);
    let rawAdvices;
    try {
      rawAdvices = await this.advisor.generateAdvice(context);
    } catch (err) {
      throw new HttpError(502, 'No se pudieron generar los consejos en este momento.', {
        cause: err.message
      });
    }

    const normalized = this.normalizeAdvices(rawAdvices);
    if (normalized.length === 0) {
      throw new HttpError(502, 'El asesor no retorno consejos validos.');
    }

    const now = new Date();
    const toPersist = normalized.map((advice) => ({
      userId,
      contenido: advice.contenido,
      tipo: advice.tipo,
      fechaGeneracion: now
    }));

    const saved = await this.consejoIaRepository.createMany(toPersist);
    return { generated: true, advices: saved };
  }

  /**
   * Construye el contexto que recibe el advisor.
   */
  async buildFinancialContext(userId) {
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - ANALYSIS_WINDOW_DAYS);

    const fromStr = periodStart.toISOString().slice(0, 10);
    const toStr = now.toISOString().slice(0, 10);

    const [transactions, budgets] = await Promise.all([
      this.transactionRepository.findByFilters({
        where: { userId, fecha: { [Op.between]: [fromStr, toStr] } }
      }),
      this.budgetRepository ? this.budgetRepository.findByUser(userId) : Promise.resolve([])
    ]);

    const health = this.financialHealthAnalyzer.analyzeHealth({
      transactions,
      budgets,
      now,
      windowDays: ANALYSIS_WINDOW_DAYS
    });

    const nivel = LEVEL_MAP[health.level.key] || 'neutral';
    const topCategoriasGasto = computeTopExpenseCategories(transactions, 3);

    return {
      score: health.score,
      nivel,
      metricas: {
        tasaAhorro: health.metrics.savingRate,
        ratioGasto: health.metrics.expenseRatio,
        cumplimientoPresupuesto: health.metrics.budgetOvershootRel,
        cargaDeuda: health.metrics.debtLoad
      },
      topCategoriasGasto,
      totals: health.totals,
      range: health.range
    };
  }

  normalizeAdvices(raw) {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        const tipo = String(item?.tipo || '').toLowerCase().trim();
        const contenido = String(item?.contenido || '').trim();
        if (!TIPOS_VALIDOS.has(tipo) || !contenido) return null;
        return { tipo, contenido: contenido.slice(0, 800) };
      })
      .filter(Boolean)
      .slice(0, 5);
  }
}

function computeTopExpenseCategories(transactions, n = 3) {
  const totals = new Map();
  for (const tx of transactions) {
    if (tx.category?.tipo !== 'gasto') continue;
    const nombre = tx.category?.nombre || 'Sin categoria';
    const monto = currencyConfig.toBase(tx.monto, tx.currency);
    totals.set(nombre, (totals.get(nombre) || 0) + monto);
  }
  return Array.from(totals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([nombre, total]) => ({ nombre, total: Number(total.toFixed(2)) }));
}

module.exports = AdviceService;
