const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserLessonProgress = sequelize.define('UserLessonProgress', {
  completado: { type: DataTypes.BOOLEAN, defaultValue: false },
  puntaje:    { type: DataTypes.INTEGER, defaultValue: 0 },
  intentos:   { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
  tableName: 'user_lesson_progress',
  timestamps: true
});

module.exports = UserLessonProgress;
