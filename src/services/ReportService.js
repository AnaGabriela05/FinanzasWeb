const HttpError = require('../errors/HttpError');

class ReportService {
  constructor({
    reportRepository,
    categoryRepository,
    paymentMethodRepository,
    budgetRepository,
    exportLogRepository,
    financialHealthAnalyzer,
    excelReportExporter,
    pdfReportExporter
  }) {
    this.reportRepository = reportRepository;
    this.categoryRepository = categoryRepository;
    this.paymentMethodRepository = paymentMethodRepository;
    this.budgetRepository = budgetRepository;
    this.exportLogRepository = exportLogRepository;
    this.financialHealthAnalyzer = financialHealthAnalyzer;
    this.excelReportExporter = excelReportExporter;
    this.pdfReportExporter = pdfReportExporter;
  }

  async exportTransactions(user, query) {
    const transactions = await this.reportRepository.findTransactionsForUser(user.id, query);
    const analysis = this.financialHealthAnalyzer.analyzeTransactions(transactions);
    const requestedFormat = query.format === 'xlsx' ? 'xlsx' : 'pdf';

    if (query.format && query.format !== 'pdf' && query.format !== 'xlsx') {
      throw new HttpError(400, 'Formato no soportado');
    }

    const fileName = this.buildFileName(query, requestedFormat);
    let result;

    if (requestedFormat === 'xlsx') {
      const buffer = await this.excelReportExporter.exportTransactions({ transactions, analysis, query });
      result = {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName,
        buffer: Buffer.from(buffer)
      };
    } else {
      const buffer = await this.pdfReportExporter.exportTransactions({ transactions, analysis, query });
      result = {
        contentType: 'application/pdf',
        fileName,
        buffer
      };
    }

    // Audita la exportacion (no bloquea la respuesta si falla el log).
    if (this.exportLogRepository) {
      try {
        await this.exportLogRepository.create({
          userId: user.id,
          formato: requestedFormat,
          desde: query.from || null,
          hasta: query.to || null,
          categoryId: query.categoryId ? Number(query.categoryId) : null,
          paymentMethodId: query.paymentMethodId ? Number(query.paymentMethodId) : null,
          transactionType: query.transactionType || null,
          nombreArchivo: fileName
        });
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[ReportService] no se pudo registrar export log:', err.message);
      }
    }

    return result;
  }

  listExports(user, query = {}) {
    if (!this.exportLogRepository) return [];
    const limit = Number(query.limit) || 50;
    return this.exportLogRepository.findByUser(user.id, { limit });
  }

  async getInsights(user, query) {
    const transactions = await this.reportRepository.findTransactionsForUser(user.id, query);
    return this.financialHealthAnalyzer.analyzeTransactions(transactions);
  }

  async getOverview(user, query = {}) {
    const windowDays = Number(query.windowDays) || 90;
    const now = new Date();
    const periodStart = new Date(now);
    periodStart.setDate(periodStart.getDate() - windowDays);

    const fromStr = periodStart.toISOString().slice(0, 10);
    const toStr = now.toISOString().slice(0, 10);

    const [transactions, budgets, categories, paymentMethods] = await Promise.all([
      this.reportRepository.findTransactionsForUser(user.id, { from: fromStr, to: toStr }),
      this.budgetRepository.findByUser(user.id),
      this.categoryRepository.findVisibleForUser(user.id, false),
      this.paymentMethodRepository.findByUser(user.id, false)
    ]);

    const health = this.financialHealthAnalyzer.analyzeHealth({
      transactions,
      budgets,
      now,
      windowDays
    });

    return {
      summary: {
        ingresos: health.totals.ingresos,
        gastos: health.totals.gastos,
        saldo: health.totals.saldo,
        categoriesCount: categories.length,
        paymentMethodsCount: paymentMethods.length
      },
      transactionCount: health.totals.transactionCount,
      health: {
        score: health.score,
        level: health.level,
        metrics: health.metrics
      },
      analysisRange: health.range
    };
  }

  buildFileName(query, format = 'pdf') {
    const label = `${query.from || 'inicio'}_a_${query.to || 'hoy'}`.replace(/:/g, '-');
    const extension = format === 'xlsx' ? 'xlsx' : 'pdf';
    return `reporte_transacciones_${label}.${extension}`;
  }
}

module.exports = ReportService;
