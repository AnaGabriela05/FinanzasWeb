const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

const MAX_ATTEMPTS = 3;
const LOCK_MINUTES = 10;

exports.register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { nombre, correo, password } = req.body;
    const exists = await User.findOne({ where: { correo } });
    if (exists) return res.status(409).json({ error: 'El correo ya está registrado' });

    const userRole = await Role.findOne({ where: { nombre: 'usuario' } });
    const roleId = userRole ? userRole.id : null;

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ nombre, correo, passwordHash, roleId });
    return res.status(201).json({ message: 'Usuario registrado correctamente', user: { id: user.id, nombre, correo } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    const user = await User.findOne({
      where: { correo },
      include: [{ model: Role, as: 'role' }]
    });

    // Respuesta genérica (no revelar si existe o no)
    const invalid = () => res.status(401).json({ error: 'Credenciales inválidas' });
    if (!user) return invalid();

    // ¿Cuenta bloqueada?
    const now = new Date();
    if (user.lockUntil && new Date(user.lockUntil) > now) {
      const ms = new Date(user.lockUntil) - now;
      const mins = Math.ceil(ms / 60000);
      return res.status(423).json({
        error: `Cuenta bloqueada por múltiples intentos. Intenta de nuevo en ~${mins} min.`
      });
    }

    // Validar password
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      // Incremento atómico para evitar condiciones de carrera
      await user.increment('failedLoginAttempts');
      await user.reload();

      if (user.failedLoginAttempts >= MAX_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        user.failedLoginAttempts = 0; // (opcional) reiniciar contador al bloquear
        await user.save();
        return res.status(423).json({
          error: `Cuenta bloqueada por ${LOCK_MINUTES} minutos por múltiples intentos.`
        });
      }
      return invalid();
    }

    // Login OK: limpiar bloqueo/contador
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

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        correo: user.correo,
        role: user.role?.nombre || 'usuario'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};