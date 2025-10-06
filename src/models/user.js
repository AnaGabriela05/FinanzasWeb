const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },

  nombre: { type: DataTypes.STRING(80), allowNull: false },

  correo: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },

  passwordHash: { type: DataTypes.STRING(120), allowNull: false },

  // 🔹 Nuevos campos para bloqueo
  failedLoginAttempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  lockUntil: {
    type: DataTypes.DATE,   // en SQLite quedará TEXT, perfecto para timestamps ISO
    allowNull: true
  }
}, {
  tableName: 'users',
  indexes: [{ unique: true, fields: ['correo'] }]
});

module.exports = User;