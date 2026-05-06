const { Op } = require('sequelize');
const { PaymentMethod } = require('../models');

class PaymentMethodRepository {
  create(data) {
    return PaymentMethod.create(data);
  }

  findById(id) {
    return PaymentMethod.findByPk(id);
  }

  findOwnedByUser(id, userId) {
    return PaymentMethod.findOne({ where: { id, userId } });
  }

  findByUser(userId, includeArchived = false) {
    const whereAnd = [{ userId }];

    if (!includeArchived) {
      whereAnd.push({ activo: true });
    }

    return PaymentMethod.findAll({
      where: { [Op.and]: whereAnd },
      order: [['activo', 'DESC'], ['nombre', 'ASC']]
    });
  }

  update(method, data) {
    return method.update(data);
  }

  destroy(method) {
    return method.destroy();
  }
}

module.exports = PaymentMethodRepository;
