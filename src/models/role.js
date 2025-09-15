const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Role = sequelize.define('Role', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(40), allowNull: false, unique: true } // 'admin', 'usuario'
}, { tableName: 'roles' });

module.exports = Role;
