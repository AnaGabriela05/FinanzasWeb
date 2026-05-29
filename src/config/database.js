const { Sequelize } = require('sequelize');
const path = require('path');

const storage = process.env.DB_STORAGE || './database.sqlite';

// SQLite reconoce ':memory:' como base efimera en RAM. Si lo resolvemos con
// path.resolve() se transforma en una ruta real ("/.../:memory:") y deja de ser
// in-memory, lo cual rompe el aislamiento de los tests de integracion.
const resolvedStorage = storage === ':memory:' ? ':memory:' : path.resolve(storage);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: resolvedStorage,
  logging: false
});

module.exports = sequelize;
