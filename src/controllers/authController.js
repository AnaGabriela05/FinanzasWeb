const { User, Role } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

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
    const user = await User.findOne({ where: { correo }, include: [{ model: Role, as: 'role' }] });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ id: user.id, correo: user.correo, role: user.role?.nombre || 'usuario' }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, nombre: user.nombre, correo: user.correo, role: user.role?.nombre || 'usuario' } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
