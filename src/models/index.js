// models/index.js
const sequelize       = require('../config/database');
const { DataTypes }   = require('sequelize');      // ← IMPORTA DataTypes

const Role            = require('./role');
const User            = require('./user');
const Category        = require('./category');
const PaymentMethod   = require('./paymentMethod');
const Transaction     = require('./transaction');
const Budget          = require('./budget');
const UserCategoryHide= require('./userCategoryHide');

// Instancia del modelo LearningState (factory)
const LearningState   = require('./LearningState')(sequelize, DataTypes); // ← OK

// --- Relaciones existentes ---
Role.hasMany(User, { foreignKey: 'roleId', as: 'users' });
User.belongsTo(Role, { foreignKey: 'roleId', as: 'role' });

User.hasMany(Category,      { foreignKey: 'userId', as: 'categories' });
Category.belongsTo(User,    { foreignKey: 'userId', as: 'user' });

User.hasMany(PaymentMethod, { foreignKey: 'userId', as: 'paymentMethods' });
PaymentMethod.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Transaction,   { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(Budget,        { foreignKey: 'userId', as: 'budgets' });
Budget.belongsTo(User,      { foreignKey: 'userId', as: 'user' });

Category.hasMany(Transaction, { foreignKey: 'categoryId', as: 'transactions' });
Transaction.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

PaymentMethod.hasMany(Transaction, { foreignKey: 'paymentMethodId', as: 'transactions' });
Transaction.belongsTo(PaymentMethod, { foreignKey: 'paymentMethodId', as: 'paymentMethod' });

Category.hasMany(Budget, { foreignKey: 'categoryId', as: 'budgets' });
Budget.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

UserCategoryHide.belongsTo(User,    { foreignKey: 'userId',    as: 'user' });
UserCategoryHide.belongsTo(Category,{ foreignKey: 'categoryId',as: 'category' });

// Exporta también LearningState
module.exports = {
  sequelize,
  Role, User, Category, PaymentMethod, Transaction, Budget, UserCategoryHide,
  LearningState,                      // ← AQUI
};
