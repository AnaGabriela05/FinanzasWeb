const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fecha: { type: DataTypes.DATEONLY, allowNull: false },
  monto: { type: DataTypes.FLOAT, allowNull: false },
  descripcion: { type: DataTypes.STRING(200), allowNull: true }
}, { tableName: 'transactions' });

module.exports = Transaction;
