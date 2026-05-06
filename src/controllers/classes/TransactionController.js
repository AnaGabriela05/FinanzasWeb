const BaseController = require('../BaseController');

class TransactionController extends BaseController {
  constructor(transactionService) {
    super();
    this.transactionService = transactionService;

    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.update = this.update.bind(this);
    this.remove = this.remove.bind(this);
  }

  create(req, res) {
    return this.execute(res, () => this.transactionService.create(req.user, req.body), 201);
  }

  list(req, res) {
    return this.execute(res, () => this.transactionService.list(req.user, req.query));
  }

  update(req, res) {
    return this.execute(res, () => this.transactionService.update(req.user, req.params.id, req.body));
  }

  remove(req, res) {
    return this.execute(res, () => this.transactionService.remove(req.user, req.params.id));
  }
}

module.exports = TransactionController;
