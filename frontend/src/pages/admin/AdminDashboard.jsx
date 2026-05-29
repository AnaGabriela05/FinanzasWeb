import { useEffect, useState } from 'react'
import ModuleHeader from '../../components/layout/ModuleHeader'
import AdminMetricCard from '../../components/admin/AdminMetricCard'
import AdminTable from '../../components/admin/AdminTable'
import Skeleton from '../../components/Skeleton'
import { AdminService } from '../../services/adminService'
import { useToast } from '../../components/Toast'

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function BarChart({ data, height = 160 }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-slate-500">Sin datos para graficar.</p>
  }
  const max = Math.max(...data.map((d) => d.cantidad), 1)
  return (
    <div className="flex items-end gap-3" style={{ height }}>
      {data.map((d) => {
        const h = Math.round((d.cantidad / max) * (height - 30))
        return (
          <div key={`${d.year}-${d.mes}`} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <span className="text-xs font-semibold text-slate-700">{d.cantidad}</span>
            <div
              className="w-full rounded-t-md bg-teal-600"
              style={{ height: h, minHeight: 2 }}
              title={`${MONTH_LABELS[d.mes - 1]} ${d.year}: ${d.cantidad}`}
            />
            <span className="text-[10px] text-slate-500">{MONTH_LABELS[d.mes - 1]}</span>
          </div>
        )
      })}
    </div>
  )
}

function DonutChart({ segments, size = 180 }) {
  const total = segments.reduce((s, x) => s + (x.value || 0), 0) || 1
  const radius = size / 2 - 12
  const cx = size / 2
  const cy = size / 2
  const strokeWidth = 20
  let offset = 0
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const fraction = (seg.value || 0) / total
          const length = circumference * fraction
          const dasharray = `${length} ${circumference - length}`
          const el = (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={dasharray}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${cx} ${cy})`}
            />
          )
          offset += length
          return el
        })}
        <text x={cx} y={cy + 5} textAnchor="middle" className="fill-slate-900" style={{ fontSize: 18, fontWeight: 700 }}>
          {total}
        </text>
      </svg>
      <ul className="flex flex-col gap-1 text-sm">
        {segments.map((seg, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: seg.color }} aria-hidden="true" />
            <span className="text-slate-700">{seg.label}</span>
            <strong className="text-slate-900">{seg.value}</strong>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function AdminDashboard() {
  const toast = useToast()
  const [metrics, setMetrics] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([AdminService.getMetrics(), AdminService.getRegistrationsChart(6)])
      .then(([m, r]) => {
        if (cancelled) return
        setMetrics(m)
        setRegistrations(Array.isArray(r) ? r : [])
      })
      .catch((err) => { if (!cancelled) toast.error(err.message || 'No se pudo cargar el panel') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [toast])

  const saludSegments = metrics ? [
    { label: 'Verde',    value: metrics.saludFinanciera.verde,    color: '#16A34A' },
    { label: 'Amarillo', value: metrics.saludFinanciera.amarillo, color: '#F59E0B' },
    { label: 'Rojo',     value: metrics.saludFinanciera.rojo,     color: '#DC2626' },
    { label: 'Neutral',  value: metrics.saludFinanciera.neutral,  color: '#94A3B8' }
  ] : []

  return (
    <>
      <ModuleHeader
        title="Panel de control"
        subtitle="Resumen del sistema (datos agregados, sin información personal)"
        badges={metrics ? [
          { label: 'Usuarios', value: String(metrics.users.total), variant: 'brand' },
          { label: 'Globales activas', value: String(metrics.categories.globalesActivas), variant: 'info' }
        ] : []}
      />

      {loading || !metrics ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={100} radius={12} />)}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <AdminMetricCard
              title="Usuarios totales"
              value={metrics.users.total}
              hint={`${metrics.users.activos} activos · ${metrics.users.bloqueados} bloqueados`}
              icon="👥"
              accent="brand"
            />
            <AdminMetricCard
              title="Transacciones del mes"
              value={metrics.transactions.totalEsteMes}
              delta={metrics.transactions.deltaPct}
              icon="💸"
              accent="success"
            />
            <AdminMetricCard
              title="Categorías globales"
              value={metrics.categories.globalesActivas}
              hint={`Promedio personales: ${metrics.categories.personalesPromedio}`}
              icon="🏷️"
              accent="brand"
            />
            <AdminMetricCard
              title="Exportaciones del mes"
              value={metrics.exports.totalEsteMes}
              hint={`PDF ${metrics.exports.porFormato.pdf} · XLSX ${metrics.exports.porFormato.xlsx}`}
              icon="📥"
              accent="warning"
            />
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <article className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <header className="mb-3">
                <h2 className="text-base font-semibold text-slate-900 m-0">Registros por mes</h2>
                <p className="text-xs text-slate-500 m-0">Usuarios nuevos en los últimos 6 meses.</p>
              </header>
              <BarChart data={registrations} />
            </article>
            <article className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <header className="mb-3">
                <h2 className="text-base font-semibold text-slate-900 m-0">Salud financiera</h2>
                <p className="text-xs text-slate-500 m-0">Distribución agregada anónima.</p>
              </header>
              <DonutChart segments={saludSegments} />
            </article>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <article className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <header className="mb-3">
                <h2 className="text-base font-semibold text-slate-900 m-0">Top categorías globales</h2>
                <p className="text-xs text-slate-500 m-0">Por cantidad de usuarios distintos que las usan.</p>
              </header>
              {metrics.topCategoriasGlobales.length === 0 ? (
                <p className="text-sm text-slate-500">Sin datos todavía.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {metrics.topCategoriasGlobales.map((c) => (
                    <li key={c.nombre} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                      <span className="text-sm text-slate-800">{c.nombre}</span>
                      <strong className="text-sm text-slate-900">{c.usuariosQueLaUsan} usuarios</strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>
            <article className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <header className="mb-3">
                <h2 className="text-base font-semibold text-slate-900 m-0">Top métodos de pago</h2>
                <p className="text-xs text-slate-500 m-0">Por cantidad de usuarios activos que los usan.</p>
              </header>
              {metrics.topMetodosPago.length === 0 ? (
                <p className="text-sm text-slate-500">Sin datos todavía.</p>
              ) : (
                <ul className="flex flex-col gap-2">
                  {metrics.topMetodosPago.map((m) => (
                    <li key={m.nombre} className="flex items-center justify-between border-b border-slate-100 pb-2 last:border-0">
                      <span className="text-sm text-slate-800">{m.nombre}</span>
                      <strong className="text-sm text-slate-900">{m.usuariosActivos} usuarios</strong>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </section>
        </>
      )}
    </>
  )
}
