const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConsejoIa = sequelize.define('ConsejoIa', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  contenido: { type: DataTypes.TEXT, allowNull: false },
  tipo: {
    type: DataTypes.ENUM('ahorro', 'gasto', 'presupuesto', 'deuda'),
    allowNull: false
  },
  fechaGeneracion: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'consejos_ia',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['userId', 'fechaGeneracion'] }
  ]
});

module.exports = ConsejoIa;
