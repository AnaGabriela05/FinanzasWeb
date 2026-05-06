function TrendCard({ label, value, help }) {
  return (
    <article className="report-hero__trend">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{help}</p>
    </article>
  )
}

function MiniStat({ label, value, accent, help }) {
  return (
    <article className={`report-hero__mini report-hero__mini--${accent}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      {help ? <small>{help}</small> : null}
    </article>
  )
}

function MonthlyColumns({ rows, formatMoney }) {
  const maxValue = rows.reduce((max, row) => Math.max(max, row.income, row.expense), 0)

  return (
    <article className="report-chart-card report-chart-card--large">
      <div className="report-chart-card__header">
        <div>
          <span className="report-chart-card__eyebrow">Grafico principal</span>
          <h3>Ingresos vs gastos por mes</h3>
        </div>
        <p>Comparacion mensual del flujo de entrada y salida.</p>
      </div>

      {rows.length === 0 ? (
        <div className="table-state">
          <p>No hay suficientes movimientos para construir la serie mensual.</p>
        </div>
      ) : (
        <div className="monthly-columns">
          {rows.map((row) => (
            <div className="monthly-columns__item" key={row.label}>
              <div className="monthly-columns__bars">
                <span
                  className="monthly-columns__bar monthly-columns__bar--income"
                  style={{ height: `${maxValue > 0 ? (row.income / maxValue) * 100 : 0}%` }}
                  title={`Ingresos ${formatMoney(row.income)}`}
                />
                <span
                  className="monthly-columns__bar monthly-columns__bar--expense"
                  style={{ height: `${maxValue > 0 ? (row.expense / maxValue) * 100 : 0}%` }}
                  title={`Gastos ${formatMoney(row.expense)}`}
                />
              </div>
              <div className="monthly-columns__footer">
                <strong>{row.label}</strong>
                <small>{formatMoney(row.income - row.expense)}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function DistributionPanel({ title, subtitle, items, tone, formatMoney }) {
  const topItems = items.slice(0, 5)
  const total = topItems.reduce((sum, item) => sum + Number(item.total || 0), 0)

  return (
    <article className="report-chart-card">
      <div className="report-chart-card__header">
        <div>
          <span className="report-chart-card__eyebrow">Distribucion</span>
          <h3>{title}</h3>
        </div>
        <p>{subtitle}</p>
      </div>

      {topItems.length === 0 ? (
        <div className="table-state">
          <p>No hay datos suficientes para este bloque.</p>
        </div>
      ) : (
        <div className="distribution-panel">
          <div className={`distribution-panel__donut distribution-panel__donut--${tone}`}>
            <div>
              <strong>{topItems.length}</strong>
              <span>grupos</span>
            </div>
          </div>
          <div className="distribution-panel__legend">
            {topItems.map((item) => {
              const share = total > 0 ? (Number(item.total || 0) / total) * 100 : 0
              return (
                <div className="distribution-panel__item" key={item.key || item.label}>
                  <div className="distribution-panel__item-top">
                    <strong>{item.label}</strong>
                    <span>{share.toFixed(0)}%</span>
                  </div>
                  <div className="distribution-panel__track">
                    <span
                      className={`distribution-panel__fill distribution-panel__fill--${tone}`}
                      style={{ width: `${Math.max(share, 8)}%` }}
                    />
                  </div>
                  <small>{formatMoney(item.total)}</small>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </article>
  )
}

export default function ReportVisualPanel({
  trend,
  expensePressure,
  categoryCount,
  paymentMethodCount,
  topExpenseCategory,
  topPaymentMethod,
  monthlyRows,
  expenseCategorySummary,
  paymentMethodSummary,
  formatMoney
}) {
  return (
    <section className="report-hero">
      <div className="report-hero__header">
        <div>
          <span className="report-hero__eyebrow">Cuadro de mando</span>
          <h2>Panel visual del reporte</h2>
          <p>
            Vista ejecutiva del periodo seleccionado con foco en tendencias, volumen y
            distribucion del gasto.
          </p>
        </div>
      </div>

      <div className="report-hero__summary">
        <TrendCard label={trend.label} value={trend.value} help={trend.help} />
        <MiniStat
          label="Presion en gastos"
          value={expensePressure.value}
          accent={expensePressure.accent}
          help={expensePressure.help}
        />
        <MiniStat
          label="Categorias activas"
          value={categoryCount}
          accent="balance"
          help="Categorias con movimiento dentro del reporte."
        />
        <MiniStat
          label="Metodos detectados"
          value={paymentMethodCount}
          accent="income"
          help="Metodos de pago presentes en el conjunto filtrado."
        />
        <MiniStat
          label="Mayor categoria de gasto"
          value={topExpenseCategory?.label || 'Sin datos'}
          accent="expense"
          help={
            topExpenseCategory
              ? `${formatMoney(topExpenseCategory.total)} acumulados`
              : 'No hay gastos suficientes para destacar una categoria.'
          }
        />
        <MiniStat
          label="Metodo mas usado"
          value={topPaymentMethod?.label || 'Sin datos'}
          accent="balance"
          help={
            topPaymentMethod
              ? `${topPaymentMethod.count} movimientos registrados`
              : 'No hay movimientos suficientes para detectar un metodo dominante.'
          }
        />
      </div>

      <div className="report-hero__grid">
        <MonthlyColumns rows={monthlyRows} formatMoney={formatMoney} />
        <DistributionPanel
          title="Gastos por categoria"
          subtitle="Peso relativo de las categorias de gasto."
          items={expenseCategorySummary}
          tone="category"
          formatMoney={formatMoney}
        />
        <DistributionPanel
          title="Uso por metodo de pago"
          subtitle="Volumen movilizado por cada metodo."
          items={paymentMethodSummary}
          tone="payment"
          formatMoney={formatMoney}
        />
      </div>
    </section>
  )
}
