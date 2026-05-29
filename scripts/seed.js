/* eslint-disable no-console */
require('dotenv').config();
const {
  sequelize, Role, User, Category, PaymentMethod, Transaction, Budget,
  LearningState, ExportLog
} = require('../src/models');
const bcrypt = require('bcryptjs');

function isoDate(daysAgo) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().slice(0, 10);
}

function ym(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return { mes: d.getMonth() + 1, anio: d.getFullYear() };
}

(async () => {
  try {
    await sequelize.sync({ force: true });

    // ───────── Roles ─────────
    const [adminRole, userRole] = await Promise.all([
      Role.create({ nombre: 'admin' }),
      Role.create({ nombre: 'usuario' })
    ]);

    // ───────── Usuarios ─────────
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

    // ───────── Catalogo: categorias globales ─────────
    await Category.bulkCreate([
      { nombre: 'Salario',         tipo: 'ingreso', global: true },
      { nombre: 'Comida',          tipo: 'gasto',   global: true },
      { nombre: 'Transporte',      tipo: 'gasto',   global: true },
      { nombre: 'Vivienda',        tipo: 'gasto',   global: true },
      { nombre: 'Salud',           tipo: 'gasto',   global: true },
      { nombre: 'Entretenimiento', tipo: 'gasto',   global: true },
      { nombre: 'Servicios',       tipo: 'gasto',   global: true }
    ]);

    // ───────── Categorias personales del demo ─────────
    await Category.bulkCreate([
      { nombre: 'Freelance', tipo: 'ingreso', global: false, userId: user.id },
      { nombre: 'Cafe',      tipo: 'gasto',   global: false, userId: user.id }
    ]);

    // ───────── Metodos de pago del demo ─────────
    const [efectivo, tarjeta, yape, plin] = await Promise.all([
      PaymentMethod.create({ nombre: 'Efectivo', userId: user.id }),
      PaymentMethod.create({ nombre: 'Tarjeta',  userId: user.id }),
      PaymentMethod.create({ nombre: 'Yape',     userId: user.id }),
      PaymentMethod.create({ nombre: 'Plin',     userId: user.id })
    ]);

    // ───────── Transacciones del demo (ricas, en los ultimos 3 meses) ─────────
    const cat = {};
    for (const nombre of ['Salario', 'Comida', 'Transporte', 'Vivienda', 'Entretenimiento', 'Servicios']) {
      cat[nombre] = await Category.findOne({ where: { nombre, global: true } });
    }
    cat.Freelance = await Category.findOne({ where: { nombre: 'Freelance', userId: user.id } });
    cat.Cafe      = await Category.findOne({ where: { nombre: 'Cafe',      userId: user.id } });

    const txs = [
      // Mes actual (0-30 dias)
      { d:   1, monto: 2800.0,  desc: 'Sueldo mensual',          c: cat.Salario,        p: efectivo },
      { d:   3, monto:   45.0,  desc: 'Recibo de luz',           c: cat.Servicios,      p: tarjeta },
      { d:   5, monto:   18.5,  desc: 'Almuerzo del lunes',      c: cat.Comida,         p: yape },
      { d:   7, monto:    8.0,  desc: 'Bus a oficina',           c: cat.Transporte,     p: efectivo },
      { d:  10, monto:  650.0,  desc: 'Alquiler del mes',        c: cat.Vivienda,       p: tarjeta },
      { d:  12, monto:    6.5,  desc: 'Cafe de la manana',       c: cat.Cafe,           p: tarjeta },
      { d:  15, monto:   42.0,  desc: 'Pizza con amigos',        c: cat.Comida,         p: plin },
      { d:  18, monto:   25.0,  desc: 'Cine sabado',             c: cat.Entretenimiento,p: tarjeta },
      // Mes anterior (30-60 dias)
      { d:  32, monto: 2800.0,  desc: 'Sueldo mes anterior',     c: cat.Salario,        p: efectivo },
      { d:  35, monto:  650.0,  desc: 'Alquiler mes anterior',   c: cat.Vivienda,       p: tarjeta },
      { d:  40, monto:   55.0,  desc: 'Mercado quincenal',       c: cat.Comida,         p: yape },
      { d:  45, monto:  300.0,  desc: 'Proyecto freelance',      c: cat.Freelance,      p: yape },
      { d:  50, monto:   30.0,  desc: 'Uber al aeropuerto',      c: cat.Transporte,     p: tarjeta },
      // Mes -2 (60-90 dias)
      { d:  62, monto: 2700.0,  desc: 'Sueldo de hace dos meses',c: cat.Salario,        p: efectivo },
      { d:  70, monto:  600.0,  desc: 'Alquiler hace 2 meses',   c: cat.Vivienda,       p: tarjeta }
    ];

    await Transaction.bulkCreate(txs.map((t) => ({
      fecha: isoDate(t.d),
      monto: t.monto,
      currency: 'PEN',
      descripcion: t.desc,
      categoryId: t.c.id,
      paymentMethodId: t.p.id,
      userId: user.id
    })));

    // ───────── Presupuestos del demo (mes actual y mes anterior) ─────────
    const mesActual    = ym(0);
    const mesAnterior  = ym(35);
    await Budget.bulkCreate([
      { categoryId: cat.Comida.id,     userId: user.id, montoMensual: 500, mes: mesActual.mes,   anio: mesActual.anio },
      { categoryId: cat.Transporte.id, userId: user.id, montoMensual: 200, mes: mesActual.mes,   anio: mesActual.anio },
      { categoryId: cat.Vivienda.id,   userId: user.id, montoMensual: 700, mes: mesActual.mes,   anio: mesActual.anio },
      { categoryId: cat.Comida.id,     userId: user.id, montoMensual: 500, mes: mesAnterior.mes, anio: mesAnterior.anio }
    ]);

    // ───────── Limpieza defensiva: el admin nunca tiene datos personales ─────────
    // (sync({ force: true }) ya barre todo, pero esto deja la garantia explicita).
    const cleaned = await Promise.all([
      Transaction.destroy({ where: { userId: admin.id } }),
      Budget.destroy({ where: { userId: admin.id } }),
      PaymentMethod.destroy({ where: { userId: admin.id } }),
      Category.destroy({ where: { userId: admin.id } }),
      LearningState.destroy({ where: { userId: admin.id } }),
      ExportLog.destroy({ where: { userId: admin.id } })
    ]);

    // Verificacion final: admin no debe tener filas en ninguna tabla personal.
    const adminTxs = await Transaction.count({ where: { userId: admin.id } });
    const adminBudgets = await Budget.count({ where: { userId: admin.id } });
    if (adminTxs > 0 || adminBudgets > 0) {
      throw new Error(`Seed corrupto: admin con datos (${adminTxs} txs, ${adminBudgets} budgets)`);
    }

    console.log('[seed] admin@correo.com / admin123 (rol admin, SIN datos financieros)');
    console.log('[seed] demo@correo.com  / 123456   (rol usuario)');
    console.log(`[seed] demo: ${txs.length} transacciones, 4 presupuestos, 4 metodos de pago`);
    console.log(`[seed] limpieza defensiva admin: ${cleaned.join(', ')} filas borradas en cada tabla`);
    console.log('[seed] OK. Recuerda correr "npm run db:seed-quiz" para sembrar las preguntas del modulo quiz.');
    process.exit(0);
  } catch (e) {
    console.error('[seed] error:', e);
    process.exit(1);
  }
})();
