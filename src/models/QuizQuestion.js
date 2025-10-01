const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizQuestion = sequelize.define('QuizQuestion', {
  enunciado: { type: DataTypes.TEXT, allowNull: false },
  opciones: {
    type: DataTypes.TEXT, allowNull: false,
    get() {
      const raw = this.getDataValue('opciones');
      try { return JSON.parse(raw || '[]'); } catch { return []; }
    },
    set(v) { this.setDataValue('opciones', JSON.stringify(v || [])); }
  },
  correcta:  { type: DataTypes.INTEGER, allowNull: false } // índice correcto
}, {
  tableName: 'quiz_questions',
  timestamps: true
});

module.exports = QuizQuestion;
