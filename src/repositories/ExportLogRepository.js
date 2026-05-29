const { ExportLog, Category, PaymentMethod } = require('../models');

class ExportLogRepository {
  create(data) {
    return ExportLog.create(data);
  }

  findByUser(userId, { limit = 50 } = {}) {
    return ExportLog.findAll({
      where: { userId },
      include: [
        { model: Category, as: 'category' },
        { model: PaymentMethod, as: 'paymentMethod' }
      ],
      order: [['createdAt', 'DESC']],
      limit
    });
  }
}

module.exports = ExportLogRepository;
