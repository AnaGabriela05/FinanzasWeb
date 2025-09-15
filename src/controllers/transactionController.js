const { Transaction, Category, PaymentMethod } = require('../models');
const { Op } = require('sequelize');

exports.create = async (req, res) => {
  try {
    const { fecha, monto, descripcion, categoryId, paymentMethodId } = req.body;

    const cat = await Category.findOne({ where: { id: categoryId, [Op.or]: [{ global: true }, { userId: req.user.id }] } });
    if (!cat) return res.status(400).json({ error: 'Categoría inválida' });

    const pm = await PaymentMethod.findOne({ where: { id: paymentMethodId, userId: req.user.id } });
    if (!pm) return res.status(400).json({ error: 'Método de pago inválido' });

    const tx = await Transaction.create({ fecha, monto, descripcion, categoryId, paymentMethodId, userId: req.user.id });
    res.status(201).json({ message: 'Transacción registrada correctamente', data: tx });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.update = async (req, res) => {
  try {
    const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!tx) return res.status(404).json({ error: 'No encontrado' });

    const { fecha, monto, descripcion, categoryId, paymentMethodId } = req.body;

    if (categoryId) {
      const cat = await Category.findOne({ where: { id: categoryId, [Op.or]: [{ global: true }, { userId: req.user.id }] } });
      if (!cat) return res.status(400).json({ error: 'Categoría inválida' });
      tx.categoryId = categoryId;
    }
    if (paymentMethodId) {
      const pm = await PaymentMethod.findOne({ where: { id: paymentMethodId, userId: req.user.id } });
      if (!pm) return res.status(400).json({ error: 'Método de pago inválido' });
      tx.paymentMethodId = paymentMethodId;
    }
    if (fecha) tx.fecha = fecha;
    if (monto != null) tx.monto = monto;
    if (descripcion != null) tx.descripcion = descripcion;

    await tx.save();
    res.json({ message: 'Transacción editada correctamente', data: tx });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

exports.list = async (req, res) => {
  try {
    const where = { userId: req.user.id };
    if (req.query.categoryId) where.categoryId = req.query.categoryId;
    if (req.query.paymentMethodId) where.paymentMethodId = req.query.paymentMethodId;
    if (req.query.from && req.query.to) where.fecha = { [Op.between]: [req.query.from, req.query.to] };
    const txs = await Transaction.findAll({
      where,
      order: [['fecha', 'DESC']],
      include: [
        { model: require('../models').Category, as: 'category' },
        { model: require('../models').PaymentMethod, as: 'paymentMethod' }
      ]
    });
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const tx = await Transaction.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!tx) return res.status(404).json({ error: 'No encontrado' });
    await tx.destroy();
    res.json({ message: 'Transacción eliminada correctamente' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
