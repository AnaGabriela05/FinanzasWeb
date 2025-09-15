require('dotenv').config();
const { sequelize } = require('../src/models');

(async () => {
  try {
    await sequelize.sync({ force: true });
    console.log('BD sincronizada con { force: true }');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
