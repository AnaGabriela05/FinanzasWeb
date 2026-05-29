const BaseController = require('../BaseController');

class AdminController extends BaseController {
  constructor(adminService) {
    super();
    this.adminService = adminService;

    this.listUsers = this.listUsers.bind(this);
    this.getUserMetadata = this.getUserMetadata.bind(this);
    this.lockUser = this.lockUser.bind(this);
    this.unlockUser = this.unlockUser.bind(this);
    this.resetFailedAttempts = this.resetFailedAttempts.bind(this);

    this.createGlobalCategory = this.createGlobalCategory.bind(this);
    this.updateGlobalCategory = this.updateGlobalCategory.bind(this);
    this.archiveGlobalCategory = this.archiveGlobalCategory.bind(this);
    this.deleteGlobalCategory = this.deleteGlobalCategory.bind(this);

    this.getMetrics = this.getMetrics.bind(this);
    this.getRegistrationsChart = this.getRegistrationsChart.bind(this);
    this.getExportLogs = this.getExportLogs.bind(this);
  }

  listUsers(req, res) {
    return this.execute(res, () => this.adminService.listUsers({
      limit: req.query.limit,
      offset: req.query.offset,
      search: req.query.search,
      status: req.query.status
    }));
  }

  getUserMetadata(req, res) {
    return this.execute(res, () => this.adminService.getUserMetadata(req.params.id));
  }

  lockUser(req, res) {
    return this.execute(res, () => this.adminService.lockUser(req.params.id, req.body?.minutos));
  }

  unlockUser(req, res) {
    return this.execute(res, () => this.adminService.unlockUser(req.params.id));
  }

  resetFailedAttempts(req, res) {
    return this.execute(res, () => this.adminService.resetFailedAttempts(req.params.id));
  }

  createGlobalCategory(req, res) {
    return this.execute(res, () => this.adminService.createGlobalCategory(req.body), 201);
  }

  updateGlobalCategory(req, res) {
    return this.execute(res, () => this.adminService.updateGlobalCategory(req.params.id, req.body));
  }

  archiveGlobalCategory(req, res) {
    return this.execute(res, () => this.adminService.archiveGlobalCategory(req.params.id));
  }

  deleteGlobalCategory(req, res) {
    return this.execute(res, () => this.adminService.deleteGlobalCategory(req.params.id, req.query));
  }

  getMetrics(req, res) {
    return this.execute(res, () => this.adminService.getSystemMetrics());
  }

  getRegistrationsChart(req, res) {
    return this.execute(res, () => this.adminService.getRegistrationsChart(req.query.meses));
  }

  getExportLogs(req, res) {
    return this.execute(res, () => this.adminService.getExportLogs({
      limit: req.query.limit,
      offset: req.query.offset,
      formato: req.query.formato,
      from: req.query.from,
      to: req.query.to,
      userSearch: req.query.userSearch
    }));
  }
}

module.exports = AdminController;
