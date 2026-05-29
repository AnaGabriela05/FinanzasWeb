const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Role,
  Transaction,
  Category,
  PaymentMethod,
  Budget,
  ExportLog
} = require('../models');

// Campos del usuario que el admin puede ver. Cualquier columna nueva del modelo User
// NO se expone automaticamente: hay que agregarla a esta lista a proposito.
const SAFE_USER_ATTRS = [
  'id',
  'nombre',
  'correo',
  'roleId',
  'createdAt',
  'updatedAt',
  'failedLoginAttempts',
  'lockUntil'
];

class AdminRepository {
  /**
   * Lista usuarios con metadatos seguros. Excluye admins.
   * options: { limit, offset, search, status: 'all'|'active'|'locked'|'inactive' }
   */
  async listUsers(options = {}) {
    const limit = Math.min(Number(options.limit) || 50, 200);
    const offset = Math.max(Number(options.offset) || 0, 0);
    const search = (options.search || '').trim();
    const status = options.status || 'all';

    const where = {};
    if (search) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${search}%` } },
        { correo: { [Op.like]: `%${search}%` } }
      ];
    }

    const now = new Date();
    if (status === 'locked') {
      where.lockUntil = { [Op.gt]: now };
    } else if (status === 'active') {
      where[Op.and] = [
        ...(where[Op.and] || []),
        { [Op.or]: [{ lockUntil: null }, { lockUntil: { [Op.lte]: now } }] }
      ];
    }

    const { count, rows } = await User.findAndCountAll({
      attributes: SAFE_USER_ATTRS,
      where,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'nombre'],
        where: { nombre: 'usuario' },
        required: true
      }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    const userIds = rows.map((r) => r.id);
    const txCountByUser = await this.countTransactionsForUsers(userIds);

    const items = rows.map((u) => {
      const plain = u.get({ plain: true });
      const txCount = txCountByUser.get(plain.id) || 0;
      const lockedNow = plain.lockUntil && new Date(plain.lockUntil) > now;
      return {
        id: plain.id,
        nombre: plain.nombre,
        correo: plain.correo,
        roleName: plain.role?.nombre || 'usuario',
        createdAt: plain.createdAt,
        updatedAt: plain.updatedAt,
        failedLoginAttempts: plain.failedLoginAttempts || 0,
        lockUntil: plain.lockUntil,
        bloqueado: !!lockedNow,
        transactionCount: txCount
      };
    });

    return { items, total: count, limit, offset };
  }

  /**
   * Conteo de transacciones por usuario, en un solo query.
   */
  async countTransactionsForUsers(userIds = []) {
    if (userIds.length === 0) return new Map();
    const rows = await Transaction.findAll({
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      where: { userId: { [Op.in]: userIds } },
      group: ['userId'],
      raw: true
    });
    const map = new Map();
    rows.forEach((r) => map.set(Number(r.userId), Number(r.total) || 0));
    return map;
  }

  /**
   * Metadatos seguros de un usuario (vista detalle).
   */
  async getUserMetadata(userId) {
    const user = await User.findByPk(userId, {
      attributes: SAFE_USER_ATTRS,
      include: [{ model: Role, as: 'role', attributes: ['id', 'nombre'] }]
    });
    if (!user || user.role?.nombre !== 'usuario') return null;

    const [txCount, categoryCount, paymentMethodCount, budgetCount] = await Promise.all([
      Transaction.count({ where: { userId } }),
      Category.count({ where: { userId, global: false } }),
      PaymentMethod.count({ where: { userId } }),
      Budget.count({ where: { userId } })
    ]);

    const plain = user.get({ plain: true });
    const now = new Date();
    const lockedNow = plain.lockUntil && new Date(plain.lockUntil) > now;

    return {
      id: plain.id,
      nombre: plain.nombre,
      correo: plain.correo,
      rol: plain.role?.nombre || 'usuario',
      fechaRegistro: plain.createdAt,
      ultimoAcceso: plain.updatedAt, // proxy: no hay campo lastLoginAt
      failedLoginAttempts: plain.failedLoginAttempts || 0,
      lockUntil: plain.lockUntil,
      bloqueado: !!lockedNow,
      counts: {
        transactionCount: txCount,
        categoryCount,
        paymentMethodCount,
        budgetCount
      }
    };
  }

  async findUserByIdRestricted(userId) {
    return User.findOne({
      where: { id: userId },
      attributes: SAFE_USER_ATTRS,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'nombre'],
        where: { nombre: 'usuario' },
        required: true
      }]
    });
  }

  async lockUser(userId, minutos) {
    const user = await this.findUserByIdRestricted(userId);
    if (!user) return null;
    user.lockUntil = new Date(Date.now() + Number(minutos) * 60 * 1000);
    await user.save();
    return user;
  }

  async unlockUser(userId) {
    const user = await this.findUserByIdRestricted(userId);
    if (!user) return null;
    user.lockUntil = null;
    user.failedLoginAttempts = 0;
    await user.save();
    return user;
  }

  async resetFailedAttempts(userId) {
    const user = await this.findUserByIdRestricted(userId);
    if (!user) return null;
    user.failedLoginAttempts = 0;
    await user.save();
    return user;
  }

  /**
   * Calcula los rangos de fecha del mes actual y del mes anterior.
   */
  monthRanges(now = new Date()) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endPrev = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start, startPrev, endPrev };
  }

  /**
   * Metricas agregadas para el panel admin. Solo considera rol 'usuario'.
   */
  async getSystemMetrics() {
    const now = new Date();
    const { start: startMes, startPrev, endPrev } = this.monthRanges(now);
    const startSinActividad = new Date(now);
    startSinActividad.setDate(startSinActividad.getDate() - 30);

    const userRole = await Role.findOne({ where: { nombre: 'usuario' } });
    const userRoleId = userRole?.id;

    // Usuarios
    const [
      totalUsuarios,
      bloqueados,
      registradosEsteMes,
      registradosMesAnterior,
      sinActividad
    ] = await Promise.all([
      User.count({ where: { roleId: userRoleId } }),
      User.count({ where: { roleId: userRoleId, lockUntil: { [Op.gt]: now } } }),
      User.count({ where: { roleId: userRoleId, createdAt: { [Op.gte]: startMes } } }),
      User.count({ where: { roleId: userRoleId, createdAt: { [Op.gte]: startPrev, [Op.lt]: endPrev } } }),
      User.count({ where: { roleId: userRoleId, updatedAt: { [Op.lt]: startSinActividad } } })
    ]);
    const activos = totalUsuarios - bloqueados;

    // Transacciones (solo de usuarios, no admins)
    const userIds = (await User.findAll({
      where: { roleId: userRoleId },
      attributes: ['id'],
      raw: true
    })).map((u) => u.id);

    const [txEsteMes, txMesAnterior] = await Promise.all([
      Transaction.count({ where: { userId: { [Op.in]: userIds }, createdAt: { [Op.gte]: startMes } } }),
      Transaction.count({ where: { userId: { [Op.in]: userIds }, createdAt: { [Op.gte]: startPrev, [Op.lt]: endPrev } } })
    ]);
    const deltaPct = txMesAnterior > 0
      ? Math.round(((txEsteMes - txMesAnterior) / txMesAnterior) * 1000) / 10
      : null;

    // Categorias
    const [globalesActivas, totalCategoriasPersonales] = await Promise.all([
      Category.count({ where: { global: true, activo: true } }),
      Category.count({ where: { global: false, userId: { [Op.in]: userIds } } })
    ]);
    const personalesPromedio = totalUsuarios > 0
      ? Math.round((totalCategoriasPersonales / totalUsuarios) * 10) / 10
      : 0;

    // Exportaciones
    const expRows = await ExportLog.findAll({
      attributes: ['formato', [sequelize.fn('COUNT', sequelize.col('id')), 'total']],
      where: { createdAt: { [Op.gte]: startMes }, userId: { [Op.in]: userIds } },
      group: ['formato'],
      raw: true
    });
    const porFormato = { pdf: 0, xlsx: 0 };
    let totalExportsMes = 0;
    expRows.forEach((r) => {
      porFormato[r.formato] = Number(r.total) || 0;
      totalExportsMes += Number(r.total) || 0;
    });

    // Top categorias globales mas usadas (cantidad de USUARIOS distintos que las usan)
    const topCategoriasRows = await Transaction.findAll({
      attributes: [
        'categoryId',
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('Transaction.userId'))), 'usuariosQueLaUsan']
      ],
      where: { userId: { [Op.in]: userIds } },
      include: [{
        model: Category,
        as: 'category',
        attributes: ['id', 'nombre', 'global'],
        where: { global: true },
        required: true
      }],
      group: ['categoryId', 'category.id', 'category.nombre', 'category.global'],
      order: [[sequelize.literal('"usuariosQueLaUsan"'), 'DESC']],
      limit: 5,
      raw: true,
      nest: true
    });
    const topCategoriasGlobales = topCategoriasRows.map((r) => ({
      nombre: r.category?.nombre || 'Sin nombre',
      usuariosQueLaUsan: Number(r.usuariosQueLaUsan) || 0
    }));

    // Top metodos de pago mas usados (cantidad de USUARIOS distintos)
    const topMetodosRows = await Transaction.findAll({
      attributes: [
        'paymentMethodId',
        [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('Transaction.userId'))), 'usuariosActivos']
      ],
      where: { userId: { [Op.in]: userIds } },
      include: [{
        model: PaymentMethod,
        as: 'paymentMethod',
        attributes: ['id', 'nombre'],
        required: true
      }],
      group: ['paymentMethodId', 'paymentMethod.id', 'paymentMethod.nombre'],
      order: [[sequelize.literal('"usuariosActivos"'), 'DESC']],
      limit: 3,
      raw: true,
      nest: true
    });
    const topMetodosPago = topMetodosRows.map((r) => ({
      nombre: r.paymentMethod?.nombre || 'Sin nombre',
      usuariosActivos: Number(r.usuariosActivos) || 0
    }));

    // Salud financiera: el detalle por-usuario es caro y queda fuera del scope FASE 1.
    // Devolvemos contadores en cero como placeholder agregado (sin identificadores).
    const saludFinanciera = { rojo: 0, amarillo: 0, verde: 0, neutral: totalUsuarios };

    return {
      users: {
        total: totalUsuarios,
        activos,
        bloqueados,
        sinActividad30Dias: sinActividad,
        registradosEsteMes,
        registradosMesAnterior
      },
      transactions: {
        totalEsteMes: txEsteMes,
        totalMesAnterior: txMesAnterior,
        deltaPct
      },
      categories: {
        globalesActivas,
        personalesPromedio
      },
      exports: {
        totalEsteMes: totalExportsMes,
        porFormato
      },
      saludFinanciera,
      topCategoriasGlobales,
      topMetodosPago
    };
  }

  /**
   * Registros por mes durante los ultimos N meses.
   */
  async getUserRegistrationsByMonth(meses = 6) {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - (meses - 1), 1);
    const userRole = await Role.findOne({ where: { nombre: 'usuario' } });
    const userRoleId = userRole?.id;

    const rows = await User.findAll({
      attributes: ['createdAt'],
      where: { roleId: userRoleId, createdAt: { [Op.gte]: startMonth } },
      raw: true
    });

    const buckets = new Map();
    for (let i = 0; i < meses; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - (meses - 1 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      buckets.set(key, { mes: d.getMonth() + 1, year: d.getFullYear(), cantidad: 0 });
    }

    rows.forEach((r) => {
      const d = new Date(r.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (buckets.has(key)) buckets.get(key).cantidad += 1;
    });

    return Array.from(buckets.values());
  }

  /**
   * Log de exportaciones con nombre y correo del usuario que las solicito.
   * NO retorna el contenido del reporte exportado, solo metadatos.
   */
  async getExportLogs(options = {}) {
    const limit = Math.min(Number(options.limit) || 50, 200);
    const offset = Math.max(Number(options.offset) || 0, 0);
    const where = {};
    if (options.formato) where.formato = options.formato;
    if (options.from && options.to) {
      where.createdAt = { [Op.between]: [new Date(options.from), new Date(options.to)] };
    }

    const userWhere = {};
    if (options.userSearch) {
      userWhere[Op.or] = [
        { nombre: { [Op.like]: `%${options.userSearch}%` } },
        { correo: { [Op.like]: `%${options.userSearch}%` } }
      ];
    }

    const { count, rows } = await ExportLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'nombre', 'correo'],
        where: Object.keys(userWhere).length ? userWhere : undefined,
        required: !!Object.keys(userWhere).length
      }],
      order: [['createdAt', 'DESC'], ['id', 'DESC']],
      limit,
      offset,
      distinct: true
    });

    const items = rows.map((r) => {
      const plain = r.get({ plain: true });
      return {
        id: plain.id,
        formato: plain.formato,
        desde: plain.desde,
        hasta: plain.hasta,
        transactionType: plain.transactionType,
        nombreArchivo: plain.nombreArchivo,
        createdAt: plain.createdAt,
        user: plain.user
          ? { id: plain.user.id, nombre: plain.user.nombre, correo: plain.user.correo }
          : null
      };
    });

    return { items, total: count, limit, offset };
  }
}

module.exports = AdminRepository;
