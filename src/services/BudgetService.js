const HttpError = require('../errors/HttpError');

class BudgetService {
  constructor({ budgetRepository, categoryRepository }) {
    this.budgetRepository = budgetRepository;
    this.categoryRepository = categoryRepository;
  }

  async upsert(user, payload) {
    const input = {
      userId: user.id,
      categoryId: Number(payload.categoryId),
      montoMensual: Number(payload.montoMensual),
      mes: Number(payload.mes),
      anio: Number(payload.anio)
    };

    if (!input.categoryId || Number.isNaN(input.montoMensual) || !input.mes || !input.anio) {
      throw new HttpError(400, 'Datos invalidos (categoryId, montoMensual, mes, anio)');
    }

    await this.ensureVisibleCategory(user.id, input.categoryId);

    const [budget, created] = await this.budgetRepository.findOrCreateByPeriod(input);
    if (!created) {
      budget.montoMensual = input.montoMensual;
      await this.budgetRepository.save(budget);
      return { message: 'Presupuesto editado correctamente', data: budget, updated: true };
    }

    return {
      status: 201,
      body: { message: 'Presupuesto registrado correctamente', data: budget, created: true }
    };
  }

  list(user, query) {
    return this.budgetRepository.findByUser(user.id, query);
  }

  async remove(user, id) {
    const budget = await this.budgetRepository.findById(id);
    if (!budget) {
      throw new HttpError(404, 'No encontrado');
    }
    if (budget.userId !== user.id) {
      throw new HttpError(403, 'No autorizado');
    }

    await this.budgetRepository.destroy(budget);
    return { message: 'Presupuesto eliminado correctamente', deleted: true };
  }

  async update(user, id, payload) {
    const budget = await this.budgetRepository.findById(Number(id));
    if (!budget) {
      throw new HttpError(404, 'No encontrado');
    }
    if (budget.userId !== user.id) {
      throw new HttpError(403, 'No autorizado');
    }

    const nextCategoryId = payload.categoryId ?? budget.categoryId;
    const nextMes = payload.mes ?? budget.mes;
    const nextAnio = payload.anio ?? budget.anio;
    const nextMonto = payload.montoMensual != null ? Number(payload.montoMensual) : budget.montoMensual;

    await this.ensureVisibleCategory(user.id, nextCategoryId);

    const duplicate = await this.budgetRepository.findDuplicate({
      userId: user.id,
      categoryId: nextCategoryId,
      mes: nextMes,
      anio: nextAnio,
      excludeId: budget.id
    });

    if (duplicate) {
      throw new HttpError(409, 'Ya existe un presupuesto para esa categoria, mes y anio');
    }

    await this.budgetRepository.update(budget, {
      categoryId: nextCategoryId,
      mes: nextMes,
      anio: nextAnio,
      montoMensual: nextMonto
    });

    return { message: 'Presupuesto editado correctamente', data: budget, updated: true };
  }

  async ensureVisibleCategory(userId, categoryId) {
    const category = await this.categoryRepository.findAccessibleById(categoryId, userId);
    if (!category) {
      throw new HttpError(400, 'Categoria invalida');
    }

    const hiddenRow = await this.categoryRepository.findHiddenRow(userId, categoryId);
    if (hiddenRow?.hidden) {
      throw new HttpError(400, 'Esta categoria esta oculta para ti');
    }
  }
}

module.exports = BudgetService;
