const { Transaction, Category, PaymentMethod } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

function datesLabel(from, to){
  return `${from || 'inicio'}_a_${to || 'hoy'}`.replace(/:/g,'-');
}

exports.transactionsExport = async (req, res) => {
  try {
    const { from, to, categoryId, paymentMethodId, format } = req.query;
    const where = { userId: req.user.id };
    if (from && to) where.fecha = { [Op.between]: [from, to] };
    if (categoryId) where.categoryId = categoryId;
    if (paymentMethodId) where.paymentMethodId = paymentMethodId;

    const txs = await Transaction.findAll({
      where,
      order: [['fecha', 'ASC']],
      include: [
        { model: Category, as: 'category' },
        { model: PaymentMethod, as: 'paymentMethod' }
      ]
    });

    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Transacciones');
      ws.columns = [
        { header: 'Fecha', key: 'fecha', width: 12 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Categoría', key: 'categoria', width: 20 },
        { header: 'Tipo', key: 'tipo', width: 10 },
        { header: 'Método', key: 'metodo', width: 18 },
        { header: 'Monto', key: 'monto', width: 12 }
      ];
      txs.forEach(t => {
        ws.addRow({
          fecha: t.fecha,
          descripcion: t.descripcion || '',
          categoria: t.category?.nombre || '',
          tipo: t.category?.tipo || '',
          metodo: t.paymentMethod?.nombre || '',
          monto: t.monto
        });
      });
      const buf = await wb.xlsx.writeBuffer();
      const fname = `reporte_transacciones_${datesLabel(from,to)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      return res.send(Buffer.from(buf));
    } else {
      const doc = new PDFDocument({ margin: 40 });
      const chunks = [];
      doc.on('data', c => chunks.push(c));
      doc.on('end', () => {
        const buf = Buffer.concat(chunks);
        const fname = `reporte_transacciones_${datesLabel(from,to)}.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
        res.send(buf);
      });

      doc.fontSize(18).text('Reporte de Transacciones', { align: 'center' });
      doc.moveDown(0.5);
      if (from || to) doc.fontSize(10).text(`Rango: ${from || '-'} a ${to || '-'}`, { align: 'center' });
      doc.moveDown(1);

      // Header
      doc.fontSize(12).text('Fecha', 40, doc.y, { continued: true });
      doc.text('Descripción', 110, undefined, { continued: true });
      doc.text('Categoría', 310, undefined, { continued: true });
      doc.text('Método', 410, undefined, { continued: true });
      doc.text('Monto', 500);
      doc.moveTo(40, doc.y+2).lineTo(570, doc.y+2).stroke();

      let total = 0;
      doc.moveDown(0.5);
      txs.forEach(t => {
        total += Number(t.monto) || 0;
        doc.fontSize(10);
        doc.text(String(t.fecha).slice(0,10), 40, doc.y, { continued: true });
        doc.text((t.descripcion || '').slice(0,40), 110, undefined, { continued: true });
        doc.text((t.category?.nombre || ''), 310, undefined, { continued: true });
        doc.text((t.paymentMethod?.nombre || ''), 410, undefined, { continued: true });
        doc.text((Number(t.monto).toFixed(2)), 500);
      });

      doc.moveDown(1);
      doc.fontSize(12).text(`Total: S/ ${total.toFixed(2)}`, { align: 'right' });
      doc.end();
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
