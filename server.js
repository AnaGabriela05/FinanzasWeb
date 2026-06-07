require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');
const logger = require('./src/config/logger');

const PORT = process.env.PORT || 3000;

// Migracion manual y segura para SQLite (evita problemas de sync({ alter: true })
// que recrea tablas con ENUMs y deja restos *_backup huerfanos).
async function applyMigrations() {
  const queryInterface = sequelize.getQueryInterface();

  // 1) Limpia tablas *_backup huerfanas de un alter previo fallido.
  try {
    const rows = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%\\_backup' ESCAPE '\\'",
      { type: sequelize.QueryTypes.SELECT }
    );
    for (const row of rows) {
      await sequelize.query(`DROP TABLE IF EXISTS \`${row.name}\``);
      logger.info('migrate_drop_orphan_table', { table: row.name });
    }
  } catch (err) {
    logger.warn('migrate_inspect_backup_failed', { message: err.message });
  }

  // 2) Asegura columna currency en transactions (default PEN para filas existentes).
  try {
    const info = await queryInterface.describeTable('transactions');
    if (!info.currency) {
      await sequelize.query(
        "ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'PEN'"
      );
      logger.info('migrate_add_currency_column', { table: 'transactions' });
    }
  } catch (err) {
    // Si la tabla aun no existe, sync() la crea con la columna correctamente.
    if (!/no such table/i.test(err.message)) {
      logger.warn('migrate_currency_check_failed', { message: err.message });
    }
  }
}

async function start() {
  try {
    await sequelize.authenticate();

    // Crea tablas que falten (no toca tablas existentes).
    await sequelize.sync();

    // Aplica migraciones manuales sobre tablas existentes.
    await applyMigrations();

    app.listen(PORT, () => logger.info('server_started', {
      port: PORT,
      env: process.env.NODE_ENV || 'development',
      url: `http://localhost:${PORT}`
    }));
  } catch (err) {
    logger.error('server_start_failed', { message: err.message, stack: err.stack });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = start;
