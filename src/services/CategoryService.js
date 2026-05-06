const HttpError = require('../errors/HttpError');

class CategoryService {
  constructor({ categoryRepository, categoryDependencyResolver }) {
    this.categoryRepository = categoryRepository;
    this.categoryDependencyResolver = categoryDependencyResolver;
  }

  async create(user, payload) {
    const { nombre, tipo, global } = payload;
    const isAdmin = user.role === 'admin';

    if (global === true && !isAdmin) {
      throw new HttpError(403, 'Solo admin puede crear categorias globales');
    }

    const category = await this.categoryRepository.create({
      nombre,
      tipo,
      global: !!global,
      userId: global ? null : user.id,
      activo: true
    });

    return {
      status: 201,
      body: { message: 'Categoria registrada correctamente', data: category }
    };
  }

  list(user, query) {
    const includeArchived = ['1', 'true', 'yes'].includes(String(query.includeArchived || '').toLowerCase());
    return this.categoryRepository.findVisibleForUser(user.id, includeArchived);
  }

  listadoTotal(user) {
    return this.categoryRepository.findVisibleForUser(user.id, false);
  }

  async update(user, id, payload) {
    const category = await this.categoryRepository.findById(Number(id));
    if (!category) {
      throw new HttpError(404, 'No encontrado');
    }

    const isAdmin = user.role === 'admin';

    if (category.global) {
      return this.updateGlobalCategory(category, user, isAdmin, payload);
    }

    if (!isAdmin && category.userId !== user.id) {
      throw new HttpError(403, 'No autorizado');
    }

    const newGlobal = payload.global !== undefined ? !!payload.global : category.global;
    if (newGlobal && !isAdmin) {
      throw new HttpError(403, 'Solo admin puede marcar como global');
    }

    await this.categoryRepository.update(category, {
      nombre: payload.nombre ?? category.nombre,
      tipo: payload.tipo ?? category.tipo,
      global: newGlobal,
      activo: payload.activo !== undefined ? !!payload.activo : category.activo
    });

    return { message: 'Categoria editada correctamente', data: category, updated: true };
  }

  async updateGlobalCategory(category, user, isAdmin, payload) {
    if (!isAdmin) {
      const newName = (payload.nombre ?? category.nombre)?.trim();
      const newType = payload.tipo ?? category.tipo;
      const [copy] = await this.categoryRepository.findOrCreatePersonalCopy({
        userId: user.id,
        nombre: newName,
        tipo: newType
      });

      if (copy.tipo !== newType) {
        await this.categoryRepository.update(copy, { tipo: newType });
      }

      await this.categoryRepository.hideForUser(user.id, category.id);

      return {
        message: 'Se creo tu version personal de la categoria',
        data: copy,
        personalized: true
      };
    }

    await this.categoryRepository.update(category, {
      nombre: payload.nombre ?? category.nombre,
      tipo: payload.tipo ?? category.tipo,
      global: payload.global !== undefined ? !!payload.global : category.global,
      activo: payload.activo !== undefined ? !!payload.activo : category.activo
    });

    return { message: 'Categoria global actualizada', data: category, updated: true };
  }

  async usage(user, id, query) {
    const category = await this.categoryRepository.findById(Number(id));
    if (!category) {
      throw new HttpError(404, 'No encontrado');
    }

    const scopeAll = String(query.scope || '').toLowerCase() === 'all';
    const usage = await this.categoryDependencyResolver.resolveUsage(category, {
      userId: user.id,
      isAdmin: user.role === 'admin',
      scopeAll
    });

    return {
      txCount: usage.txCount,
      budgetCount: usage.budgetCount,
      scope: usage.scope
    };
  }

  async remove(user, id, query) {
    const category = await this.categoryRepository.findById(Number(id));
    if (!category) {
      throw new HttpError(404, 'No encontrado');
    }

    const isAdmin = user.role === 'admin';
    const cascade = ['1', 'true', 'yes'].includes(String(query.cascade || '').toLowerCase());
    const archive = ['1', 'true', 'yes'].includes(String(query.archive || '').toLowerCase());

    if (category.global && !isAdmin) {
      await this.categoryRepository.hideForUser(user.id, category.id);
      return { message: 'Categoria global ocultada para ti', hiddenForUser: true };
    }

    const usage = await this.categoryDependencyResolver.resolveUsage(category, {
      userId: user.id,
      isAdmin,
      scopeAll: category.global && isAdmin
    });

    if (archive) {
      if (!category.activo) {
        return { ok: true, archived: true, note: 'Ya estaba inactiva', txCount: usage.txCount, budgetCount: usage.budgetCount };
      }

      await this.categoryRepository.update(category, { activo: false });
      return { ok: true, archived: true, txCount: usage.txCount, budgetCount: usage.budgetCount };
    }

    if (!cascade && (usage.txCount > 0 || usage.budgetCount > 0)) {
      throw new HttpError(409, 'Categoria en uso', {
        txCount: usage.txCount,
        budgetCount: usage.budgetCount,
        message: 'La categoria tiene registros. Elige eliminar todo (cascade) o archivar.'
      });
    }

    await this.categoryDependencyResolver.removeWithDependencies(category.id, usage.where, cascade);

    return {
      ok: true,
      deleted: true,
      txDeleted: usage.txCount,
      budgetsDeleted: usage.budgetCount
    };
  }

  async restore(user, id) {
    const hiddenRow = await this.categoryRepository.findHiddenRow(user.id, Number(id));
    if (!hiddenRow) {
      throw new HttpError(404, 'La categoria no estaba oculta para ti');
    }

    await this.categoryRepository.removeHiddenRow(hiddenRow);
    return { message: 'Categoria global restaurada para ti', restored: true };
  }
}

module.exports = CategoryService;
