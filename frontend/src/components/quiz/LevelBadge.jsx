export default function LevelBadge({
  nivel,
  siguienteNivel,
  totalPoints,
  variant = 'default'
}) {
  if (!nivel) return null
  const compact = variant === 'compact'
  const progress = Math.min(1, Math.max(0, siguienteNivel?.progreso ?? nivel?.progresoAlSiguiente ?? 1))
  const pctLabel = `${Math.round(progress * 100)}%`

  const tooltip = siguienteNivel
    ? `${totalPoints ?? 0} / ${siguienteNivel.minPoints ?? '∞'} puntos hasta ${siguienteNivel.nombre}`
    : 'Nivel máximo alcanzado'

  return (
    <div
      className={compact
        ? 'inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 shadow-sm'
        : 'flex flex-col gap-2 rounded-xl bg-white border border-slate-200 p-4 shadow-sm'}
      title={tooltip}
    >
      <div className="flex items-center gap-3">
        <span
          className={compact ? 'text-lg' : 'text-3xl'}
          aria-hidden="true"
        >
          {nivel.icono}
        </span>
        <div className="flex flex-col">
          <span
            className={compact ? 'text-sm font-semibold' : 'text-base font-semibold'}
            style={{ color: nivel.color }}
          >
            {nivel.nombre}
          </span>
          {!compact ? (
            <span className="text-xs text-slate-500">
              {totalPoints ?? 0} puntos acumulados
            </span>
          ) : null}
        </div>
      </div>

      {!compact ? (
        <div className="w-full">
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: pctLabel, background: nivel.color }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {siguienteNivel
              ? `Faltan ${siguienteNivel.puntosFaltantes} pts para ${siguienteNivel.icono} ${siguienteNivel.nombre}`
              : 'Nivel máximo alcanzado 🎉'}
          </p>
        </div>
      ) : null}
    </div>
  )
}
