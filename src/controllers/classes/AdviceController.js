const BaseController = require('../BaseController');

class AdviceController extends BaseController {
  constructor(adviceService) {
    super();
    this.adviceService = adviceService;

    this.getCurrent = this.getCurrent.bind(this);
    this.getHistory = this.getHistory.bind(this);
    this.regenerate = this.regenerate.bind(this);
    this.getStats = this.getStats.bind(this);
  }

  getCurrent(req, res) {
    return this.execute(res, () => this.adviceService.getOrGenerateAdvice(req.user.id));
  }

  getHistory(req, res) {
    return this.execute(res, () => this.adviceService.getAdviceHistory(req.user.id, {
      limit: req.query.limit,
      offset: req.query.offset,
      tipo: req.query.tipo
    }));
  }

  regenerate(req, res) {
    return this.execute(res, () => this.adviceService.forceRegenerate(req.user.id), 201);
  }

  getStats(req, res) {
    return this.execute(res, () => this.adviceService.getAdviceStats(req.user.id));
  }
}

module.exports = AdviceController;
