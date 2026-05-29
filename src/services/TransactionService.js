const { Op } = require('sequelize');
const HttpError = require('../errors/HttpError');

class TransactionService {
  constructor({ transactionRepository, categoryRepository, paymentMethodRepository }) {
    this.transactionRepository = transactionRepository;
    this.categoryRepository = categoryRepository;
    this.paymentMethodRepository = paymentMethodRepository;
  }

  async create(user, payload) {
    await this.ensureReferences(user.id, payload.categoryId, payload.paymentMethodId);

    const transaction = await this.transactionRepository.create({
      fecha: payload.fecha,
      monto: payload.monto,
      currency: payload.currency || 'PEN',
      descripcion: payload.descripcion,
      categoryId: payload.categoryId,
      paymentMethodId: payload.paymentMethodId,
      userId: user.id
    });

    return {
      status: 201,
      body: { message: 'Transaccion registrada correctamente', data: transaction }
    };
  }

  async list(user, query) {
    const where = { userId: user.id };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.paymentMethodId) where.paymentMethodId = query.paymentMethodId;
    if (query.from && query.to) where.fecha = { [Op.between]: [query.from, query.to] };

    const categoryWhere = query.transactionType ? { tipo: query.transactionType } : null;

    const isPaginated = query.page !== undefined || query.limit !== undefined;
    if (!isPaginated) {
      return this.transactionRepository.findByFilters({ where, categoryWhere });
    }

    const limit = query.limit || 50;
    const page = query.page || 1;
    const offset = (page - 1) * limit;

    const { count, rows } = await this.transactionRepository.findAndCountByFilters({
      where,
      categoryWhere,
      limit,
      offset
    });

    return {
      items: rows,
      total: count,
      page,
      limit,
      totalPages: Math.max(Math.ceil(count / limit), 1)
    };
  }

  async update(user, id, payload) {
    const transaction = await this.transactionRepository.findOwnedByUser(id, user.id);
    if (!transaction) {
      throw new HttpError(404, 'No encontrado');
    }

    if (payload.categoryId) {
      await this.ensureCategory(user.id, payload.categoryId);
    }

    if (payload.paymentMethodId) {
      await this.ensurePaymentMethod(user.id, payload.paymentMethodId);
    }

    await this.transactionRepository.update(transaction, {
      fecha: payload.fecha ?? transaction.fecha,
      monto: payload.monto != null ? payload.monto : transaction.monto,
      currency: payload.currency ?? transaction.currency,
      descripcion: payload.descripcion != null ? payload.descripcion : transaction.descripcion,
      categoryId: payload.categoryId ?? transaction.categoryId,
      paymentMethodId: payload.paymentMethodId ?? transaction.paymentMethodId
    });

    return { message: 'Transaccion editada correctamente', data: transaction };
  }

  async remove(user, id) {
    const transaction = await this.transactionRepository.findOwnedByUser(id, user.id);
    if (!transaction) {
      throw new HttpError(404, 'No encontrado');
    }

    await this.transactionRepository.destroy(transaction);
    return { message: 'Transaccion eliminada correctamente' };
  }

  async ensureReferences(userId, categoryId, paymentMethodId) {
    await Promise.all([
      this.ensureCategory(userId, categoryId),
      this.ensurePaymentMethod(userId, paymentMethodId)
    ]);
  }

  async ensureCategory(userId, categoryId) {
    const category = await this.categoryRepository.findAccessibleById(categoryId, userId);
    if (!category) {
      throw new HttpError(400, 'Categoria invalida');
    }
  }

  async ensurePaymentMethod(userId, paymentMethodId) {
    const paymentMethod = await this.paymentMethodRepository.findOwnedByUser(paymentMethodId, userId);
    if (!paymentMethod) {
      throw new HttpError(400, 'Metodo de pago invalido');
    }
  }
}

module.exports = TransactionService;
