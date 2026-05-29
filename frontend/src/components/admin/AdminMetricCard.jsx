/**
 * Card de KPI para el panel admin.
 * Props: { title, value, delta, deltaUnit, icon, accent }
 *   accent: 'brand' | 'success' | 'warning' | 'danger'
 */
const ACCENT_BORDER = {
  brand:   'border-l-teal-600',
  success: 'border-l-green-600',
  warning: 'border-l-amber-500',
  danger:  'border-l-red-600'
}

export default function AdminMetricCard({
  title,
  value,
  delta,
  deltaUnit = '%',
  icon,
  accent = 'brand',
  hint
}) {
  const deltaNum = typeof delta === 'number' ? delta : null
  const deltaColor = deltaNum === null
    ? 'text-slate-500'
    : deltaNum > 0
      ? 'text-green-600'
      : deltaNum < 0
        ? 'text-red-600'
        : 'text-slate-500'
  const deltaSign = deltaNum !== null && deltaNum > 0 ? '+' : ''

  return (
    <article
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${ACCENT_BORDER[accent] || ACCENT_BORDER.brand} p-4 shadow-sm flex flex-col gap-1`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-500 font-medium">{title}</span>
        {icon ? <span aria-hidden="true" className="text-xl">{icon}</span> : null}
      </div>
      <strong className="text-2xl text-slate-900">{value}</strong>
      {deltaNum !== null ? (
        <span className={`text-xs ${deltaColor}`}>
          {deltaSign}{deltaNum}{deltaUnit} vs mes anterior
        </span>
      ) : hint ? (
        <span className="text-xs text-slate-500">{hint}</span>
      ) : null}
    </article>
  )
}
