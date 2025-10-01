const { Category, UserCategoryHide, Transaction } = require('../models');
const { Op } = require('sequelize');

/** Crear categoría (igual que la tuya) */
exports.create = async (req, res) => {
  const { nombre, tipo, global } = req.body;
  try {
    if (global === true && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo admin puede crear categorías globales' });
    }
    const cat = await Category.create({
      nombre,
      tipo,
      global: !!global,
      userId: global ? null : req.user.id
    });
    res.status(201).json({ message: 'Categoría registrada correctamente', data: cat });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/** Listar: propias + globales NO ocultas por el usuario */
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;

    const hidden = await UserCategoryHide.findAll({
      where: { userId, hidden: true },
      attributes: ['categoryId']
    });
    const hiddenIds = hidden.map(r => r.categoryId);

    const cats = await Category.findAll({
      where: {
        [Op.and]: [
          { [Op.or]: [{ global: true }, { userId }] },
          hiddenIds.length ? { id: { [Op.notIn]: hiddenIds } } : {}
        ]
      },
      order: [['global', 'DESC'], ['nombre', 'ASC']]
    });
    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** Editar (igual que la tuya: global solo admin, personal solo dueño) */
exports.update = async (req, res) => {
  try {
    const id = req.params.id;
    const { nombre, tipo, global } = req.body;
    const userId  = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'No encontrado' });

    // ---- Caso 1: categoría GLOBAL ----
    if (cat.global) {
      if (isAdmin) {
        // Admin: actualiza realmente la global
        const newGlobal = (global !== undefined) ? !!global : cat.global; // opcional
        await cat.update({
          nombre: nombre ?? cat.nombre,
          tipo:   tipo   ?? cat.tipo,
          global: newGlobal
        });
        return res.json({ message: 'Categoría global actualizada', data: cat, updated: true });
      } else {
        // No-admin: copy-on-write => crea una versión personal y oculta la global
        const newName = (nombre ?? cat.nombre)?.trim();
        const newTipo = (tipo   ?? cat.tipo);

        const [copy] = await Category.findOrCreate({
          where: { userId, nombre: newName },
          defaults: { nombre: newName, tipo: newTipo, global: false, userId }
        });

        // Si ya existía y cambió el tipo, actualízalo
        if (copy.tipo !== newTipo) await copy.update({ tipo: newTipo });

        // Oculta la global para este usuario
        await UserCategoryHide.findOrCreate({
          where: { userId, categoryId: cat.id },
          defaults: { hidden: true }
        });

        return res.json({
          message: 'Se creó tu versión personal de la categoría',
          data: copy,
          personalized: true
        });
      }
    }

    // ---- Caso 2: categoría PERSONAL ----
    if (!isAdmin && cat.userId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    // (Opcional) impedir que un no-admin la marque como global
    const newGlobal = (global !== undefined) ? !!global : cat.global;
    if (newGlobal && !isAdmin) {
      return res.status(403).json({ error: 'Solo admin puede marcar como global' });
    }

    await cat.update({
      nombre: nombre ?? cat.nombre,
      tipo:   tipo   ?? cat.tipo,
      global: newGlobal
    });

    res.json({ message: 'Categoría editada correctamente', data: cat, updated: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/** Eliminar: personal -> delete real; global (no admin) -> ocultar; global (admin) -> delete real */
exports.remove = async (req, res) => {
  try {
    const userId = req.user.id;
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'No encontrado' });

    // Personal: solo dueño puede borrar
    if (!cat.global) {
      if (cat.userId !== userId) return res.status(403).json({ error: 'No autorizado' });

      // (Opcional) impide borrar si tiene transacciones del usuario
      const usadas = await Transaction.count({ where: { userId, categoryId: cat.id } }).catch(()=>0);
      if (usadas > 0) {
        return res.status(400).json({ error: 'No se puede eliminar: tiene transacciones asociadas' });
      }

      await cat.destroy();
      return res.json({ message: 'Categoría eliminada correctamente', deleted: true });
    }

    // Global: si NO es admin => ocultar solo para este usuario
    if (cat.global && req.user.role !== 'admin') {
      await UserCategoryHide.findOrCreate({
        where: { userId, categoryId: cat.id },
        defaults: { hidden: true }
      });
      return res.json({ message: 'Categoría global ocultada para ti', hiddenForUser: true });
    }

    // Global y admin: eliminar realmente
    if (cat.global && req.user.role === 'admin') {
      await cat.destroy();
      return res.json({ message: 'Categoría global eliminada', deleted: true });
    }

    return res.status(400).json({ error: 'Operación no válida' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** Restaurar una global oculta para el usuario */
exports.restore = async (req, res) => {
  try {
    const userId = req.user.id;
    const row = await UserCategoryHide.findOne({ where: { userId, categoryId: req.params.id } });
    if (!row) return res.status(404).json({ error: 'La categoría no estaba oculta para ti' });

    await row.destroy();
    res.json({ message: 'Categoría global restaurada para ti', restored: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
