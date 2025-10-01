const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LearningLesson = sequelize.define('LearningLesson', {
  titulo:      { type: DataTypes.STRING, allowNull: false },
  contenido:   { type: DataTypes.TEXT, allowNull: false }, // HTML/Markdown
  videoUrl:    { type: DataTypes.STRING },
  duracionMin: { type: DataTypes.INTEGER, defaultValue: 5 },
  orden:       { type: DataTypes.INTEGER, defaultValue: 0 },
  publico:     { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'learning_lessons',
  timestamps: true
});

module.exports = LearningLesson;
