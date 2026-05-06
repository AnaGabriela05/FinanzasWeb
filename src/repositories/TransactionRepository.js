const { Transaction, Category, PaymentMethod } = require('../models');

class TransactionRepository {
  create(data) {
    return Transaction.create(data);
  }

  findOwnedByUser(id, userId) {
    return Transaction.findOne({ where: { id, userId } });
  }

  findByFilters({ where, categoryWhere, order = [['fecha', 'DESC']] }) {
    const categoryInclude = { model: Category, as: 'category' };

    if (categoryWhere) {
      categoryInclude.where = categoryWhere;
      categoryInclude.required = true;
    }

    return Transaction.findAll({
      where,
      order,
      include: [
        categoryInclude,
        { model: PaymentMethod, as: 'paymentMethod' }
      ]
    });
  }

  update(instance, data) {
    Object.assign(instance, data);
    return instance.save();
  }

  destroy(instance) {
    return instance.destroy();
  }

  count(where) {
    return Transaction.count({ where });
  }

  destroyWhere(where, transaction) {
    return Transaction.destroy({ where, transaction });
  }
}

module.exports = TransactionRepository;
