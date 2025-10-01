const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserCategoryHide = sequelize.define('UserCategoryHide', {
  userId:     { type: DataTypes.INTEGER, allowNull: false },
  categoryId: { type: DataTypes.INTEGER, allowNull: false },
  hidden:     { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
  tableName: 'user_category_hides',
  indexes: [{ unique: true, fields: ['userId', 'categoryId'] }]
});

module.exports = UserCategoryHide;
