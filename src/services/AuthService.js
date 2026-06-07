const HttpError = require('../errors/HttpError');
const logger = require('../config/logger');
const { sanitizeText, sanitizeEmail, maskEmail } = require('../utils/sanitize');

class AuthService {
  constructor({ userRepository, passwordHasher, tokenIssuer, loginAttemptPolicy }) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
    this.tokenIssuer = tokenIssuer;
    this.loginAttemptPolicy = loginAttemptPolicy;
  }

  async register({ nombre, correo, password }) {
    // Saneo en la capa de servicio (defensa en profundidad sobre express-validator).
    const correoNorm = sanitizeEmail(correo);
    if (!correoNorm) {
      throw new HttpError(400, 'Correo invalido');
    }
    const nombreNorm = sanitizeText(nombre);

    const exists = await this.userRepository.findByEmail(correoNorm);
    if (exists) {
      throw new HttpError(409, 'El correo ya esta registrado');
    }

    const userRole = await this.userRepository.findRoleByName('usuario');
    const passwordHash = await this.passwordHasher.hash(password);
    const user = await this.userRepository.create({
      nombre: nombreNorm,
      correo: correoNorm,
      passwordHash,
      roleId: userRole ? userRole.id : null
    });

    logger.info('user_registered', { userId: user.id, correo: maskEmail(correoNorm) });

    return {
      status: 201,
      body: {
        message: 'Usuario registrado correctamente',
        user: { id: user.id, nombre: nombreNorm, correo: correoNorm }
      }
    };
  }

  async login({ correo, password }) {
    // Normaliza el correo para que el lookup case con lo almacenado.
    const correoNorm = sanitizeEmail(correo) || String(correo == null ? '' : correo).trim().toLowerCase();
    const maskedEmail = maskEmail(correoNorm);

    const user = await this.userRepository.findByEmailWithRole(correoNorm);
    if (!user) {
      // Evento de seguridad: intento de login para correo inexistente.
      logger.warn('login_failed', { reason: 'unknown_email', correo: maskedEmail });
      throw new HttpError(401, 'Credenciales invalidas');
    }

    this.loginAttemptPolicy.assertNotLocked(user);

    const isValid = await this.passwordHasher.compare(password, user.passwordHash);
    if (!isValid) {
      // Evento de seguridad: contraseña incorrecta (nunca se loguea la password).
      logger.warn('login_failed', { reason: 'bad_password', userId: user.id, correo: maskedEmail });
      await this.loginAttemptPolicy.registerFailure(user);
      throw new HttpError(401, 'Credenciales invalidas');
    }

    await this.loginAttemptPolicy.registerSuccess(user);

    const token = this.tokenIssuer.sign(user);
    logger.info('login_success', { userId: user.id, correo: maskedEmail });
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
