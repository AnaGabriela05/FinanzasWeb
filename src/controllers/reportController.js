// src/controllers/reportController.js
const { Transaction, Category, PaymentMethod } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

/* ------------------------ helpers ------------------------ */
function datesLabel(from, to) {
  return `${from || 'inicio'}_a_${to || 'hoy'}`.replace(/:/g, '-');
}

// Paletas suaves para los gráficos PDF
const COLORS = {
  income: '#60a5fa', // azul claro
  expense: '#fda4af', // rosa
  pie: ['#60a5fa','#f9a8d4','#a7f3d0','#fde68a','#c7d2fe','#fca5a5','#86efac','#fed7aa']
};

/* =========================================================
   GET /api/reports/transactions/export?format=xlsx|pdf
   - Excel: listado con columnas Ingreso/Gasto
   - PDF  : listado (ingreso/gasto separados) + gráficos debajo
   ========================================================= */
exports.transactionsExport = async (req, res) => {
  try {
    const { from, to, categoryId, paymentMethodId, format } = req.query;

    // Filtro base por usuario
    const where = { userId: req.user.id };
    if (from && to) where.fecha = { [Op.between]: [from, to] };
    if (categoryId) where.categoryId = categoryId;
    if (paymentMethodId) where.paymentMethodId = paymentMethodId;

    // Carga de transacciones
    const txs = await Transaction.findAll({
      where,
      order: [['fecha', 'ASC']],
      include: [
        { model: Category, as: 'category' },
        { model: PaymentMethod, as: 'paymentMethod' }
      ]
    });

    /* -------------------------- EXCEL -------------------------- */
    if (format === 'xlsx') {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Transacciones');

      ws.columns = [
        { header: 'Fecha',        key: 'fecha',       width: 12 },
        { header: 'Descripción',  key: 'descripcion', width: 40 },
        { header: 'Categoría',    key: 'categoria',   width: 20 },
        { header: 'Tipo',         key: 'tipo',        width: 10 },
        { header: 'Método',       key: 'metodo',      width: 18 },
        { header: 'Ingreso',      key: 'ingreso',     width: 12 },
        { header: 'Gasto',        key: 'gasto',       width: 12 }
      ];

      txs.forEach(t => {
        const isIncome = t.category?.tipo === 'ingreso';
        ws.addRow({
          fecha:        t.fecha,
          descripcion:  t.descripcion || '',
          categoria:    t.category?.nombre || '',
          tipo:         t.category?.tipo || '',
          metodo:       t.paymentMethod?.nombre || '',
          ingreso:      isIncome ? Number(t.monto) : '',
          gasto:        !isIncome ? Number(t.monto) : ''
        });
      });

      const buf = await wb.xlsx.writeBuffer();
      const fname = `reporte_transacciones_${datesLabel(from,to)}.xlsx`;
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      return res.send(Buffer.from(buf));
    }

    /* ---------------------------- PDF ---------------------------- */

    // 1) Totales y agregados
    let totalIn = 0, totalOut = 0;

    // series por mes (YYYY-MM)
    const incByMonth = new Map();
    const expByMonth = new Map();

    // distribución de gastos por categoría
    const expByCat = new Map();

    txs.forEach(t => {
      const amt  = Number(t.monto) || 0;
      const tipo = t.category?.tipo || '';
      const ym   = String(t.fecha).slice(0, 7); // YYYY-MM

      if (tipo === 'ingreso') {
        totalIn += amt;
        incByMonth.set(ym, (incByMonth.get(ym) || 0) + amt);
      } else if (tipo === 'gasto') {
        totalOut += amt;
        expByMonth.set(ym, (expByMonth.get(ym) || 0) + amt);
        const catName = t.category?.nombre || '—';
        expByCat.set(catName, (expByCat.get(catName) || 0) + amt);
      }
    });

    const saldo = totalIn - totalOut;

    // meses ordenados y arrays
    const allMonths = Array.from(new Set([...incByMonth.keys(), ...expByMonth.keys()])).sort();
    const incomeSeries  = allMonths.map(m => incByMonth.get(m) || 0);
    const expenseSeries = allMonths.map(m => expByMonth.get(m) || 0);
    const catLabels = Array.from(expByCat.keys());
    const catSeries = catLabels.map(k => expByCat.get(k));

    // 2) Construcción del PDF
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

    // Encabezado
    doc.fontSize(18).text('Reporte de Transacciones', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).text(`Rango: ${from || '-'} a ${to || '-'}`, { align: 'center' });
    doc.moveDown(0.8);

    // Tabla: encabezados
    const X = { fecha:40, desc:110, cat:260, metodo:380, ingreso:470, gasto:530 };
    const ROW_H = 16;
    doc.fontSize(12);
    doc.text('Fecha',        X.fecha,  doc.y);
    doc.text('Descripción',  X.desc,   doc.y);
    doc.text('Categoría',    X.cat,    doc.y);
    doc.text('Método',       X.metodo, doc.y);
    doc.text('Ingreso',      X.ingreso,doc.y);
    doc.text('Gasto',        X.gasto,  doc.y);
    doc.moveTo(40, doc.y + 4).lineTo(570, doc.y + 4).stroke();
    doc.moveDown(0.5);

    // Filas
    doc.fontSize(10);
    txs.forEach(t => {
      const y        = doc.y;
      const isIncome = t.category?.tipo === 'ingreso';

      doc.text(String(t.fecha).slice(0,10),  X.fecha,   y);
      doc.text((t.descripcion || '').slice(0,32), X.desc,    y);
      doc.text(t.category?.nombre || '',    X.cat,     y);
      doc.text(t.paymentMethod?.nombre || '', X.metodo, y);
      doc.text(isIncome ? Number(t.monto).toFixed(2) : '', X.ingreso, y, { width: 60, align: 'right' });
      doc.text(!isIncome ? Number(t.monto).toFixed(2) : '', X.gasto,   y, { width: 60, align: 'right' });
      doc.moveDown(ROW_H / 12);
    });

    // Totales
    doc.moveDown(0.6);
    doc.fontSize(12);
    doc.text(`Total ingresos: S/ ${totalIn.toFixed(2)}`,                370, doc.y, { width: 200, align: 'right' });
    doc.text(`Total gastos: S/ ${totalOut.toFixed(2)}`,                 370, doc.y, { width: 200, align: 'right' });
    doc.text(`Saldo (ingresos - gastos): S/ ${saldo.toFixed(2)}`,       370, doc.y, { width: 200, align: 'right' });

    // 3) Gráficos debajo del listado
    doc.addPage();
    doc.fontSize(14).text('Panel visual', { align: 'left' });
    doc.moveDown(0.5);

    // Render de charts con Chart.js en Node
    const barWidth = 900, barHeight = 360;
    const pieWidth = 900, pieHeight = 360;
    const chart = new ChartJSNodeCanvas({
      width: barWidth,
      height: barHeight,
      backgroundColour: 'white' // para que no quede transparente
    });

    // Barras: Ingresos vs Gastos por mes
    const barCfg = {
      type: 'bar',
      data: {
        labels: allMonths,
        datasets: [
          { label: 'Ingresos', data: incomeSeries,  backgroundColor: COLORS.income },
          { label: 'Gastos',   data: expenseSeries, backgroundColor: COLORS.expense }
        ]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        scales:  { y: { beginAtZero: true } }
      }
    };
    const barImg = await chart.renderToBuffer(barCfg, 'image/png');

    // Pie: Distribución de gastos por categoría
    const pieCfg = {
      type: 'pie',
      data: {
        labels: catLabels.length ? catLabels : ['Sin datos'],
        datasets: [{
          data: catSeries.length ? catSeries : [1],
          backgroundColor: COLORS.pie
        }]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    };
    // Para mantener mismo ancho que barras
    const chartPie = new ChartJSNodeCanvas({
      width: pieWidth,
      height: pieHeight,
      backgroundColour: 'white'
    });
    const pieImg = await chartPie.renderToBuffer(pieCfg, 'image/png');

    // Inserta imágenes
    const pageW = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const maxW  = Math.min(pageW, 520);

    doc.fontSize(12).text('Ingresos vs Gastos por mes', { align: 'left' });
    doc.image(barImg, { fit: [maxW, (barHeight * maxW) / barWidth], align: 'center' });
    doc.moveDown(0.6);

    doc.fontSize(12).text('Distribución de gastos por categoría', { align: 'left' });
    doc.image(pieImg, { fit: [maxW, (pieHeight * maxW) / pieWidth], align: 'center' });

    doc.end();
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* =========================================================
   GET /api/reports/insights
   - Devuelve totales, series por mes y distribución por categoría
   - Consumido por el dashboard (Chart.js en el front)
   ========================================================= */
exports.insights = async (req, res) => {
  try {
    const { from, to, categoryId, paymentMethodId } = req.query;

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

    // Totales
    let ingresos = 0, gastos = 0;

    // Series por mes (YYYY-MM)
    const incByMonth = new Map();
    const expByMonth = new Map();

    // Distribución de gastos por categoría
    const expByCat = new Map();

    for (const t of txs) {
      const tipo  = t.category?.tipo || '';
      const monto = Number(t.monto) || 0;
      const ym    = String(t.fecha).slice(0, 7);

      if (tipo === 'ingreso') {
        ingresos += monto;
        incByMonth.set(ym, (incByMonth.get(ym) || 0) + monto);
      } else if (tipo === 'gasto') {
        gastos += monto;
        expByMonth.set(ym, (expByMonth.get(ym) || 0) + monto);
        const catName = t.category?.nombre || '—';
        expByCat.set(catName, (expByCat.get(catName) || 0) + monto);
      }
    }

    const saldo = ingresos - gastos;

    const months = Array.from(new Set([...incByMonth.keys(), ...expByMonth.keys()])).sort();
    const monthlyIncome  = months.map(m => incByMonth.get(m) || 0);
    const monthlyExpense = months.map(m => expByMonth.get(m) || 0);

    const catLabels = Array.from(expByCat.keys());
    const catExpense = catLabels.map(k => expByCat.get(k));

    return res.json({
      totals: { ingresos, gastos, saldo },
      count: txs.length,
      monthly: {
        labels: months,
        income: monthlyIncome,
        expense: monthlyExpense
      },
      categories: {
        labels: catLabels,
        expense: catExpense
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
