const ExcelJS = require('exceljs');

class ExcelReportExporter {
  async exportTransactions({ transactions }) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Transacciones');

    worksheet.columns = [
      { header: 'Fecha', key: 'fecha', width: 12 },
      { header: 'Descripcion', key: 'descripcion', width: 40 },
      { header: 'Categoria', key: 'categoria', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 10 },
      { header: 'Metodo', key: 'metodo', width: 18 },
      { header: 'Ingreso', key: 'ingreso', width: 12 },
      { header: 'Gasto', key: 'gasto', width: 12 }
    ];

    transactions.forEach((transaction) => {
      const isIncome = transaction.category?.tipo === 'ingreso';

      worksheet.addRow({
        fecha: transaction.fecha,
        descripcion: transaction.descripcion || '',
        categoria: transaction.category?.nombre || '',
        tipo: transaction.category?.tipo || '',
        metodo: transaction.paymentMethod?.nombre || '',
        ingreso: isIncome ? Number(transaction.monto) : '',
        gasto: !isIncome ? Number(transaction.monto) : ''
      });
    });

    return workbook.xlsx.writeBuffer();
  }
}

module.exports = ExcelReportExporter;
