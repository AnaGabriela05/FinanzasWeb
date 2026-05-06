const BaseController = require('../BaseController');

class AuthController extends BaseController {
  constructor(authService) {
    super();
    this.authService = authService;

    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
  }

  async register(req, res) {
    try {
      const payload = await this.authService.register(req);
      return res.status(payload.status || 201).json(payload.body || payload);
    } catch (error) {
      if (error.status === 400 && Array.isArray(error.details)) {
        return res.status(400).json({ errors: error.details });
      }

      return res.status(error.status || 500).json({ error: error.message || 'Error interno' });
    }
  }

  login(req, res) {
    return this.execute(res, () => this.authService.login(req.body));
  }
}

module.exports = AuthController;
