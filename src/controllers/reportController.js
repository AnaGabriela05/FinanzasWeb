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
  pie: ['#60a5fa', '#f9a8d4', '#a7f3d0', '#fde68a', '#c7d2fe', '#fca5a5', '#86efac', '#fed7aa']
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
        { header: 'Fecha', key: 'fecha', width: 12 },
        { header: 'Descripción', key: 'descripcion', width: 40 },
        { header: 'Categoría', key: 'categoria', width: 20 },
        { header: 'Tipo', key: 'tipo', width: 10 },
        { header: 'Método', key: 'metodo', width: 18 },
        { header: 'Ingreso', key: 'ingreso', width: 12 },
        { header: 'Gasto', key: 'gasto', width: 12 }
      ];

      txs.forEach(t => {
        const isIncome = t.category?.tipo === 'ingreso';
        ws.addRow({
          fecha: t.fecha,
          descripcion: t.descripcion || '',
          categoria: t.category?.nombre || '',
          tipo: t.category?.tipo || '',
          metodo: t.paymentMethod?.nombre || '',
          ingreso: isIncome ? Number(t.monto) : '',
          gasto: !isIncome ? Number(t.monto) : ''
        });
      });

      const buf = await wb.xlsx.writeBuffer();
      const fname = `reporte_transacciones_${datesLabel(from, to)}.xlsx`;
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
      const amt = Number(t.monto) || 0;
      const tipo = t.category?.tipo || '';
      const ym = String(t.fecha).slice(0, 7); // YYYY-MM

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
    const incomeSeries = allMonths.map(m => incByMonth.get(m) || 0);
    const expenseSeries = allMonths.map(m => expByMonth.get(m) || 0);
    const catLabels = Array.from(expByCat.keys());
    const catSeries = catLabels.map(k => expByCat.get(k));

    // 2) Construcción del PDF
    const doc = new PDFDocument({ margin: 40 });
    const chunks = [];
    doc.on('data', c => chunks.push(c));
    doc.on('end', () => {
      const buf = Buffer.concat(chunks);
      const fname = `reporte_transacciones_${datesLabel(from, to)}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);
      res.send(buf);
    });

    // Encabezado
    doc.fontSize(18).text('Reporte de Transacciones', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).text(`Rango: ${from || '-'} a ${to || '-'}`, { align: 'center' });
    doc.moveDown(0.8);

    // ======== Tabla (encabezado + filas con salto de página) ========
    const LEFT = doc.page.margins.left;
    const RIGHT = doc.page.width - doc.page.margins.right;
    const TABLE_W = RIGHT - LEFT;
    const HEADER_H = 22;
    const ROW_H = 18;

    // Distribución que sí cabe en ~515 px de ancho útil
    const COLS = [
      { key: 'fecha', label: 'Fecha', w: 70, align: 'left' },
      { key: 'desc', label: 'Descripción', w: 150, align: 'left' },
      { key: 'cat', label: 'Categoría', w: 95, align: 'left' },
      { key: 'met', label: 'Método', w: 70, align: 'left' },
      { key: 'ing', label: 'Ingreso', w: 80, align: 'right' },
      { key: 'gas', label: 'Gasto', w: 50, align: 'right' }
    ];
    // Calcula x de cada columna
    let accX = LEFT;
    COLS.forEach(c => { c.x = accX; accX += c.w; });

    // Aux para cortar texto con “…”
    function fitText(str, maxW, fontSize = 10, fontName = 'Helvetica') {
      if (!str) return '';
      doc.font(fontName).fontSize(fontSize);
      if (doc.widthOfString(str) <= maxW) return str;
      const ell = '…';
      let s = str;
      while (s.length && doc.widthOfString(s + ell) > maxW) s = s.slice(0, -1);
      return s + ell;
    }

    // Dibuja cabecera
    function drawHeader() {
      const y = doc.y + 4;
      // fondo
      doc.save();
      doc.lineWidth(0.5)
        .fillColor('#F3F4F6')
        .strokeColor('#E5E7EB')
        .roundedRect(LEFT, y, TABLE_W, HEADER_H, 6)
        .fillAndStroke();

      // títulos
      doc.fillColor('#111827').font('Helvetica-Bold').fontSize(11);
      COLS.forEach(c => {
        doc.text(
          c.label,
          c.x + 6,
          y + 6,
          { width: c.w - 12, align: c.align }
        );
      });

      // líneas verticales (suaves)
      doc.strokeColor('#E5E7EB');
      COLS.slice(1).forEach(c => {
        doc.moveTo(c.x, y).lineTo(c.x, y + HEADER_H).stroke();
      });

      doc.restore();
      doc.y = y + HEADER_H; // posiciona el cursor debajo de la cabecera
    }

    // Dibuja una fila
    function drawRow(t) {
      const y = doc.y;
      // línea inferior de la fila
      doc.save();
      doc.strokeColor('#F1F5F9').lineWidth(0.5);
      doc.moveTo(LEFT, y + ROW_H).lineTo(LEFT + TABLE_W, y + ROW_H).stroke();
      doc.restore();

      const isIncome = t.category?.tipo === 'ingreso';
      const fecha = String(t.fecha).slice(0, 10);
      const desc = fitText(t.descripcion || '', COLS[1].w - 12);
      const cat = fitText(t.category?.nombre || '', COLS[2].w - 12);
      const met = fitText(t.paymentMethod?.nombre || '', COLS[3].w - 12);
      const ing = isIncome ? Number(t.monto).toFixed(2) : '';
      const gas = !isIncome ? Number(t.monto).toFixed(2) : '';

      doc.font('Helvetica').fontSize(10).fillColor('#111827');
      doc.text(fecha, COLS[0].x + 6, y + 4, { width: COLS[0].w - 12, align: COLS[0].align });
      doc.text(desc, COLS[1].x + 6, y + 4, { width: COLS[1].w - 12, align: COLS[1].align });
      doc.text(cat, COLS[2].x + 6, y + 4, { width: COLS[2].w - 12, align: COLS[2].align });
      doc.text(met, COLS[3].x + 6, y + 4, { width: COLS[3].w - 12, align: COLS[3].align });
      doc.text(ing, COLS[4].x + 6, y + 4, { width: COLS[4].w - 12, align: COLS[4].align });
      doc.text(gas, COLS[5].x + 6, y + 4, { width: COLS[5].w - 12, align: COLS[5].align });

      doc.y = y + ROW_H;
    }

    // Llama a la cabecera y recorre filas, reimprimiéndola cuando se hace un salto de página
    const BOTTOM_LIMIT = doc.page.height - doc.page.margins.bottom - 120; // deja aire para totales
    drawHeader();
    txs.forEach(t => {
      if (doc.y + ROW_H > BOTTOM_LIMIT) {
        doc.addPage();
        drawHeader();
      }
      drawRow(t);
    });


    // Totales
    doc.moveDown(0.6);
    doc.fontSize(12);
    doc.text(`Total ingresos: S/ ${totalIn.toFixed(2)}`, 370, doc.y, { width: 200, align: 'right' });
    doc.text(`Total gastos: S/ ${totalOut.toFixed(2)}`, 370, doc.y, { width: 200, align: 'right' });
    doc.text(`Saldo (ingresos - gastos): S/ ${saldo.toFixed(2)}`, 370, doc.y, { width: 200, align: 'right' });

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
          { label: 'Ingresos', data: incomeSeries, backgroundColor: COLORS.income },
          { label: 'Gastos', data: expenseSeries, backgroundColor: COLORS.expense }
        ]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } }
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
    const maxW = Math.min(pageW, 520);

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
      const tipo = t.category?.tipo || '';
      const monto = Number(t.monto) || 0;
      const ym = String(t.fecha).slice(0, 7);

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
    const monthlyIncome = months.map(m => incByMonth.get(m) || 0);
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
