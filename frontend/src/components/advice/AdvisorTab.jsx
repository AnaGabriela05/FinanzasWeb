import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdviceService } from '../../services/adviceService'
import AdviceCard from './AdviceCard'
import Skeleton from '../Skeleton'
import { useToast } from '../Toast'

const FILTER_CHIPS = [
  { value: '',            label: 'Todos' },
  { value: 'ahorro',      label: 'Ahorro' },
  { value: 'presupuesto', label: 'Presupuesto' },
  { value: 'gasto',       label: 'Gasto' },
  { value: 'deuda',       label: 'Deuda' }
]

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const TIPO_LABEL = {
  ahorro: 'Ahorro',
  presupuesto: 'Presupuesto',
  gasto: 'Gasto',
  deuda: 'Deuda'
}

function formatMonthLabel(date) {
  const d = new Date(date)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`
}

function groupByMonth(items) {
  const groups = new Map()
  items.forEach((item) => {
    const key = String(item.fechaGeneracion).slice(0, 7) // YYYY-MM
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  })
  return Array.from(groups.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([key, list]) => ({ key, label: formatMonthLabel(`${key}-01`), items: list }))
}

function formatDateShort(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
}

const PAGE_SIZE = 30

export default function AdvisorTab() {
  const toast = useToast()
  const [current, setCurrent] = useState([])
  const [loadingCurrent, setLoadingCurrent] = useState(true)
  const [errorCurrent, setErrorCurrent] = useState('')

  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const [history, setHistory] = useState([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyOffset, setHistoryOffset] = useState(0)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [historyTipo, setHistoryTipo] = useState('')

  const [regenerating, setRegenerating] = useState(false)
  const [howOpen, setHowOpen] = useState(false)

  const loadCurrent = useCallback(() => {
    setLoadingCurrent(true)
    setErrorCurrent('')
    return AdviceService.getCurrentAdvice()
      .then((data) => {
        const list = Array.isArray(data?.advices) ? data.advices : (Array.isArray(data) ? data : [])
        setCurrent(list)
      })
      .catch((err) => setErrorCurrent(err.message || 'No se pudieron cargar los consejos'))
      .finally(() => setLoadingCurrent(false))
  }, [])

  const loadStats = useCallback(() => {
    setLoadingStats(true)
    return AdviceService.getAdviceStats()
      .then((data) => setStats(data))
      .catch(() => {
        // Stats no es bloqueante: si falla, no rompemos la pestana.
      })
      .finally(() => setLoadingStats(false))
  }, [])

  const loadHistory = useCallback((opts = {}) => {
    const offset = opts.append ? historyOffset : 0
    setHistoryLoading(true)
    return AdviceService.getAdviceHistory({
      limit: PAGE_SIZE,
      offset,
      tipo: historyTipo || undefined
    })
      .then((data) => {
        const items = Array.isArray(data?.items) ? data.items : []
        if (opts.append) {
          setHistory((prev) => [...prev, ...items])
          setHistoryOffset(offset + items.length)
        } else {
          setHistory(items)
          setHistoryOffset(items.length)
        }
        setHistoryTotal(Number(data?.total) || 0)
      })
      .catch((err) => toast.error(err.message || 'No se pudo cargar el historial'))
      .finally(() => setHistoryLoading(false))
  }, [historyOffset, historyTipo, toast])

  useEffect(() => {
    loadCurrent()
    loadStats()
  }, [loadCurrent, loadStats])

  useEffect(() => {
    // Reset al cambiar filtro de tipo.
    setHistoryOffset(0)
    loadHistory({ append: false })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyTipo])

  async function handleRegenerate() {
    if (current.length > 0) {
      const ok = window.confirm('Tus consejos actuales aun estan vigentes (menos de 7 dias). ¿Deseas reemplazarlos por nuevos?')
      if (!ok) return
    }

    setRegenerating(true)
    try {
      const data = await AdviceService.regenerateAdvice()
      const list = Array.isArray(data?.advices) ? data.advices : []
      setCurrent(list)
      await Promise.all([loadStats(), loadHistory({ append: false })])
      toast.success('Consejos regenerados correctamente')
    } catch (err) {
      toast.error(err.message || 'No se pudo regenerar')
    } finally {
      setRegenerating(false)
    }
  }

  const grouped = useMemo(() => groupByMonth(history), [history])
  const hasMore = history.length < historyTotal

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* a) Header */}
      <header
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>Tu asesor financiero personal</h2>
          <p style={{ margin: '6px 0 0', color: '#475569' }}>
            Consejos personalizados basados en tu actividad financiera.
          </p>
        </div>
        <button
          type="button"
          className="button-primary"
          onClick={handleRegenerate}
          disabled={regenerating}
        >
          {regenerating ? 'Generando...' : '🔄 Generar nuevos consejos'}
        </button>
      </header>

      {/* b) KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 12
        }}
      >
        <KpiCard
          label="Total recibidos"
          value={loadingStats ? '—' : (stats?.total ?? 0)}
        />
        <KpiCard
          label="Último consejo"
          value={loadingStats ? '—' : formatDateShort(stats?.fechaUltimo)}
        />
        <KpiCard
          label="Tipo más frecuente"
          value={loadingStats ? '—' : (TIPO_LABEL[stats?.tipoMasFrecuente] || '—')}
        />
        <KpiCard
          label="Próxima regeneración"
          value={loadingStats ? '—' : formatDateShort(stats?.proximaRegeneracion)}
        />
      </div>

      {/* c) Consejos actuales */}
      <div>
        <h3 style={{ margin: '0 0 12px' }}>Consejos actuales</h3>

        {loadingCurrent ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12
            }}
          >
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} height={110} radius={10} />
            ))}
          </div>
        ) : errorCurrent ? (
          <p style={{ color: '#B91C1C' }}>{errorCurrent}</p>
        ) : current.length === 0 ? (
          <div
            style={{
              border: '1px dashed #CBD5E1',
              borderRadius: 12,
              padding: 24,
              textAlign: 'center',
              color: '#475569'
            }}
          >
            <p style={{ margin: '0 0 12px' }}>Aún no tienes consejos generados.</p>
            <button type="button" className="button-primary" onClick={handleRegenerate}>
              Generar mis primeros consejos
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: 12
            }}
          >
            {current.map((advice) => (
              <AdviceCard
                key={advice.id || `${advice.tipo}-${advice.contenido?.slice(0, 24)}`}
                tipo={advice.tipo}
                contenido={advice.contenido}
                fechaGeneracion={advice.fechaGeneracion}
                variant="expanded"
              />
            ))}
          </div>
        )}
      </div>

      {/* d) Historial */}
      <div>
        <header
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            marginBottom: 12
          }}
        >
          <h3 style={{ margin: 0 }}>Historial completo</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {FILTER_CHIPS.map((chip) => {
              const active = historyTipo === chip.value
              return (
                <button
                  type="button"
                  key={chip.value || 'all'}
                  onClick={() => setHistoryTipo(chip.value)}
                  style={{
                    border: `1px solid ${active ? '#0F766E' : '#CBD5E1'}`,
                    background: active ? '#0F766E' : '#FFFFFF',
                    color: active ? '#FFFFFF' : '#334155',
                    borderRadius: 999,
                    padding: '4px 12px',
                    fontSize: 13,
                    cursor: 'pointer'
                  }}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
        </header>

        {historyLoading && history.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height={70} radius={10} />
            ))}
          </div>
        ) : history.length === 0 ? (
          <p style={{ color: '#64748B' }}>
            No hay consejos en el historial para este filtro.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {grouped.map((group) => (
              <section key={group.key}>
                <h4
                  style={{
                    margin: '0 0 8px',
                    fontSize: 14,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#64748B'
                  }}
                >
                  {group.label}
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {group.items.map((advice) => (
                    <AdviceCard
                      key={advice.id || `${advice.tipo}-${advice.fechaGeneracion}`}
                      tipo={advice.tipo}
                      contenido={advice.contenido}
                      fechaGeneracion={advice.fechaGeneracion}
                      variant="compact"
                    />
                  ))}
                </div>
              </section>
            ))}

            {hasMore ? (
              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <button
                  type="button"
                  className="button-secondary"
                  disabled={historyLoading}
                  onClick={() => loadHistory({ append: true })}
                >
                  {historyLoading ? 'Cargando...' : 'Cargar más'}
                </button>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* e) Cómo funciona */}
      <section
        style={{
          border: '1px solid #E2E8F0',
          borderRadius: 12,
          background: '#F8FAFC'
        }}
      >
        <button
          type="button"
          onClick={() => setHowOpen((v) => !v)}
          aria-expanded={howOpen}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '14px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
            fontWeight: 600,
            color: '#0F172A',
            fontSize: 15
          }}
        >
          ℹ️ Cómo funciona tu asesor IA
          <span aria-hidden="true">{howOpen ? '−' : '+'}</span>
        </button>
        {howOpen ? (
          <ul
            style={{
              margin: 0,
              padding: '0 16px 16px 36px',
              color: '#334155',
              lineHeight: 1.6
            }}
          >
            <li>Tu asesor analiza tu actividad financiera de los últimos 90 días.</li>
            <li>Los consejos se actualizan automáticamente cada 7 días.</li>
            <li>Puedes forzar una regeneración cuando quieras con el botón superior.</li>
            <li>Tus datos no se comparten: el análisis es individual y privado.</li>
          </ul>
        ) : null}
      </section>
    </section>
  )
}

function KpiCard({ label, value }) {
  return (
    <article
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 12,
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 6
      }}
    >
      <span
        style={{
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#64748B'
        }}
      >
        {label}
      </span>
      <strong style={{ fontSize: 20, color: '#0F172A' }}>{value}</strong>
    </article>
  )
}
