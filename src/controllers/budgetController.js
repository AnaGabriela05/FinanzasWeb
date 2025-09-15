const { Budget, Category } = require('../models');
const { Op } = require('sequelize');

exports.upsert = async (req, res) => {
  try {
    const { categoryId, montoMensual, mes, anio } = req.body;
    // Validar que la categoría sea visible para el usuario (global o propia)
    const cat = await Category.findOne({ where: { id: categoryId, [Op.or]: [{ global: true }, { userId: req.user.id }] } });
    if (!cat) return res.status(400).json({ error: 'Categoría inválida' });

    const [row, created] = await Budget.findOrCreate({
      where: { userId: req.user.id, categoryId, mes, anio },
      defaults: { montoMensual }
    });
    if (!created) {
      row.montoMensual = montoMensual;
      await row.save();
      return res.json({ message: 'Presupuesto editado correctamente', data: row });
    }
    res.status(201).json({ message: 'Presupuesto registrado correctamente', data: row });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const where = { userId: req.user.id };
    if (req.query.mes) where.mes = req.query.mes;
    if (req.query.anio) where.anio = req.query.anio;

    const budgets = await Budget.findAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [['anio', 'DESC'], ['mes', 'DESC']]
    });
    res.json(budgets);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
