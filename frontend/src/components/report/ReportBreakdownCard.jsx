export default function ReportBreakdownCard({
  title,
  subtitle,
  items,
  emptyLabel,
  tone,
  formatMoney,
  getTypeLabel,
  getTypeTone
}) {
  const topItems = items.slice(0, 6)
  const total = topItems.reduce((sum, item) => sum + Number(item.total || 0), 0)
  const lead = topItems[0]

  return (
    <article className="report-breakdown">
      <div className="report-breakdown__header">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        {lead ? (
          <div className={`report-breakdown__lead report-breakdown__lead--${tone}`}>
            <span>Mayor peso</span>
            <strong>{lead.label}</strong>
            <small>{formatMoney(lead.total)}</small>
          </div>
        ) : null}
      </div>

      {topItems.length === 0 ? (
        <div className="table-state">
          <p>{emptyLabel}</p>
        </div>
      ) : (
        <div className="report-breakdown__list">
          {topItems.map((item) => {
            const share = total > 0 ? (Number(item.total || 0) / total) * 100 : 0

            return (
              <div className="report-breakdown__item" key={item.key || item.label}>
                <div className="report-breakdown__item-top">
                  <div>
                    <strong>{item.label}</strong>
                    {item.type ? (
                      <span className={`type-pill type-pill--${getTypeTone(item.type)}`}>
                        {getTypeLabel(item.type)}
                      </span>
                    ) : null}
                  </div>
                  <span>{formatMoney(item.total)}</span>
                </div>

                <div className="report-breakdown__track">
                  <div
                    className={`report-breakdown__fill report-breakdown__fill--${tone}`}
                    style={{ width: `${Math.max(share, 8)}%` }}
                  />
                </div>

                <div className="report-breakdown__meta">
                  <small>{item.count} movimientos</small>
                  <small>{share.toFixed(0)}% del bloque</small>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}
