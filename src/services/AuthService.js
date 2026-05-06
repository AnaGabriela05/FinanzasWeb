const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, Role } = require('../models');
const HttpError = require('../errors/HttpError');

const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 10;

class AuthService {
  validateRegisterRequest(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpError(400, 'Datos de registro invalidos', errors.array());
    }
  }

  async register(req) {
    this.validateRegisterRequest(req);

    const { nombre, correo, password } = req.body;
    const exists = await User.findOne({ where: { correo } });
    if (exists) {
      throw new HttpError(409, 'El correo ya esta registrado');
    }

    const userRole = await Role.findOne({ where: { nombre: 'usuario' } });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
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

  async login(payload) {
    const { correo, password } = payload;
    const user = await User.findOne({
      where: { correo },
      include: [{ model: Role, as: 'role' }]
    });

    if (!user) {
      throw new HttpError(401, 'Credenciales invalidas');
    }

    const now = new Date();
    if (user.lockUntil && new Date(user.lockUntil) > now) {
      const minutes = Math.ceil((new Date(user.lockUntil) - now) / 60000);
      throw new HttpError(423, `Cuenta bloqueada por multiples intentos. Intenta de nuevo en ~${minutes} min.`);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      await user.increment('failedLoginAttempts');
      await user.reload();

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.failedLoginAttempts = 0;
        await user.save();
        throw new HttpError(423, `Cuenta bloqueada por ${LOCK_MINUTES} minutos por multiples intentos.`);
      }

      throw new HttpError(401, 'Credenciales invalidas');
    }

    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = null;
      await user.save();
    }

    const token = jwt.sign(
      {
        id: user.id,
        correo: user.correo,
        role: user.role?.nombre || 'usuario'
      },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: '8h' }
    );

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
