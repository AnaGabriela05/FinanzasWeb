const BaseController = require('../BaseController');

class PaymentMethodController extends BaseController {
  constructor(paymentMethodService) {
    super();
    this.paymentMethodService = paymentMethodService;

    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.listadoTotal = this.listadoTotal.bind(this);
    this.update = this.update.bind(this);
    this.usage = this.usage.bind(this);
    this.remove = this.remove.bind(this);
  }

  create(req, res) {
    return this.execute(res, () => this.paymentMethodService.create(req.user, req.body), 201);
  }

  list(req, res) {
    return this.execute(res, () => this.paymentMethodService.list(req.user, req.query));
  }

  listadoTotal(req, res) {
    return this.execute(res, () => this.paymentMethodService.listadoTotal(req.user));
  }

  update(req, res) {
    return this.execute(res, () => this.paymentMethodService.update(req.user, req.params.id, req.body));
  }

  usage(req, res) {
    return this.execute(res, () => this.paymentMethodService.usage(req.user, req.params.id));
  }

  remove(req, res) {
    return this.execute(res, () => this.paymentMethodService.remove(req.user, req.params.id, req.query));
  }
}

module.exports = PaymentMethodController;
