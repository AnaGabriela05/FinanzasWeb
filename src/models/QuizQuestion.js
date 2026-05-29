const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QuizQuestion = sequelize.define('QuizQuestion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  videoId: { type: DataTypes.STRING(60), allowNull: false },
  pregunta: { type: DataTypes.TEXT, allowNull: false },
  opcionA: { type: DataTypes.TEXT, allowNull: false },
  opcionB: { type: DataTypes.TEXT, allowNull: false },
  opcionC: { type: DataTypes.TEXT, allowNull: false },
  opcionD: { type: DataTypes.TEXT, allowNull: false },
  respuestaCorrecta: {
    type: DataTypes.STRING(1),
    allowNull: false,
    validate: { isIn: [['A', 'B', 'C', 'D']] }
  },
  dificultad: {
    type: DataTypes.ENUM('facil', 'media', 'dificil'),
    allowNull: false,
    defaultValue: 'media'
  },
  explicacion: { type: DataTypes.TEXT, allowNull: true },
  origen: {
    type: DataTypes.ENUM('seed', 'ai'),
    allowNull: false,
    defaultValue: 'seed'
  }
}, {
  tableName: 'quiz_questions',
  timestamps: true,
  indexes: [{ fields: ['videoId'] }]
});

module.exports = QuizQuestion;
