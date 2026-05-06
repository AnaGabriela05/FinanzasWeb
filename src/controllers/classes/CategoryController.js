const BaseController = require('../BaseController');

class CategoryController extends BaseController {
  constructor(categoryService) {
    super();
    this.categoryService = categoryService;

    this.create = this.create.bind(this);
    this.list = this.list.bind(this);
    this.listadoTotal = this.listadoTotal.bind(this);
    this.update = this.update.bind(this);
    this.usage = this.usage.bind(this);
    this.remove = this.remove.bind(this);
    this.restore = this.restore.bind(this);
  }

  create(req, res) {
    return this.execute(res, () => this.categoryService.create(req.user, req.body), 201);
  }

  list(req, res) {
    return this.execute(res, () => this.categoryService.list(req.user, req.query));
  }

  listadoTotal(req, res) {
    return this.execute(res, () => this.categoryService.listadoTotal(req.user));
  }

  update(req, res) {
    return this.execute(res, () => this.categoryService.update(req.user, req.params.id, req.body));
  }

  usage(req, res) {
    return this.execute(res, () => this.categoryService.usage(req.user, req.params.id, req.query));
  }

  remove(req, res) {
    return this.execute(res, () => this.categoryService.remove(req.user, req.params.id, req.query));
  }

  restore(req, res) {
    return this.execute(res, () => this.categoryService.restore(req.user, req.params.id));
  }
}

module.exports = CategoryController;
