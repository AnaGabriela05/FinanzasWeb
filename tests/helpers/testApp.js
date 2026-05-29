// Helper de tests de integracion.
//
// Estrategia:
// - Forzamos DB_STORAGE=':memory:' y NODE_ENV='test' ANTES de hacer require de
//   los modulos de src/. Asi la instancia singleton de Sequelize que vive en
//   src/config/database.js arranca apuntando a SQLite in-memory y los tests
//   nunca tocan database.sqlite real.
// - sequelize.sync({ force: true }) recrea el esquema desde cero antes de cada
//   suite/test que llame a resetDatabase().
// - Sembramos roles + dos usuarios (uno con rol 'usuario', otro con 'admin')
//   con password hasheada REAL via bcryptjs para reproducir el flujo de login.
// - Exponemos `app` (Express) lista para envolverla con supertest, mas helpers.

process.env.NODE_ENV = 'test';
process.env.DB_STORAGE = ':memory:';
// El config/auth.js exige JWT_SECRET en produccion; en test usa el default
// 'dev_secret'. Lo declaramos explicito para que el test sea reproducible.
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-prod';

const bcrypt = require('bcryptjs');
const app = require('../../src/app');
const { sequelize, Role, User, Category, PaymentMethod } = require('../../src/models');

const DEMO_PASSWORD = 'demo123456';
const ADMIN_PASSWORD = 'admin123456';

async function resetDatabase() {
  await sequelize.sync({ force: true });

  // Roles base. El AuthService.register busca el rol por nombre 'usuario'.
  const [usuarioRole] = await Role.findOrCreate({ where: { nombre: 'usuario' } });
  const [adminRole] = await Role.findOrCreate({ where: { nombre: 'admin' } });

  const demoHash = await bcrypt.hash(DEMO_PASSWORD, 4); // rondas bajas: tests rapidos
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 4);

  const demoUser = await User.create({
    nombre: 'Demo',
    correo: 'demo@correo.com',
    passwordHash: demoHash,
    roleId: usuarioRole.id
  });

  const adminUser = await User.create({
    nombre: 'Admin',
    correo: 'admin@correo.com',
    passwordHash: adminHash,
    roleId: adminRole.id
  });

  // Categoria y metodo de pago personales del demo, necesarios para crear
  // una transaccion valida (la regla del servicio exige que sean accesibles
  // y pertenezcan al usuario).
  const category = await Category.create({
    nombre: 'Comida',
    tipo: 'gasto',
    global: false,
    activo: true,
    userId: demoUser.id
  });
  const paymentMethod = await PaymentMethod.create({
    nombre: 'Efectivo',
    activo: true,
    userId: demoUser.id
  });

  return {
    demoUser,
    adminUser,
    demoPassword: DEMO_PASSWORD,
    adminPassword: ADMIN_PASSWORD,
    category,
    paymentMethod
  };
}

async function closeDatabase() {
  await sequelize.close();
}

module.exports = {
  app,
  sequelize,
  resetDatabase,
  closeDatabase,
  DEMO_PASSWORD,
  ADMIN_PASSWORD
};
