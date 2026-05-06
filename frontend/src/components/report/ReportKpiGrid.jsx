function KpiCard({ label, value, caption, tone, trend }) {
  return (
    <article className={`report-kpi-card report-kpi-card--${tone}`}>
      <span className="report-kpi-card__label">{label}</span>
      <strong>{value}</strong>
      <p>{caption}</p>
      {trend ? <small>{trend}</small> : null}
    </article>
  )
}

export default function ReportKpiGrid({ summary, transactionCount, categoryCount, paymentMethodCount }) {
  return (
    <section className="report-kpi-grid">
      <KpiCard
        label="Ingresos"
        value={summary.ingresos}
        caption="Entradas registradas en el rango analizado."
        tone="income"
      />
      <KpiCard
        label="Gastos"
        value={summary.gastos}
        caption="Salidas asociadas a categorias de gasto."
        tone="expense"
      />
      <KpiCard
        label="Saldo"
        value={summary.saldo}
        caption="Resultado neto del periodo filtrado."
        tone="balance"
      />
      <KpiCard
        label="Transacciones"
        value={transactionCount}
        caption="Movimientos incluidos en el reporte."
        tone="neutral"
      />
      <KpiCard
        label="Categorias con movimiento"
        value={categoryCount}
        caption="Categorias con actividad dentro del corte."
        tone="neutral"
      />
      <KpiCard
        label="Metodos usados"
        value={paymentMethodCount}
        caption="Metodos detectados en el conjunto filtrado."
        tone="neutral"
      />
    </section>
  )
}
