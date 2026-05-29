const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ExportLog = sequelize.define('ExportLog', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  formato: {
    type: DataTypes.ENUM('pdf', 'xlsx'),
    allowNull: false
  },
  desde: { type: DataTypes.DATEONLY, allowNull: true },
  hasta: { type: DataTypes.DATEONLY, allowNull: true },
  categoryId: { type: DataTypes.INTEGER, allowNull: true },
  paymentMethodId: { type: DataTypes.INTEGER, allowNull: true },
  transactionType: {
    type: DataTypes.ENUM('ingreso', 'gasto'),
    allowNull: true
  },
  nombreArchivo: { type: DataTypes.STRING(180), allowNull: false }
}, {
  tableName: 'export_logs'
});

module.exports = ExportLog;
