const _ = require('lodash');
const currencyConfig = require('../../config/currency');

// Pesos por defecto para el score (suma 1.0)
// 40% ahorro: lo mas importante (capacidad real de generar excedente).
// 30% gastos vs ingresos: presion sobre el flujo.
// 20% cumplimiento de presupuestos: disciplina autoimpuesta.
// 10% carga de deuda: proporcion del ingreso destinada a deuda detectada.
const DEFAULT_WEIGHTS = {
  savingRate: 0.4,
  expenseRatio: 0.3,
  budgetOvershoot: 0.2,
  debtLoad: 0.1
};

// Devuelve el monto convertido a PEN (moneda base) para agregaciones consistentes.
function montoEnPen(transaction) {
  return currencyConfig.toBase(transaction.monto, transaction.currency);
}

// Heuristica: se consideran "deuda" las categorias cuyo nombre matchea estos terminos.
// TODO: reemplazar por un flag explicito en Category cuando se modele.
const DEBT_NAME_REGEX = /deuda|cr[eé]dito|tarjeta|pr[eé]stamo|cuota/i;

class FinancialHealthAnalyzer {
  analyzeTransactions(transactions) {
    // Normaliza cada transaccion a la forma que necesitan las agregaciones
    // (monto en moneda base, mes YYYY-MM, tipo y nombre de categoria).
    const normalized = transactions.map((transaction) => ({
      tipo: transaction.category?.tipo || '',
      monto: montoEnPen(transaction),
      ym: String(transaction.fecha).slice(0, 7),
      categoryName: transaction.category?.nombre || '-'
    }));

    const ingresoRows = normalized.filter((row) => row.tipo === 'ingreso');
    const gastoRows = normalized.filter((row) => row.tipo === 'gasto');

    const ingresos = _.sumBy(ingresoRows, 'monto');
    const gastos = _.sumBy(gastoRows, 'monto');

    // Agrega por mes (ingresos/gastos) y por categoria (solo gastos) con lodash.
    const incByMonth = _.mapValues(_.groupBy(ingresoRows, 'ym'), (rows) => _.sumBy(rows, 'monto'));
    const expByMonth = _.mapValues(_.groupBy(gastoRows, 'ym'), (rows) => _.sumBy(rows, 'monto'));
    const expByCategory = _.mapValues(_.groupBy(gastoRows, 'categoryName'), (rows) => _.sumBy(rows, 'monto'));

    const labels = _.orderBy(_.union(Object.keys(incByMonth), Object.keys(expByMonth)));

    return {
      totals: {
        ingresos,
        gastos,
        saldo: ingresos - gastos
      },
      monthly: {
        labels,
        income: labels.map((label) => incByMonth[label] || 0),
        expense: labels.map((label) => expByMonth[label] || 0)
      },
      categories: {
        labels: Object.keys(expByCategory),
        expense: Object.values(expByCategory)
      },
      count: transactions.length
    };
  }

  analyzeHealth({ transactions, budgets, now = new Date(), windowDays = 90 }) {
    const periodEnd = new Date(now);
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - windowDays);

    const fromStr = periodStart.toISOString().slice(0, 10);
    const toStr = periodEnd.toISOString().slice(0, 10);

    // Filtra transacciones a la ventana unica (FIX bug 1: ya no mezcla 90 dias con todo-historico)
    const inWindow = transactions.filter((tx) => {
      const fecha = String(tx.fecha).slice(0, 10);
      return fecha >= fromStr && fecha <= toStr;
    });

    let ingresos = 0;
    let gastos = 0;
    let gastosDeuda = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    for (const tx of inWindow) {
      const monto = montoEnPen(tx);
      const tipo = tx.category?.tipo;
      if (tipo === 'ingreso') {
        ingresos += monto;
        incomeCount += 1;
      } else if (tipo === 'gasto') {
        gastos += monto;
        expenseCount += 1;
        if (DEBT_NAME_REGEX.test(tx.category?.nombre || '')) {
          gastosDeuda += monto;
        }
      }
    }

    const saldo = ingresos - gastos;
    const transactionCount = inWindow.length;
    const range = { from: fromStr, to: toStr, days: windowDays };

    // FIX bug 2: usuario sin datos -> nivel "neutral", no "amarillo".
    if (incomeCount === 0 && expenseCount === 0) {
      return {
        score: null,
        level: {
          key: 'neutral',
          label: 'Sin datos',
          title: 'Aun no podemos evaluar tu salud financiera',
          description: `Registra al menos un movimiento en los ultimos ${windowDays} dias para activar el indicador.`
        },
        metrics: {
          savingRate: null,
          expenseRatio: null,
          budgetOvershootRel: null,
          debtLoad: null
        },
        totals: { ingresos, gastos, saldo, transactionCount },
        range
      };
    }

    // Saving rate. Si no hay ingresos pero hay gastos: tasa negativa = -1 (penalizacion clara).
    const savingRate = ingresos > 0 ? saldo / ingresos : (gastos > 0 ? -1 : 0);

    // FIX bug 3: si gastos > 0 e ingresos === 0, expenseRatio = Infinity (no fallback a 1).
    const expenseRatio = ingresos > 0
      ? gastos / ingresos
      : (gastos > 0 ? Infinity : 0);

    // Carga de deuda como % del ingreso. Misma logica que expenseRatio para ingresos=0.
    const debtLoad = ingresos > 0
      ? gastosDeuda / ingresos
      : (gastosDeuda > 0 ? Infinity : 0);

    // Presupuestos activos = los que cubren algun mes de la ventana.
    const monthsInPeriod = collectMonthsInRange(periodStart, periodEnd);
    const activeBudgets = (budgets || []).filter((budget) =>
      monthsInPeriod.some(({ year, month }) =>
        Number(budget.mes) === month && Number(budget.anio) === year
      )
    );

    let budgetOvershootRel = null;
    if (activeBudgets.length > 0) {
      const sumBudget = activeBudgets.reduce(
        (sum, budget) => sum + (Number(budget.montoMensual) || 0),
        0
      );
      const budgetCategoryIds = new Set(
        activeBudgets
          .map((budget) => budget.categoryId ?? budget.category?.id)
          .filter(Boolean)
      );

      const sumSpent = inWindow
        .filter((tx) => tx.category?.tipo === 'gasto' && budgetCategoryIds.has(tx.category.id))
        .reduce((sum, tx) => sum + montoEnPen(tx), 0);

      const extra = Math.max(0, sumSpent - sumBudget);
      budgetOvershootRel = sumBudget > 0 ? extra / sumBudget : 0;
    }

    const s1 = scoreSavingRate(savingRate);
    const s2 = scoreExpenseRatio(expenseRatio);
    const s3 = budgetOvershootRel === null ? null : scoreBudgetHit(budgetOvershootRel);
    const s4 = scoreDebtLoad(debtLoad);

    // FIX bug 4: si no hay presupuestos, excluye la metrica y renormaliza pesos.
    let score;
    if (s3 === null) {
      const totalWeight = DEFAULT_WEIGHTS.savingRate
        + DEFAULT_WEIGHTS.expenseRatio
        + DEFAULT_WEIGHTS.debtLoad;
      score = Math.round(
        (s1 * DEFAULT_WEIGHTS.savingRate
          + s2 * DEFAULT_WEIGHTS.expenseRatio
          + s4 * DEFAULT_WEIGHTS.debtLoad) / totalWeight
      );
    } else {
      score = Math.round(
        s1 * DEFAULT_WEIGHTS.savingRate
        + s2 * DEFAULT_WEIGHTS.expenseRatio
        + s3 * DEFAULT_WEIGHTS.budgetOvershoot
        + s4 * DEFAULT_WEIGHTS.debtLoad
      );
    }

    const level = computeHealthLevel(score, saldo, gastos, ingresos);

    return {
      score,
      level,
      metrics: {
        savingRate,
        expenseRatio: Number.isFinite(expenseRatio) ? expenseRatio : null,
        budgetOvershootRel,
        debtLoad: Number.isFinite(debtLoad) ? debtLoad : null
      },
      totals: { ingresos, gastos, saldo, transactionCount },
      range
    };
  }
}

function scoreSavingRate(rate) {
  if (rate > 0.2) return 100;
  if (rate >= 0.1) return 70;
  if (rate >= 0) return 40;
  return 10;
}

function scoreExpenseRatio(rate) {
  if (rate === Infinity) return 0;
  if (rate < 0.8) return 100;
  if (rate <= 0.95) return 70;
  return 40;
}

function scoreBudgetHit(rate) {
  if (rate <= 0) return 100;
  if (rate <= 0.1) return 70;
  return 40;
}

function scoreDebtLoad(rate) {
  if (rate === Infinity) return 0;
  if (rate < 0.1) return 100;
  if (rate <= 0.25) return 70;
  return 40;
}

function computeHealthLevel(score, saldo, gastos, ingresos) {
  if (gastos > ingresos || saldo < 0 || score < 50) {
    return {
      key: 'danger',
      label: 'Rojo',
      title: 'Atencion inmediata',
      description: 'Tus gastos estan superando lo saludable para tu nivel de ingresos.'
    };
  }
  if (score < 75 || gastos >= ingresos * 0.9) {
    return {
      key: 'warning',
      label: 'Amarillo',
      title: 'Zona de cuidado',
      description: 'Tus gastos estan cerca de tus ingresos. Conviene vigilar el margen.'
    };
  }
  return {
    key: 'success',
    label: 'Verde',
    title: 'Buen equilibrio',
    description: 'Tus ingresos sostienen bien tus gastos y mantienes saldo positivo.'
  };
}

function collectMonthsInRange(startDate, endDate) {
  const months = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
  while (cursor <= end) {
    months.push({ year: cursor.getFullYear(), month: cursor.getMonth() + 1 });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

module.exports = FinancialHealthAnalyzer;
