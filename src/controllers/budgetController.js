// src/controllers/budgetController.js
const { Budget, Category, UserCategoryHide } = require('../models');
const { Op } = require('sequelize');

// Crear o editar (upsert)
exports.upsert = async (req, res) => {
  try {
    const userId = req.user.id;
    const categoryId   = Number(req.body.categoryId);
    const montoMensual = Number(req.body.montoMensual);
    const mes          = Number(req.body.mes);
    const anio         = Number(req.body.anio);

    if (!categoryId || isNaN(montoMensual) || !mes || !anio) {
      return res.status(400).json({ error: 'Datos inválidos (categoryId, montoMensual, mes, anio)' });
    }

    // 1) Validar que la categoría exista y sea accesible (global o propia)
    const cat = await Category.findOne({
      where: {
        id: categoryId,
        [Op.or]: [{ global: true }, { userId }]
      }
    });
    if (!cat) return res.status(400).json({ error: 'Categoría inválida' });

    // 2) Validar que NO esté oculta para este usuario (si es global y el usuario la ocultó)
    const hidden = await UserCategoryHide.findOne({
      where: { userId, categoryId, hidden: true }
    });
    if (hidden) return res.status(400).json({ error: 'Esta categoría está oculta para ti' });

    // 3) Upsert por (userId, categoryId, mes, anio)
    const [row, created] = await Budget.findOrCreate({
      where: { userId, categoryId, mes, anio },
      defaults: { montoMensual }
    });

    if (!created) {
      row.montoMensual = montoMensual;
      await row.save();
      return res.json({ message: 'Presupuesto editado correctamente', data: row, updated: true });
    }

    return res.status(201).json({ message: 'Presupuesto registrado correctamente', data: row, created: true });
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
};

// Listar
exports.list = async (req, res) => {
  try {
    const where = { userId: req.user.id };
    if (req.query.mes)  where.mes  = Number(req.query.mes);
    if (req.query.anio) where.anio = Number(req.query.anio);

    const budgets = await Budget.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['anio', 'DESC'], ['mes', 'DESC'], ['id', 'DESC']]
    });

    return res.json(budgets);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};

// Eliminar
exports.remove = async (req, res) => {
  try {
    const b = await Budget.findByPk(req.params.id);
    if (!b) return res.status(404).json({ error: 'No encontrado' });
    if (b.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await b.destroy();
    return res.json({ message: 'Presupuesto eliminado correctamente', deleted: true });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
};
exports.update = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = await Budget.findByPk(id);
    if (!b) return res.status(404).json({ error: 'No encontrado' });
    if (b.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    const userId = req.user.id;
    const newCategoryId = req.body.categoryId ?? b.categoryId;
    const newMes        = req.body.mes ?? b.mes;
    const newAnio       = req.body.anio ?? b.anio;
    const newMonto      = (req.body.montoMensual != null) ? Number(req.body.montoMensual) : b.montoMensual;

    // Validar categoría visible y no oculta
    const cat = await Category.findOne({ where: { id: newCategoryId, [Op.or]: [{ global: true }, { userId }] } });
    if (!cat) return res.status(400).json({ error: 'Categoría inválida' });
    const hidden = await UserCategoryHide.findOne({ where: { userId, categoryId: newCategoryId, hidden: true } });
    if (hidden) return res.status(400).json({ error: 'Esta categoría está oculta para ti' });

    // Evitar duplicar (userId,categoryId,mes,anio) contra otro presupuesto
    const dup = await Budget.findOne({
      where: { userId, categoryId: newCategoryId, mes: newMes, anio: newAnio, id: { [Op.ne]: id } }
    });
    if (dup) return res.status(409).json({ error: 'Ya existe un presupuesto para esa categoría, mes y año' });

    await b.update({ categoryId: newCategoryId, mes: newMes, anio: newAnio, montoMensual: newMonto });
    res.json({ message: 'Presupuesto editado correctamente', data: b, updated: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};