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
const ExportLog       = require('./exportLog');
const ConsejoIa       = require('./ConsejoIa');
const QuizQuestion    = require('./QuizQuestion');
const QuizAttempt     = require('./QuizAttempt');
const QuizAnswer      = require('./QuizAnswer');

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

User.hasMany(ExportLog, { foreignKey: 'userId', as: 'exportLogs' });
ExportLog.belongsTo(User,           { foreignKey: 'userId',           as: 'user' });
ExportLog.belongsTo(Category,       { foreignKey: 'categoryId',       as: 'category' });
ExportLog.belongsTo(PaymentMethod,  { foreignKey: 'paymentMethodId',  as: 'paymentMethod' });

User.hasMany(ConsejoIa,   { foreignKey: 'userId', as: 'consejosIa' });
ConsejoIa.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(QuizAttempt,         { foreignKey: 'userId', as: 'quizAttempts' });
QuizAttempt.belongsTo(User,       { foreignKey: 'userId', as: 'user' });

QuizAttempt.hasMany(QuizAnswer,   { foreignKey: 'attemptId', as: 'answers', onDelete: 'CASCADE', hooks: true });
QuizAnswer.belongsTo(QuizAttempt, { foreignKey: 'attemptId', as: 'attempt' });

QuizQuestion.hasMany(QuizAnswer,  { foreignKey: 'questionId', as: 'answers' });
QuizAnswer.belongsTo(QuizQuestion,{ foreignKey: 'questionId', as: 'question' });

module.exports = {
  sequelize,
  Role, User, Category, PaymentMethod, Transaction, Budget, UserCategoryHide,
  LearningState,
  ExportLog,
  ConsejoIa,
  QuizQuestion,
  QuizAttempt,
  QuizAnswer
};
