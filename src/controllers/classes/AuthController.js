const BaseController = require('../BaseController');

class AuthController extends BaseController {
  constructor(authService) {
    super();
    this.authService = authService;

    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
  }

  register(req, res) {
    const { nombre, correo, password } = req.body;
    return this.execute(res, () => this.authService.register({ nombre, correo, password }));
  }

  login(req, res) {
    const { correo, password } = req.body;
    return this.execute(res, () => this.authService.login({ correo, password }));
  }
}

module.exports = AuthController;
