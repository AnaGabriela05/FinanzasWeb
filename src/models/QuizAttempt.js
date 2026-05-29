const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizAttempt = sequelize.define('QuizAttempt', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  videoId: { type: DataTypes.STRING(60), allowNull: false },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: { min: 0, max: 100 }
  },
  totalPreguntas: { type: DataTypes.INTEGER, allowNull: false },
  correctas: { type: DataTypes.INTEGER, allowNull: false },
  duracionSegundos: { type: DataTypes.INTEGER, allowNull: true },
  esPrimerIntento: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  cuentaParaScore: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
}, {
  tableName: 'quiz_attempts',
  timestamps: true,
  indexes: [
    { fields: ['userId', 'videoId'] },
    { fields: ['userId', 'cuentaParaScore'] }
  ]
});

module.exports = QuizAttempt;
