const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizAnswer = sequelize.define('QuizAnswer', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  attemptId: { type: DataTypes.INTEGER, allowNull: false },
  questionId: { type: DataTypes.INTEGER, allowNull: false },
  respuestaUsuario: {
    type: DataTypes.STRING(1),
    allowNull: false,
    validate: { isIn: [['A', 'B', 'C', 'D']] }
  },
  esCorrecta: { type: DataTypes.BOOLEAN, allowNull: false },
  tiempoSegundos: { type: DataTypes.INTEGER, allowNull: true }
}, {
  tableName: 'quiz_answers',
  timestamps: false,
  indexes: [{ fields: ['attemptId'] }]
});

module.exports = QuizAnswer;
