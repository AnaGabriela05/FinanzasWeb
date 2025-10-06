// controllers/paymentMethodController.js
const { Op } = require('sequelize');
const { PaymentMethod, Transaction } = require('../models');

/** Crear método (siempre del usuario que lo crea) */
exports.create = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre || !String(nombre).trim()) {
      return res.status(400).json({ error: 'Nombre requerido' });
    }

    const pm = await PaymentMethod.create({
      nombre: String(nombre).trim(),
      activo: true,
      userId: req.user.id,
    });

    res.status(201).json({ message: 'Método registrado correctamente', data: pm });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/** Listar métodos del usuario
 *  - Por defecto solo activos.
 *  - Si includeArchived=1|true => incluye inactivos.
 */
exports.list = async (req, res) => {
  try {
    const includeArchived = ['1', 'true', 'yes'].includes(String(req.query.includeArchived = '1'|'true').toLowerCase());

    const whereAND = [{ userId: req.user.id }];
    if (!includeArchived) whereAND.push({ activo: true });

    const list = await PaymentMethod.findAll({
      where: { [Op.and]: whereAND },
      order: [['activo', 'DESC'], ['nombre', 'ASC']],
    });

    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** Editar: nombre y/o activo (solo dueño o admin) */
exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pm = await PaymentMethod.findByPk(id);
    if (!pm) return res.status(404).json({ error: 'No encontrado' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && pm.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { nombre, activo } = req.body;
    const patch = {};
    if (nombre !== undefined) patch.nombre = String(nombre || '').trim();
    if (activo !== undefined) patch.activo = !!activo;

    await pm.update(patch);
    res.json({ message: 'Método editado correctamente', data: pm, updated: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/** Uso: cuántas transacciones referencian el método (del usuario) */
exports.usage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const txCount = await Transaction.count({
      where: { userId: req.user.id, paymentMethodId: id },
    });
    res.json({ txCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** Eliminar con opciones
 *  - ?cascade=1 => elimina transacciones del usuario con ese método + el método
 *  - ?archive=1 => marca activo=false (conserva historial)
 *  - Sin opciones: si tiene uso => 409 con conteos para que el front pregunte
 */
exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const pm = await PaymentMethod.findByPk(id);
    if (!pm) return res.status(404).json({ error: 'No encontrado' });

    const isAdmin = req.user.role === 'admin';
    if (!isAdmin && pm.userId !== req.user.id) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const cascade = ['1', 'true', 'yes'].includes(String(req.query.cascade || '').toLowerCase());
    const archive = ['1', 'true', 'yes'].includes(String(req.query.archive || '').toLowerCase());

    const txCount = await Transaction.count({
      where: { userId: req.user.id, paymentMethodId: id },
    });

    // Archivar (mantener historial)
    if (archive) {
      if (pm.activo === false) {
        return res.json({ ok: true, archived: true, note: 'Ya estaba inactivo', txCount });
      }
      await pm.update({ activo: false });
      return res.json({ ok: true, archived: true, txCount });
    }

    // Sin opciones: si tiene uso, 409 para que el front pregunte
    if (!cascade && txCount > 0) {
      return res.status(409).json({
        error: 'Método en uso',
        txCount,
        message: 'El método de pago tiene transacciones. Elige eliminar todo (cascade) o archivar.',
      });
    }

    // Cascada o sin uso → borrar
    if (cascade && txCount > 0) {
      await Transaction.destroy({ where: { userId: req.user.id, paymentMethodId: id } });
    }
    await pm.destroy();

    res.json({ ok: true, deleted: true, txDeleted: txCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
