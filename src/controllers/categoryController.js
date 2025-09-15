const { Category } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res) => {
  const { nombre, tipo, global } = req.body;
  try {
    if (global === true && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo admin puede crear categorías globales' });
    }
    const cat = await Category.create({ nombre, tipo, global: !!global, userId: global ? null : req.user.id });
    res.status(201).json({ message: 'Categoría registrada correctamente', data: cat });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const cats = await Category.findAll({
      where: {
        [Op.or]: [
          { global: true },
          { userId: req.user.id }
        ]
      },
      order: [['global', 'DESC'], ['nombre', 'ASC']]
    });
    res.json(cats);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'No encontrado' });

    if (cat.global && req.user.role !== 'admin') return res.status(403).json({ error: 'Solo admin puede modificar globales' });
    if (!cat.global && cat.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    const newGlobal = req.body.global ?? cat.global;
    if (newGlobal === true && req.user.role !== 'admin') return res.status(403).json({ error: 'Solo admin puede marcar como global' });

    await cat.update({
      nombre: req.body.nombre ?? cat.nombre,
      tipo: req.body.tipo ?? cat.tipo,
      global: newGlobal
    });
    res.json({ message: 'Categoría editada correctamente', data: cat });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const cat = await Category.findByPk(req.params.id);
    if (!cat) return res.status(404).json({ error: 'No encontrado' });

    if (cat.global && req.user.role !== 'admin') return res.status(403).json({ error: 'Solo admin puede eliminar globales' });
    if (!cat.global && cat.userId !== req.user.id) return res.status(403).json({ error: 'No autorizado' });

    await cat.destroy();
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
