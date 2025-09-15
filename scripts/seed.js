require('dotenv').config();
const { sequelize, Role, User, Category, PaymentMethod, Transaction, Budget } = require('../src/models');
const bcrypt = require('bcryptjs');

(async () => {
  try {
    await sequelize.sync({ force: true });

    // Roles
    const [adminRole, userRole] = await Promise.all([
      Role.create({ nombre: 'admin' }),
      Role.create({ nombre: 'usuario' })
    ]);

    // Usuarios
    const admin = await User.create({
      nombre: 'Admin',
      correo: 'admin@correo.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      roleId: adminRole.id
    });
    const user = await User.create({
      nombre: 'Usuario Demo',
      correo: 'demo@correo.com',
      passwordHash: await bcrypt.hash('123456', 10),
      roleId: userRole.id
    });

    // Categorías globales
    await Category.bulkCreate([
      { nombre: 'Salario', tipo: 'ingreso', global: true },
      { nombre: 'Comida', tipo: 'gasto', global: true },
      { nombre: 'Transporte', tipo: 'gasto', global: true },
      { nombre: 'Vivienda', tipo: 'gasto', global: true },
      { nombre: 'Salud', tipo: 'gasto', global: true },
      { nombre: 'Entretenimiento', tipo: 'gasto', global: true }
    ]);

    // Categorías personales del usuario demo
    await Category.bulkCreate([
      { nombre: 'Freelance', tipo: 'ingreso', global: false, userId: user.id },
      { nombre: 'Café', tipo: 'gasto', global: false, userId: user.id }
    ]);

    // Métodos de pago del usuario demo
    const [efectivo, tarjeta, yape] = await Promise.all([
      PaymentMethod.create({ nombre: 'Efectivo', userId: user.id }),
      PaymentMethod.create({ nombre: 'Tarjeta', userId: user.id }),
      PaymentMethod.create({ nombre: 'Yape', userId: user.id })
    ]);

    // Transacciones del usuario demo
    const catSalario = await Category.findOne({ where: { nombre: 'Salario', global: true } });
    const catComida = await Category.findOne({ where: { nombre: 'Comida', global: true } });
    const catTransporte = await Category.findOne({ where: { nombre: 'Transporte', global: true } });
    const catCafe = await Category.findOne({ where: { nombre: 'Café', userId: user.id } });

    await Transaction.bulkCreate([
      { fecha: '2025-09-01', monto: 2500.0, descripcion: 'Pago de salario', categoryId: catSalario.id, paymentMethodId: efectivo.id, userId: user.id },
      { fecha: '2025-09-02', monto: 20.5, descripcion: 'Almuerzo', categoryId: catComida.id, paymentMethodId: yape.id, userId: user.id },
      { fecha: '2025-09-03', monto: 7.0, descripcion: 'Bus', categoryId: catTransporte.id, paymentMethodId: efectivo.id, userId: user.id },
      { fecha: '2025-09-04', monto: 6.0, descripcion: 'Capuchino', categoryId: catCafe.id, paymentMethodId: tarjeta.id, userId: user.id }
    ]);

    // Presupuestos del usuario demo
    await Budget.bulkCreate([
      { categoryId: catComida.id, userId: user.id, montoMensual: 500, mes: 9, anio: 2025 },
      { categoryId: catTransporte.id, userId: user.id, montoMensual: 200, mes: 9, anio: 2025 }
    ]);

    console.log('Datos de ejemplo insertados.');
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
