class FinancialHealthAnalyzer {
  analyzeTransactions(transactions) {
    let ingresos = 0;
    let gastos = 0;

    const incByMonth = new Map();
    const expByMonth = new Map();
    const expByCategory = new Map();

    for (const transaction of transactions) {
      const tipo = transaction.category?.tipo || '';
      const monto = Number(transaction.monto) || 0;
      const ym = String(transaction.fecha).slice(0, 7);

      if (tipo === 'ingreso') {
        ingresos += monto;
        incByMonth.set(ym, (incByMonth.get(ym) || 0) + monto);
      } else if (tipo === 'gasto') {
        gastos += monto;
        expByMonth.set(ym, (expByMonth.get(ym) || 0) + monto);
        const categoryName = transaction.category?.nombre || '-';
        expByCategory.set(categoryName, (expByCategory.get(categoryName) || 0) + monto);
      }
    }

    const labels = Array.from(new Set([...incByMonth.keys(), ...expByMonth.keys()])).sort();

    return {
      totals: {
        ingresos,
        gastos,
        saldo: ingresos - gastos
      },
      monthly: {
        labels,
        income: labels.map((label) => incByMonth.get(label) || 0),
        expense: labels.map((label) => expByMonth.get(label) || 0)
      },
      categories: {
        labels: Array.from(expByCategory.keys()),
        expense: Array.from(expByCategory.values())
      },
      count: transactions.length
    };
  }
}

module.exports = FinancialHealthAnalyzer;
