const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Budget = sequelize.define('Budget', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  montoMensual: { type: DataTypes.FLOAT, allowNull: false },
  mes: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 12 } },
  anio: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'budgets' });

module.exports = Budget;
