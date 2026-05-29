const HttpError = require('../errors/HttpError');

class AuthService {
  constructor({ userRepository, passwordHasher, tokenIssuer, loginAttemptPolicy }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenIssuer = tokenIssuer;
    this.loginAttemptPolicy = loginAttemptPolicy;
  }

  async register({ nombre, correo, password }) {
    const exists = await this.userRepository.findByEmail(correo);
    if (exists) {
      throw new HttpError(409, 'El correo ya esta registrado');
    }

    const userRole = await this.userRepository.findRoleByName('usuario');
    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.userRepository.create({
      nombre,
      correo,
      passwordHash,
      roleId: userRole ? userRole.id : null
    });

    return {
      status: 201,
      body: {
        message: 'Usuario registrado correctamente',
        user: { id: user.id, nombre, correo }
      }
    };
  }

  async login({ correo, password }) {
    const user = await this.userRepository.findByEmailWithRole(correo);
    if (!user) {
      throw new HttpError(401, 'Credenciales invalidas');
    }

    this.loginAttemptPolicy.assertNotLocked(user);

    const isValid = await this.passwordHasher.compare(password, user.passwordHash);
    if (!isValid) {
      await this.loginAttemptPolicy.registerFailure(user);
      throw new HttpError(401, 'Credenciales invalidas');
    }

    await this.loginAttemptPolicy.registerSuccess(user);

    const token = this.tokenIssuer.sign(user);
    return {
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        role: user.role?.nombre || 'usuario'
      }
    };
  }
}

module.exports = AuthService;
