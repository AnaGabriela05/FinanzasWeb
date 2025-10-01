// src/controllers/reportController.js
const { Transaction, Category, PaymentMethod } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

function datesLabel(from, to) {
  return `${from || 'inicio'}_a_${to || 'hoy'}`.replace(/:/g, '-');
}

exports.transactionsExport = async (req, res) => {
  try {
    const { from, to, categoryId, paymentMethodId, format } = req.query;

    // Filtros
    const where = { userId: req.user.id };
    if (from) where.fecha = { ...(where.fecha || {}), [Op.gte]: from };
    if (to)   where.fecha = { ...(where.fecha || {}), [Op.lte]: to };
    if (categoryId)      where.categoryId = categoryId;
    if (paymentMethodId) where.paymentMethodId = paymentMethodId;

    // Datos
    const txs = await Transaction.findAll({
      where,
      order: [['fecha', 'ASC'], ['id', 'ASC']],
      include: [
        { model: Category, as: 'category', attributes: ['nombre', 'tipo'] },
        { model: PaymentMethod, as: 'paymentMethod', attributes: ['nombre'] }
      ]
    });

    // ---------- XLSX ----------
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Transacciones');

      ws.columns = [
        { header: 'Fecha',        key: 'fecha',       width: 12 },
        { header: 'Descripción',  key: 'descripcion', width: 40 },
        { header: 'Categoría',    key: 'categoria',   width: 24 },
        { header: 'Tipo',         key: 'tipo',        width: 10 },
        { header: 'Método',       key: 'metodo',      width: 18 },
        { header: 'Monto',        key: 'monto',       width: 14 }
      ];

      txs.forEach(t => {
        ws.addRow({
          fecha:        String(t.fecha).slice(0, 10),
          descripcion:  t.descripcion || '',
          categoria:    t.category?.nombre || '',
          tipo:         t.category?.tipo || '',
          metodo:       t.paymentMethod?.nombre || '',
          monto:        Number(t.monto || 0)
        });
      });

      // formato número dos decimales en Monto
      ws.getColumn('monto').numFmt = '#,##0.00';

      const buf = await wb.xlsx.writeBuffer();
      const fname = `reporte_transacciones_${datesLabel(from, to)}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      return res.send(Buffer.from(buf));
    }

    // ---------- PDF ----------
    const doc = new PDFDocument({ margin: 40 /*, size: 'A4'*/ });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      const fname = `reporte_transacciones_${datesLabel(from, to)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      res.send(buf);
    });

    // Título
    doc.fontSize(18).text('Reporte de Transacciones', { align: 'center' });
    doc.moveDown(0.5);
    if (from || to) doc.fontSize(10).text(`Rango: ${from || '-'} a ${to || '-'}`, { align: 'center' });
    doc.moveDown(1);

    // Definición de tabla (incluye Monto)
    const x0 = doc.page.margins.left;
    const widths  = [80, 200, 120, 90, 42]; // Fecha, Descripción, Categoría, Método, Monto
    const headers = ['Fecha', 'Descripción', 'Categoría', 'Método', 'Monto'];
    const tableWidth = widths.reduce((a, b) => a + b, 0);
    let y = doc.y;

    function drawRow(cells) {
      let x = x0;
      cells.forEach((val, i) => {
        const w = widths[i];
        const align = (i === 4) ? 'right' : 'left'; // monto a la derecha
        doc.text(String(val ?? ''), x, y, { width: w, align, lineBreak: false });
        x += w;
      });
      y += 16;
      // salto de página si es necesario
      if (y > doc.page.height - doc.page.margins.bottom - 20) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    }

    // Encabezados
    doc.font('Helvetica-Bold').fontSize(12);
    drawRow(headers);
    doc.moveTo(x0, y - 2).lineTo(x0 + tableWidth, y - 2).lineWidth(0.5).strokeColor('#333').stroke();

    // Filas
    doc.font('Helvetica').fontSize(10);
    let total = 0;

    if (txs.length === 0) {
      drawRow(['—', 'Sin transacciones en el rango', '', '', '0.00']);
    } else {
      txs.forEach(t => {
        const monto = Number(t.monto || 0);
        total += monto;
        drawRow([
          String(t.fecha).slice(0, 10),
          t.descripcion || '',
          t.category?.nombre || '',
          t.paymentMethod?.nombre || '',
          monto.toFixed(2)
        ]);
      });
    }

    // Totales
    doc.moveDown(1);
    doc.font('Helvetica-Bold').fontSize(12)
       .text(`Total: S/ ${total.toFixed(2)}`, x0, y, { align: 'right' });

    doc.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
