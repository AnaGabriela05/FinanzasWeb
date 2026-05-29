require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/database');

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
      console.log(`[migrate] eliminada tabla huerfana ${row.name}`);
    }
  } catch (err) {
    console.warn('[migrate] no se pudo inspeccionar tablas backup:', err.message);
  }

  // 2) Asegura columna currency en transactions (default PEN para filas existentes).
  try {
    const info = await queryInterface.describeTable('transactions');
    if (!info.currency) {
      await sequelize.query(
        "ALTER TABLE transactions ADD COLUMN currency TEXT NOT NULL DEFAULT 'PEN'"
      );
      console.log("[migrate] agregada columna 'currency' a transactions");
    }
  } catch (err) {
    // Si la tabla aun no existe, sync() la crea con la columna correctamente.
    if (!/no such table/i.test(err.message)) {
      console.warn('[migrate] error verificando columna currency:', err.message);
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

    app.listen(PORT, () => console.log(`API escuchando en http://localhost:${PORT}`));
  } catch (err) {
    console.error('Error al iniciar:', err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}

module.exports = start;
