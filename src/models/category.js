const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Category = sequelize.define('Category', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(60), allowNull: false },
  tipo: { type: DataTypes.ENUM('ingreso', 'gasto'), allowNull: false, defaultValue: 'gasto' },
  global: { type: DataTypes.BOOLEAN, defaultValue: false } // true = visible para todos, admin-only CRUD
}, { tableName: 'categories' });

module.exports = Category;
