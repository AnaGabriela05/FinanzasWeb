// controllers/categoryController.js
const { Op } = require('sequelize');
const { Category, UserCategoryHide, Transaction, Budget } = require('../models');
const sequelize = require('../config/database');

/** Crear categoría */
exports.create = async (req, res) => {
  try {
    const { nombre, tipo, global } = req.body;
    const isAdmin = req.user.role === 'admin';

    if (global === true && !isAdmin) {
      return res.status(403).json({ error: 'Solo admin puede crear categorías globales' });
    }

    const cat = await Category.create({
      nombre,
      tipo,
      global: !!global,
      userId: global ? null : req.user.id,
      activo: true
    });

    res.status(201).json({ message: 'Categoría registrada correctamente', data: cat });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/**
 * Listar: propias + globales no ocultas.
 * Por defecto devuelve solo activas (activo=true).
 * Usa ?includeArchived=1 para incluir también inactivas.
 */
exports.list = async (req, res) => {
  try {
    const userId = req.user.id;
    const includeArchived = ['1','true','yes'].includes(String(req.query.includeArchived = '1'|'true').toLowerCase());

    // ids de globales ocultas para este usuario
    const hidden = await UserCategoryHide.findAll({
      where: { userId, hidden: true },
      attributes: ['categoryId']
    });
    const hiddenIds = hidden.map(r => r.categoryId);

    const whereAND = [
      { [Op.or]: [{ global: true }, { userId }] },
      hiddenIds.length ? { id: { [Op.notIn]: hiddenIds } } : {}
    ];
    if (!includeArchived) whereAND.push({ activo: true });

    const cats = await Category.findAll({
      where: { [Op.and]: whereAND },
      order: [['global', 'DESC'], ['nombre', 'ASC']]
    });

    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * Editar:
 * - Global:
 *    - admin actualiza la global (incluido 'activo')
 *    - no-admin: crea copia personal (copy-on-write) y oculta la global
 * - Personal:
 *    - owner/admin actualizan; si intenta marcar como global y no es admin => 403
 *    - acepta 'activo' para archivar/restaurar
 */
exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nombre, tipo, global, activo } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'No encontrado' });

    // Global
    if (cat.global) {
      if (!isAdmin) {
        // Copy-on-write: crear versión personal y ocultar global para este usuario
        const newName = (nombre ?? cat.nombre)?.trim();
        const newTipo = (tipo   ?? cat.tipo);

        const [copy] = await Category.findOrCreate({
          where: { userId, nombre: newName },
          defaults: { nombre: newName, tipo: newTipo, global: false, userId, activo: true }
        });
        if (copy.tipo !== newTipo) await copy.update({ tipo: newTipo });

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

      // Admin puede tocar todo (incluido activo / global)
      const newGlobal = (global !== undefined) ? !!global : cat.global;
      const newActivo = (activo !== undefined) ? !!activo : cat.activo;

      await cat.update({
        nombre: nombre ?? cat.nombre,
        tipo:   tipo   ?? cat.tipo,
        global: newGlobal,
        activo: newActivo
      });

      return res.json({ message: 'Categoría global actualizada', data: cat, updated: true });
    }

    // Personal
    if (!isAdmin && cat.userId !== userId) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const newGlobal = (global !== undefined) ? !!global : cat.global;
    if (newGlobal && !isAdmin) {
      return res.status(403).json({ error: 'Solo admin puede marcar como global' });
    }
    const newActivo = (activo !== undefined) ? !!activo : cat.activo;

    await cat.update({
      nombre: nombre ?? cat.nombre,
      tipo:   tipo   ?? cat.tipo,
      global: newGlobal,
      activo: newActivo
    });

    res.json({ message: 'Categoría editada correctamente', data: cat, updated: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

/**
 * Uso de una categoría:
 * - Por defecto cuenta para el usuario actual.
 * - Si la categoría es global y el usuario es admin, puedes pasar ?scope=all para contar en toda la plataforma.
 */
exports.usage = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    const scopeAll = String(req.query.scope || '').toLowerCase() === 'all';

    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'No encontrado' });

    const whereScope = (cat.global && isAdmin && scopeAll)
      ? { categoryId: id }            // toda la plataforma
      : { userId, categoryId: id };   // solo del usuario

    const [txCount, budgetCount] = await Promise.all([
      Transaction.count({ where: whereScope }),
      Budget.count({ where: whereScope }),
    ]);

    res.json({ txCount, budgetCount, scope: (cat.global && isAdmin && scopeAll) ? 'all' : 'mine' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * Eliminar con opciones:
 * - ?cascade=1  => elimina (según scope) transacciones + presupuestos + categoría
 * - ?archive=1  => marca activo=false (mantiene historial)
 * Reglas:
 *  - Global & NO admin => no borra ni archiva para todos → se OCULTA para el usuario
 *  - Si hay uso y no se especifica cascade/archive → 409 con conteos para que el front elija
 *  - Admin + global + cascade => borra en TODA la plataforma
 */
exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const cascade = ['1','true','yes'].includes(String(req.query.cascade || '').toLowerCase());
    const archive = ['1','true','yes'].includes(String(req.query.archive || '').toLowerCase());

    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'No encontrado' });

    // Global & no-admin => ocultar para el usuario
    if (cat.global && !isAdmin) {
      await UserCategoryHide.findOrCreate({
        where: { userId, categoryId: cat.id },
        defaults: { hidden: true }
      });
      return res.json({ message: 'Categoría global ocultada para ti', hiddenForUser: true });
    }

    // Scope para conteos y cascada
    const whereScope = (cat.global && isAdmin)
      ? { categoryId: id }            // TODA la plataforma
      : { userId, categoryId: id };   // solo del usuario

    const [txCount, budgetCount] = await Promise.all([
      Transaction.count({ where: whereScope }),
      Budget.count({ where: whereScope }),
    ]);

    // Archivar (mantener historial): cambia activo=false
    if (archive) {
      if (!cat.activo) {
        return res.json({ ok: true, archived: true, note: 'Ya estaba inactiva', txCount, budgetCount });
      }
      await cat.update({ activo: false });
      return res.json({ ok: true, archived: true, txCount, budgetCount });
    }

    // Sin opciones: si está en uso, pide decisión al front
    if (!cascade && (txCount > 0 || budgetCount > 0)) {
      return res.status(409).json({
        error: 'Categoría en uso',
        txCount, budgetCount,
        message: 'La categoría tiene registros. Elige eliminar todo (cascade) o archivar.'
      });
    }

    // Cascada o eliminación simple
    await sequelize.transaction(async (t) => {
      if (cascade) {
        await Transaction.destroy({ where: whereScope, transaction: t });
        await Budget.destroy({ where: whereScope, transaction: t });
      }
      await Category.destroy({ where: { id }, transaction: t });
    });

    res.json({ ok: true, deleted: true, txDeleted: txCount, budgetsDeleted: budgetCount });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/** Restaurar una global ocultada para el usuario (des-ocultar) */
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
