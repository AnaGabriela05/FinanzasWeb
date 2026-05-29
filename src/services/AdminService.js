const HttpError = require('../errors/HttpError');

class AdminService {
  constructor({ adminRepository, categoryRepository, categoryDependencyResolver, sequelize }) {
    this.adminRepository = adminRepository;
    this.categoryRepository = categoryRepository;
    this.categoryDependencyResolver = categoryDependencyResolver;
    this.sequelize = sequelize;
  }

  listUsers(filters = {}) {
    return this.adminRepository.listUsers(filters);
  }

  async getUserMetadata(userId) {
    const data = await this.adminRepository.getUserMetadata(Number(userId));
    if (!data) throw new HttpError(404, 'Usuario no encontrado');
    return data;
  }

  async lockUser(userId, minutos = 10) {
    const mins = Math.max(1, Math.min(Number(minutos) || 10, 60 * 24 * 30));
    const user = await this.adminRepository.lockUser(Number(userId), mins);
    if (!user) throw new HttpError(404, 'Usuario no encontrado');
    return { ok: true, lockedUntil: user.lockUntil, minutos: mins };
  }

  async unlockUser(userId) {
    const user = await this.adminRepository.unlockUser(Number(userId));
    if (!user) throw new HttpError(404, 'Usuario no encontrado');
    return { ok: true, unlocked: true };
  }

  async resetFailedAttempts(userId) {
    const user = await this.adminRepository.resetFailedAttempts(Number(userId));
    if (!user) throw new HttpError(404, 'Usuario no encontrado');
    return { ok: true, failedLoginAttempts: 0 };
  }

  async createGlobalCategory(payload) {
    const nombre = String(payload.nombre || '').trim();
    const tipo = payload.tipo;
    if (!nombre) throw new HttpError(400, 'El nombre es obligatorio');
    if (!['ingreso', 'gasto'].includes(tipo)) throw new HttpError(400, 'Tipo invalido');

    const category = await this.categoryRepository.create({
      nombre,
      tipo,
      global: true,
      userId: null,
      activo: true
    });
    return { status: 201, body: { message: 'Categoria global creada', data: category } };
  }

  async updateGlobalCategory(id, payload) {
    const category = await this.categoryRepository.findById(Number(id));
    if (!category) throw new HttpError(404, 'Categoria no encontrada');
    if (!category.global) throw new HttpError(400, 'Solo se pueden editar categorias globales desde el panel admin');

    await this.categoryRepository.update(category, {
      nombre: payload.nombre ?? category.nombre,
      tipo: payload.tipo ?? category.tipo,
      activo: payload.activo !== undefined ? !!payload.activo : category.activo
    });
    return { message: 'Categoria global actualizada', data: category };
  }

  async archiveGlobalCategory(id) {
    const category = await this.categoryRepository.findById(Number(id));
    if (!category) throw new HttpError(404, 'Categoria no encontrada');
    if (!category.global) throw new HttpError(400, 'No es una categoria global');
    await this.categoryRepository.update(category, { activo: false });
    return { ok: true, archived: true };
  }

  async deleteGlobalCategory(id, query = {}) {
    const category = await this.categoryRepository.findById(Number(id));
    if (!category) throw new HttpError(404, 'Categoria no encontrada');
    if (!category.global) throw new HttpError(400, 'No es una categoria global');

    const cascade = ['1', 'true', 'yes'].includes(String(query.cascade || '').toLowerCase());

    // Calcula uso global de la categoria
    const usage = await this.categoryDependencyResolver.resolveUsage(category, {
      userId: null,
      isAdmin: true,
      scopeAll: true
    });

    if (!cascade && (usage.txCount > 0 || usage.budgetCount > 0)) {
      throw new HttpError(409, 'Categoria global en uso', {
        txCount: usage.txCount,
        budgetCount: usage.budgetCount,
        message: 'La categoria global tiene registros. Confirma cascade=1 para eliminar todo.'
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

  getSystemMetrics() {
    return this.adminRepository.getSystemMetrics();
  }

  getRegistrationsChart(meses = 6) {
    return this.adminRepository.getUserRegistrationsByMonth(Number(meses) || 6);
  }

  getExportLogs(filters = {}) {
    return this.adminRepository.getExportLogs(filters);
  }
}

module.exports = AdminService;
