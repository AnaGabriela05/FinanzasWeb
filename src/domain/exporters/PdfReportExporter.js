const PDFDocument = require('pdfkit');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');

const COLORS = {
  income: '#60a5fa',
  expense: '#fda4af',
  pie: ['#60a5fa', '#f9a8d4', '#a7f3d0', '#fde68a', '#c7d2fe', '#fca5a5', '#86efac', '#fed7aa']
};

class PdfReportExporter {
  async exportTransactions({ transactions, analysis, query }) {
    const document = new PDFDocument({ margin: 40 });
    const chunks = [];

    document.on('data', (chunk) => chunks.push(chunk));

    const ended = new Promise((resolve) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
    });

    this.drawHeader(document, query);
    this.drawTransactionsTable(document, transactions);
    this.drawTotals(document, analysis.totals);
    await this.drawCharts(document, analysis);
    document.end();

    return ended;
  }

  drawHeader(document, query) {
    document.fontSize(18).text('Reporte de Transacciones', { align: 'center' });
    document.moveDown(0.3);
    document.fontSize(10).text(`Rango: ${query.from || '-'} a ${query.to || '-'}`, { align: 'center' });
    document.moveDown(0.8);
  }

  drawTransactionsTable(document, transactions) {
    const left = document.page.margins.left;
    const right = document.page.width - document.page.margins.right;
    const tableWidth = right - left;
    const headerHeight = 22;
    const rowHeight = 18;
    const bottomLimit = document.page.height - document.page.margins.bottom - 120;
    const columns = [
      { label: 'Fecha', width: 70, align: 'left' },
      { label: 'Descripcion', width: 150, align: 'left' },
      { label: 'Categoria', width: 95, align: 'left' },
      { label: 'Metodo', width: 70, align: 'left' },
      { label: 'Ingreso', width: 80, align: 'right' },
      { label: 'Gasto', width: 50, align: 'right' }
    ];

    let currentX = left;
    columns.forEach((column) => {
      column.x = currentX;
      currentX += column.width;
    });

    const fitText = (text, maxWidth) => {
      if (!text) {
        return '';
      }

      document.font('Helvetica').fontSize(10);
      if (document.widthOfString(text) <= maxWidth) {
        return text;
      }

      let shortened = text;
      while (shortened.length && document.widthOfString(`${shortened}...`) > maxWidth) {
        shortened = shortened.slice(0, -1);
      }

      return `${shortened}...`;
    };

    const drawHeader = () => {
      const y = document.y + 4;

      document.save();
      document.lineWidth(0.5)
        .fillColor('#F3F4F6')
        .strokeColor('#E5E7EB')
        .roundedRect(left, y, tableWidth, headerHeight, 6)
        .fillAndStroke();

      document.fillColor('#111827').font('Helvetica-Bold').fontSize(11);
      columns.forEach((column) => {
        document.text(column.label, column.x + 6, y + 6, {
          width: column.width - 12,
          align: column.align
        });
      });

      document.strokeColor('#E5E7EB');
      columns.slice(1).forEach((column) => {
        document.moveTo(column.x, y).lineTo(column.x, y + headerHeight).stroke();
      });

      document.restore();
      document.y = y + headerHeight;
    };

    const drawRow = (transaction) => {
      const y = document.y;
      const isIncome = transaction.category?.tipo === 'ingreso';

      document.save();
      document.strokeColor('#F1F5F9').lineWidth(0.5);
      document.moveTo(left, y + rowHeight).lineTo(left + tableWidth, y + rowHeight).stroke();
      document.restore();

      const row = [
        String(transaction.fecha).slice(0, 10),
        fitText(transaction.descripcion || '', columns[1].width - 12),
        fitText(transaction.category?.nombre || '', columns[2].width - 12),
        fitText(transaction.paymentMethod?.nombre || '', columns[3].width - 12),
        isIncome ? Number(transaction.monto).toFixed(2) : '',
        !isIncome ? Number(transaction.monto).toFixed(2) : ''
      ];

      document.font('Helvetica').fontSize(10).fillColor('#111827');
      row.forEach((value, index) => {
        const column = columns[index];
        document.text(value, column.x + 6, y + 4, {
          width: column.width - 12,
          align: column.align
        });
      });

      document.y = y + rowHeight;
    };

    drawHeader();
    transactions.forEach((transaction) => {
      if (document.y + rowHeight > bottomLimit) {
        document.addPage();
        drawHeader();
      }

      drawRow(transaction);
    });
  }

  drawTotals(document, totals) {
    document.moveDown(0.6);
    document.fontSize(12);
    document.text(`Total ingresos: S/ ${totals.ingresos.toFixed(2)}`, 370, document.y, { width: 200, align: 'right' });
    document.text(`Total gastos: S/ ${totals.gastos.toFixed(2)}`, 370, document.y, { width: 200, align: 'right' });
    document.text(`Saldo (ingresos - gastos): S/ ${totals.saldo.toFixed(2)}`, 370, document.y, { width: 200, align: 'right' });
  }

  async drawCharts(document, analysis) {
    document.addPage();
    document.fontSize(14).text('Panel visual', { align: 'left' });
    document.moveDown(0.5);

    const width = 900;
    const height = 360;
    const maxWidth = Math.min(document.page.width - document.page.margins.left - document.page.margins.right, 520);
    const chart = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });
    const pieChart = new ChartJSNodeCanvas({ width, height, backgroundColour: 'white' });

    const barImage = await chart.renderToBuffer({
      type: 'bar',
      data: {
        labels: analysis.monthly.labels,
        datasets: [
          { label: 'Ingresos', data: analysis.monthly.income, backgroundColor: COLORS.income },
          { label: 'Gastos', data: analysis.monthly.expense, backgroundColor: COLORS.expense }
        ]
      },
      options: {
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } }
      }
    }, 'image/png');

    const pieImage = await pieChart.renderToBuffer({
      type: 'pie',
      data: {
        labels: analysis.categories.labels.length ? analysis.categories.labels : ['Sin datos'],
        datasets: [{
          data: analysis.categories.expense.length ? analysis.categories.expense : [1],
          backgroundColor: COLORS.pie
        }]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    }, 'image/png');

    document.fontSize(12).text('Ingresos vs Gastos por mes', { align: 'left' });
    document.image(barImage, { fit: [maxWidth, (height * maxWidth) / width], align: 'center' });
    document.moveDown(0.6);
    document.fontSize(12).text('Distribucion de gastos por categoria', { align: 'left' });
    document.image(pieImage, { fit: [maxWidth, (height * maxWidth) / width], align: 'center' });
  }
}

module.exports = PdfReportExporter;
