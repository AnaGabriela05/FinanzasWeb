const { PaymentMethod } = require('../models');

exports.create = async (req, res) => {
  try {
    const { nombre, activo } = req.body;
    const pm = await PaymentMethod.create({ nombre, activo, userId: req.user.id });
    res.status(201).json({ message: 'Método registrado correctamente', data: pm });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const list = await PaymentMethod.findAll({ where: { userId: req.user.id } });
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const pm = await PaymentMethod.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!pm) return res.status(404).json({ error: 'No encontrado' });
    await pm.update({ nombre: req.body.nombre ?? pm.nombre, activo: req.body.activo ?? pm.activo });
    res.json({ message: 'Método editado correctamente', data: pm });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const pm = await PaymentMethod.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!pm) return res.status(404).json({ error: 'No encontrado' });
    await pm.destroy();
    res.json({ message: 'Método eliminado correctamente' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
