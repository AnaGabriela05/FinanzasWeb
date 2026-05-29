const { Op } = require('sequelize');
const { ConsejoIa } = require('../models');

class ConsejoIaRepository {
  /**
   * Retorna los consejos del usuario generados dentro de la ventana de vigencia
   * (por defecto los ultimos 7 dias), ordenados por fechaGeneracion DESC.
   */
  findVigentesByUserId(userId, diasVigencia = 7) {
    const desde = new Date();
    desde.setDate(desde.getDate() - Number(diasVigencia || 7));

    return ConsejoIa.findAll({
      where: {
        userId,
        fechaGeneracion: { [Op.gte]: desde }
      },
      order: [['fechaGeneracion', 'DESC'], ['id', 'DESC']]
    });
  }

  /**
   * Crea multiples consejos en una sola operacion.
   */
  createMany(consejos) {
    if (!Array.isArray(consejos) || consejos.length === 0) return Promise.resolve([]);
    return ConsejoIa.bulkCreate(consejos);
  }

  /**
   * Retorna el historial paginado de consejos para un usuario, con filtro opcional por tipo.
   */
  findHistoryByUserId(userId, options = {}) {
    const limit = Number(options.limit) || 30;
    const offset = Number(options.offset) || 0;
    const where = { userId };
    if (options.tipo) where.tipo = options.tipo;

    return ConsejoIa.findAndCountAll({
      where,
      order: [['fechaGeneracion', 'DESC'], ['id', 'DESC']],
      limit,
      offset
    });
  }

  /**
   * Retorna el conteo de consejos del usuario agrupados por tipo.
   * Estructura: { ahorro: N, gasto: N, presupuesto: N, deuda: N }
   */
  async countByUserAndType(userId) {
    const rows = await ConsejoIa.findAll({
      attributes: [
        'tipo',
        [ConsejoIa.sequelize.fn('COUNT', ConsejoIa.sequelize.col('id')), 'total']
      ],
      where: { userId },
      group: ['tipo'],
      raw: true
    });

    const base = { ahorro: 0, gasto: 0, presupuesto: 0, deuda: 0 };
    rows.forEach((row) => {
      base[row.tipo] = Number(row.total) || 0;
    });
    return base;
  }

  /**
   * Retorna el consejo mas reciente del usuario, o null si no hay ninguno.
   */
  findLastByUserId(userId) {
    return ConsejoIa.findOne({
      where: { userId },
      order: [['fechaGeneracion', 'DESC'], ['id', 'DESC']]
    });
  }

  /**
   * Retorna el total de consejos historicos de un usuario.
   */
  countTotalByUser(userId) {
    return ConsejoIa.count({ where: { userId } });
  }
}

module.exports = ConsejoIaRepository;
