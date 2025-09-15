const { Sequelize } = require('sequelize');
const path = require('path');

const storage = process.env.DB_STORAGE || './database.sqlite';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.resolve(storage),
  logging: false
});

module.exports = sequelize;
