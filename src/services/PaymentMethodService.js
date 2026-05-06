const HttpError = require('../errors/HttpError');

class PaymentMethodService {
  constructor({ paymentMethodRepository, paymentMethodDependencyResolver }) {
    this.paymentMethodRepository = paymentMethodRepository;
    this.paymentMethodDependencyResolver = paymentMethodDependencyResolver;
  }

  async create(user, payload) {
    const nombre = String(payload.nombre || '').trim();
    if (!nombre) {
      throw new HttpError(400, 'Nombre requerido');
    }

    const paymentMethod = await this.paymentMethodRepository.create({
      nombre,
      activo: true,
      userId: user.id
    });

    return {
      status: 201,
      body: { message: 'Metodo registrado correctamente', data: paymentMethod }
    };
  }

  list(user, query) {
    const includeArchived = ['1', 'true', 'yes'].includes(String(query.includeArchived || '').toLowerCase());
    return this.paymentMethodRepository.findByUser(user.id, includeArchived);
  }

  listadoTotal(user) {
    return this.paymentMethodRepository.findByUser(user.id, false);
  }

  async update(user, id, payload) {
    const paymentMethod = await this.paymentMethodRepository.findById(Number(id));
    if (!paymentMethod) {
      throw new HttpError(404, 'No encontrado');
    }

    const isAdmin = user.role === 'admin';
    if (!isAdmin && paymentMethod.userId !== user.id) {
      throw new HttpError(403, 'No autorizado');
    }

    const patch = {};
    if (payload.nombre !== undefined) {
      patch.nombre = String(payload.nombre || '').trim();
    }
    if (payload.activo !== undefined) {
      patch.activo = !!payload.activo;
    }

    await this.paymentMethodRepository.update(paymentMethod, patch);
    return { message: 'Metodo editado correctamente', data: paymentMethod, updated: true };
  }

  async usage(user, id) {
    const usage = await this.paymentMethodDependencyResolver.resolveUsage(Number(id), user.id);
    return { txCount: usage.txCount };
  }

  async remove(user, id, query) {
    const paymentMethod = await this.paymentMethodRepository.findById(Number(id));
    if (!paymentMethod) {
      throw new HttpError(404, 'No encontrado');
    }

    const isAdmin = user.role === 'admin';
    if (!isAdmin && paymentMethod.userId !== user.id) {
      throw new HttpError(403, 'No autorizado');
    }

    const cascade = ['1', 'true', 'yes'].includes(String(query.cascade || '').toLowerCase());
    const archive = ['1', 'true', 'yes'].includes(String(query.archive || '').toLowerCase());
    const usage = await this.paymentMethodDependencyResolver.resolveUsage(paymentMethod.id, user.id);

    if (archive) {
      if (paymentMethod.activo === false) {
        return { ok: true, archived: true, note: 'Ya estaba inactivo', txCount: usage.txCount };
      }

      await this.paymentMethodRepository.update(paymentMethod, { activo: false });
      return { ok: true, archived: true, txCount: usage.txCount };
    }

    if (!cascade && usage.txCount > 0) {
      throw new HttpError(409, 'Metodo en uso', {
        txCount: usage.txCount,
        message: 'El metodo de pago tiene transacciones. Elige eliminar todo (cascade) o archivar.'
      });
    }

    await this.paymentMethodDependencyResolver.removeWithDependencies(usage.where, cascade);
    await this.paymentMethodRepository.destroy(paymentMethod);

    return { ok: true, deleted: true, txDeleted: usage.txCount };
  }
}

module.exports = PaymentMethodService;
