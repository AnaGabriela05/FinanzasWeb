const HttpError = require('../errors/HttpError');

class ReportService {
  constructor({ reportRepository, financialHealthAnalyzer, excelReportExporter, pdfReportExporter }) {
    this.reportRepository = reportRepository;
    this.financialHealthAnalyzer = financialHealthAnalyzer;
    this.excelReportExporter = excelReportExporter;
    this.pdfReportExporter = pdfReportExporter;
  }

  async exportTransactions(user, query) {
    const transactions = await this.reportRepository.findTransactionsForUser(user.id, query);
    const analysis = this.financialHealthAnalyzer.analyzeTransactions(transactions);
    const fileName = this.buildFileName(query, query.format);

    if (query.format === 'xlsx') {
      const buffer = await this.excelReportExporter.exportTransactions({ transactions, analysis, query });
      return {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        fileName,
        buffer: Buffer.from(buffer)
      };
    }

    if (query.format && query.format !== 'pdf') {
      throw new HttpError(400, 'Formato no soportado');
    }

    const buffer = await this.pdfReportExporter.exportTransactions({ transactions, analysis, query });
    return {
      contentType: 'application/pdf',
      fileName,
      buffer
    };
  }

  async getInsights(user, query) {
    const transactions = await this.reportRepository.findTransactionsForUser(user.id, query);
    return this.financialHealthAnalyzer.analyzeTransactions(transactions);
  }

  buildFileName(query, format = 'pdf') {
    const label = `${query.from || 'inicio'}_a_${query.to || 'hoy'}`.replace(/:/g, '-');
    const extension = format === 'xlsx' ? 'xlsx' : 'pdf';
    return `reporte_transacciones_${label}.${extension}`;
  }
}

module.exports = ReportService;
