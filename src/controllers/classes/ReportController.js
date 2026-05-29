const BaseController = require('../BaseController');

class ReportController extends BaseController {
  constructor(reportService) {
    super();
    this.reportService = reportService;

    this.transactionsExport = this.transactionsExport.bind(this);
    this.insights = this.insights.bind(this);
    this.overview = this.overview.bind(this);
    this.listExports = this.listExports.bind(this);
  }

  listExports(req, res) {
    return this.execute(res, () => this.reportService.listExports(req.user, req.query));
  }

  async transactionsExport(req, res) {
    try {
      const report = await this.reportService.exportTransactions(req.user, req.query);
      res.setHeader('Content-Type', report.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
      return res.send(report.buffer);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message || 'Error interno' });
    }
  }

  insights(req, res) {
    return this.execute(res, () => this.reportService.getInsights(req.user, req.query));
  }

  overview(req, res) {
    return this.execute(res, () => this.reportService.getOverview(req.user, req.query));
  }
}

module.exports = ReportController;
