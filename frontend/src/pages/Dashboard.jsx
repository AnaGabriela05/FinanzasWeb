import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ModuleHeader from '../components/layout/ModuleHeader'
import { Auth } from '../lib/auth'
import { ReportService } from '../services/reportService'
import { MetricCardSkeleton, HealthCardSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { formatPEN } from '../lib/currency'
import AdviceModal from '../components/advice/AdviceModal'
import LevelBadge from '../components/quiz/LevelBadge'
import { QuizService } from '../services/quizService'
import { usePreviewMode } from '../hooks/usePreviewMode'

const ADVICE_CTA_BY_LEVEL = {
  danger:  '💡 Ver consejos personalizados',
  warning: '💡 Ver consejos personalizados',
  success: '💡 Consejos para mantener tu salud',
  neutral: '💡 Cómo empezar a controlar tus finanzas'
}

const formatMoney = formatPEN

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }
  return `${(Number(value) * 100).toFixed(0)}%`
}

export default function Dashboard() {
  const user = Auth.user()
  const navigate = useNavigate()
  const toast = useToast()
  const isPreview = usePreviewMode()
  const [overview, setOverview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [adviceOpen, setAdviceOpen] = useState(false)
  const [quizProgress, setQuizProgress] = useState(null)

  useEffect(() => {
    if (isPreview) return undefined
    let cancelled = false
    QuizService.getProgress()
      .then((data) => { if (!cancelled) setQuizProgress(data) })
      .catch(() => { /* opcional, no bloquea el dashboard */ })
    return () => { cancelled = true }
  }, [isPreview])

  useEffect(() => {
    if (isPreview) {
      setLoading(false)
      setOverview(null)
      return undefined
    }

    let cancelled = false

    setLoading(true)
    setError('')

    ReportService.getOverview()
      .then((data) => {
        if (!cancelled) setOverview(data)
      })
      .catch((err) => {
        if (cancelled) return
        const message = err.message || 'No se pudo cargar el dashboard'
        setError(message)
        toast.error(message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [toast, isPreview])

  return (
    <Layout>
      <ModuleHeader
        title={`Hola, ${user.nombre || user.correo || 'usuario'}`}
        subtitle={`Resumen de tus finanzas en los últimos ${overview?.analysisRange?.days ?? 90} días`}
        primaryAction={{
          label: 'Nueva transacción',
          icon: '+',
          disabled: isPreview,
          onClick: () => navigate(isPreview ? '/admin/preview/transactions' : '/transactions?nueva=1'),
          title: isPreview ? 'No disponible en modo vista previa' : undefined
        }}
      />

      {isPreview ? (
        <section className="bg-white border border-slate-200 rounded-xl p-6 text-center mb-4">
          <p className="text-slate-600 m-0">
            Estado inicial vacío. Así verá esta pantalla un usuario recién registrado.
          </p>
        </section>
      ) : null}

      {loading ? (
        <>
          <section className="metrics-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <MetricCardSkeleton key={index} />
            ))}
          </section>
          <HealthCardSkeleton />
        </>
      ) : null}

      {!loading && error ? (
        <section className="dashboard-state dashboard-state--error">
          <h2>No se pudo cargar el dashboard</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {!loading && !error && overview ? (
        <>
          <section className="metrics-grid">
            <article className="metric-card metric-card--income">
              <span className="metric-card__label">Ingresos</span>
              <strong>{formatMoney(overview.summary.ingresos)}</strong>
              <p>Total del periodo analizado.</p>
            </article>

            <article className="metric-card metric-card--expense">
              <span className="metric-card__label">Gastos</span>
              <strong>{formatMoney(overview.summary.gastos)}</strong>
              <p>Suma de movimientos en categorias de gasto.</p>
            </article>

            <article className="metric-card metric-card--balance">
              <span className="metric-card__label">Saldo</span>
              <strong>{formatMoney(overview.summary.saldo)}</strong>
              <p>Diferencia entre ingresos y gastos del periodo.</p>
            </article>

            <article className="metric-card">
              <span className="metric-card__label">Categorias</span>
              <strong>{overview.summary.categoriesCount}</strong>
              <p>Categorias visibles para tu sesion.</p>
            </article>

            <article className="metric-card">
              <span className="metric-card__label">Metodos de pago</span>
              <strong>{overview.summary.paymentMethodsCount}</strong>
              <p>Metodos activos asociados a tu cuenta.</p>
            </article>

            <article className="metric-card">
              <span className="metric-card__label">Movimientos analizados</span>
              <strong>{overview.transactionCount}</strong>
              <p>Transacciones consideradas en el periodo.</p>
            </article>
          </section>

          <section className={`health-card health-card--${overview.health.level.key}`}>
            <div className="health-card__main">
              <div>
                <span className="health-card__eyebrow">Salud financiera</span>
                <h2>{overview.health.level.title}</h2>
                <p>{overview.health.level.description}</p>
              </div>

              <div className="health-score">
                <span className="health-score__light" aria-hidden="true" />
                <div>
                  <strong>{overview.health.level.label}</strong>
                  <span>
                    {overview.health.score !== null && overview.health.score !== undefined
                      ? `${overview.health.score}/100`
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="health-meter">
              <div
                className="health-meter__fill"
                style={{ width: `${overview.health.score ?? 0}%` }}
              />
            </div>

            <div className="health-metrics">
              <article>
                <span>Tasa de ahorro</span>
                <strong>{formatPercent(overview.health.metrics.savingRate)}</strong>
              </article>
              <article>
                <span>Gastos / ingresos</span>
                <strong>
                  {overview.health.metrics.expenseRatio === null
                    ? 'Sin ingresos'
                    : formatPercent(overview.health.metrics.expenseRatio)}
                </strong>
              </article>
              <article>
                <span>Desfase vs presupuesto</span>
                <strong>
                  {overview.health.metrics.budgetOvershootRel === null
                    ? '— sin presupuestos'
                    : `+${formatPercent(overview.health.metrics.budgetOvershootRel)}`}
                </strong>
              </article>
              <article>
                <span>Carga de deuda</span>
                <strong>
                  {overview.health.metrics.debtLoad === null
                    ? 'Sin ingresos'
                    : formatPercent(overview.health.metrics.debtLoad)}
                </strong>
              </article>
            </div>

            <p className="health-note">
              Analisis de los ultimos {overview.analysisRange.days} dias
              ({overview.analysisRange.from} a {overview.analysisRange.to}).
            </p>

            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                className="button-secondary"
                onClick={() => setAdviceOpen(true)}
              >
                {ADVICE_CTA_BY_LEVEL[overview.health.level.key] || ADVICE_CTA_BY_LEVEL.neutral}
              </button>
            </div>
          </section>
        </>
      ) : null}

      {!loading && !error && quizProgress?.nivel ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
          <div className="flex-1 min-w-0">
            <span className="text-xs uppercase tracking-wide text-slate-500 font-medium">
              Mi progreso de aprendizaje
            </span>
            <div className="mt-2">
              <LevelBadge
                nivel={quizProgress.nivel}
                siguienteNivel={quizProgress.siguienteNivel}
                totalPoints={quizProgress.totalPoints || 0}
              />
            </div>
          </div>
          <button
            type="button"
            className="button-primary self-start md:self-center"
            onClick={() => navigate('/learning?tab=progress')}
          >
            Ver mi progreso →
          </button>
        </section>
      ) : null}

      <AdviceModal open={adviceOpen} onClose={() => setAdviceOpen(false)} />
    </Layout>
  )
}
