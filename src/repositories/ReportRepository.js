const { Op } = require('sequelize');

class ReportRepository {
  constructor(transactionRepository) {
    this.transactionRepository = transactionRepository;
  }

  findTransactionsForUser(userId, query = {}, order = [['fecha', 'ASC']]) {
    const { from, to, categoryId, paymentMethodId, transactionType } = query;
    const where = { userId };

    if (from && to) {
      where.fecha = { [Op.between]: [from, to] };
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (paymentMethodId) {
      where.paymentMethodId = paymentMethodId;
    }

    const categoryWhere = transactionType ? { tipo: transactionType } : null;

    return this.transactionRepository.findByFilters({ where, categoryWhere, order });
  }
}

module.exports = ReportRepository;
