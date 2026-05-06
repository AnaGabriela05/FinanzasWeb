const BaseController = require('../BaseController');

class BudgetController extends BaseController {
  constructor(budgetService) {
    super();
    this.budgetService = budgetService;

    this.upsert = this.upsert.bind(this);
    this.list = this.list.bind(this);
    this.remove = this.remove.bind(this);
    this.update = this.update.bind(this);
  }

  upsert(req, res) {
    return this.execute(res, () => this.budgetService.upsert(req.user, req.body), 201);
  }

  list(req, res) {
    return this.execute(res, () => this.budgetService.list(req.user, req.query));
  }

  remove(req, res) {
    return this.execute(res, () => this.budgetService.remove(req.user, req.params.id));
  }

  update(req, res) {
    return this.execute(res, () => this.budgetService.update(req.user, req.params.id, req.body));
  }
}

module.exports = BudgetController;
