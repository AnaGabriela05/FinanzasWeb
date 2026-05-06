const { Op } = require('sequelize');
const { Budget, Category } = require('../models');

class BudgetRepository {
  findById(id) {
    return Budget.findByPk(id);
  }

  findOrCreateByPeriod({ userId, categoryId, mes, anio, montoMensual }) {
    return Budget.findOrCreate({
      where: { userId, categoryId, mes, anio },
      defaults: { montoMensual }
    });
  }

  findDuplicate({ userId, categoryId, mes, anio, excludeId }) {
    return Budget.findOne({
      where: {
        userId,
        categoryId,
        mes,
        anio,
        id: { [Op.ne]: excludeId }
      }
    });
  }

  findByUser(userId, filters = {}) {
    const where = { userId };

    if (filters.mes) {
      where.mes = Number(filters.mes);
    }

    if (filters.anio) {
      where.anio = Number(filters.anio);
    }

    return Budget.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['anio', 'DESC'], ['mes', 'DESC'], ['id', 'DESC']]
    });
  }

  update(instance, data) {
    return instance.update(data);
  }

  save(instance) {
    return instance.save();
  }

  destroy(instance) {
    return instance.destroy();
  }

  count(where) {
    return Budget.count({ where });
  }

  destroyWhere(where, transaction) {
    return Budget.destroy({ where, transaction });
  }
}

module.exports = BudgetRepository;
