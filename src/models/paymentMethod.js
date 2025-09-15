const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PaymentMethod = sequelize.define('PaymentMethod', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(60), allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'payment_methods' });

module.exports = PaymentMethod;
