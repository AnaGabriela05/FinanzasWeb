import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { Auth } from '../lib/auth'
import { API } from '../lib/api'

function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

function formatPercent(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return '—'
  }

  return `${(Number(value) * 100).toFixed(0)}%`
}

function daysAgo(days = 90) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function isDebtCategory(name = '') {
  return /deuda|cr[eé]dito|tarjeta|pr[eé]stamo|cuota/i.test(name)
}

function scoreSavingRate(rate) {
  if (rate > 0.2) return 100
  if (rate >= 0.1) return 70
  if (rate >= 0) return 40
  return 10
}

function scoreExpenseRatio(rate) {
  if (rate < 0.8) return 100
  if (rate <= 0.95) return 70
  return 40
}

function scoreBudgetHit(rate) {
  if (rate <= 0) return 100
  if (rate <= 0.1) return 70
  return 40
}

function scoreDebtLoad(rate) {
  if (rate < 0.1) return 100
  if (rate <= 0.25) return 70
  return 40
}

function getHealthLevel(score, saldo, gastos, ingresos) {
  if (gastos > ingresos || saldo < 0 || score < 50) {
    return {
      key: 'danger',
      label: 'Rojo',
      title: 'Atencion inmediata',
      description: 'Tus gastos estan superando lo saludable para tu nivel de ingresos.'
    }
  }

  if (score < 75 || gastos >= ingresos * 0.9) {
    return {
      key: 'warning',
      label: 'Amarillo',
      title: 'Zona de cuidado',
      description: 'Tus gastos estan cerca de tus ingresos. Conviene vigilar el margen.'
    }
  }

  return {
    key: 'success',
    label: 'Verde',
    title: 'Buen equilibrio',
    description: 'Tus ingresos sostienen bien tus gastos y mantienes saldo positivo.'
  }
}

function buildFinancialHealth(transactions, budgets, summary) {
  const ingresos = Number(summary.ingresos || 0)
  const gastos = Number(summary.gastos || 0)
  const saldo = Number(summary.saldo || 0)

  const gastosDeuda = transactions
    .filter((tx) => tx.category?.tipo === 'gasto' && isDebtCategory(tx.category?.nombre || ''))
    .reduce((total, tx) => total + Number(tx.monto || 0), 0)

  const savingRate = ingresos > 0 ? saldo / ingresos : 0
  const expenseRatio = ingresos > 0 ? gastos / ingresos : 1
  const debtLoad = ingresos > 0 ? gastosDeuda / ingresos : 0

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  const activeBudgets = budgets.filter(
    (budget) => Number(budget.mes) === currentMonth && Number(budget.anio) === currentYear
  )

  let budgetOvershootRel = null

  if (activeBudgets.length > 0) {
    let sumBudget = 0
    let sumSpent = 0

    for (const budget of activeBudgets) {
      sumBudget += Number(budget.montoMensual || 0)
      const categoryId = budget.category?.id ?? budget.categoryId
      const spentByCategory = transactions
        .filter((tx) => tx.category?.id === categoryId && tx.category?.tipo === 'gasto')
        .reduce((total, tx) => total + Number(tx.monto || 0), 0)

      sumSpent += spentByCategory
    }

    const extra = Math.max(0, sumSpent - sumBudget)
    budgetOvershootRel = sumBudget > 0 ? extra / sumBudget : 0
  }

  const score1 = scoreSavingRate(savingRate)
  const score2 = scoreExpenseRatio(expenseRatio)
  const score3 = budgetOvershootRel === null ? 70 : scoreBudgetHit(budgetOvershootRel)
  const score4 = scoreDebtLoad(debtLoad)

  const score = Math.round(score1 * 0.4 + score2 * 0.3 + score3 * 0.2 + score4 * 0.1)
  const level = getHealthLevel(score, saldo, gastos, ingresos)

  return {
    score,
    level,
    metrics: {
      savingRate,
      expenseRatio,
      budgetOvershootRel,
      debtLoad
    }
  }
}

export default function Dashboard() {
  const user = Auth.user()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setLoading(true)
      setError('')

      try {
        const from = daysAgo(90)
        const to = new Date().toISOString().slice(0, 10)

        const [insights, categories, paymentMethods, transactions90, budgets] =
          await Promise.all([
            API.get('/api/reports/insights'),
            API.get('/api/categories'),
            API.get('/api/payment-methods'),
            API.get(`/api/transactions?from=${from}&to=${to}`),
            API.get('/api/budgets')
          ])

        const summary = {
          ingresos: Number(insights?.totals?.ingresos || 0),
          gastos: Number(insights?.totals?.gastos || 0),
          saldo: Number(insights?.totals?.saldo || 0),
          categoriesCount: Array.isArray(categories) ? categories.length : 0,
          paymentMethodsCount: Array.isArray(paymentMethods) ? paymentMethods.length : 0
        }

        const health = buildFinancialHealth(transactions90, budgets, summary)

        if (!cancelled) {
          setDashboard({
            summary,
            health,
            transactionCount: Number(insights?.count || 0),
            analysisRange: { from, to }
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudo cargar el dashboard')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Layout>
      <section className="dashboard-header">
        <div>
          <span className="dashboard-header__eyebrow">Resumen general</span>
          <h1>Hola, {user.nombre || user.correo || 'usuario'}.</h1>
          <p>
            Este panel usa la API real del backend para resumir tu actividad
            financiera y mostrar tu estado actual.
          </p>
        </div>
      </section>

      {loading ? (
        <section className="dashboard-state">
          <div className="dashboard-loader" />
          <p>Cargando datos del dashboard...</p>
        </section>
      ) : null}

      {!loading && error ? (
        <section className="dashboard-state dashboard-state--error">
          <h2>No se pudo cargar el dashboard</h2>
          <p>{error}</p>
        </section>
      ) : null}

      {!loading && !error && dashboard ? (
        <>
          <section className="metrics-grid">
            <article className="metric-card metric-card--income">
              <span className="metric-card__label">Ingresos</span>
              <strong>{formatMoney(dashboard.summary.ingresos)}</strong>
              <p>Total calculado con datos reales del reporte.</p>
            </article>

            <article className="metric-card metric-card--expense">
              <span className="metric-card__label">Gastos</span>
              <strong>{formatMoney(dashboard.summary.gastos)}</strong>
              <p>Suma de movimientos asociados a categorias de gasto.</p>
            </article>

            <article className="metric-card metric-card--balance">
              <span className="metric-card__label">Saldo</span>
              <strong>{formatMoney(dashboard.summary.saldo)}</strong>
              <p>Diferencia entre ingresos y gastos actuales.</p>
            </article>

            <article className="metric-card">
              <span className="metric-card__label">Categorias</span>
              <strong>{dashboard.summary.categoriesCount}</strong>
              <p>Categorias visibles obtenidas desde la API real.</p>
            </article>

            <article className="metric-card">
              <span className="metric-card__label">Metodos de pago</span>
              <strong>{dashboard.summary.paymentMethodsCount}</strong>
              <p>Metodos activos listados para tu cuenta.</p>
            </article>

            <article className="metric-card">
              <span className="metric-card__label">Movimientos analizados</span>
              <strong>{dashboard.transactionCount}</strong>
              <p>Transacciones consideradas por el resumen del dashboard.</p>
            </article>
          </section>

          <section className={`health-card health-card--${dashboard.health.level.key}`}>
            <div className="health-card__main">
              <div>
                <span className="health-card__eyebrow">Salud financiera</span>
                <h2>{dashboard.health.level.title}</h2>
                <p>{dashboard.health.level.description}</p>
              </div>

              <div className="health-score">
                <span className="health-score__light" aria-hidden="true" />
                <div>
                  <strong>{dashboard.health.level.label}</strong>
                  <span>{dashboard.health.score}/100</span>
                </div>
              </div>
            </div>

            <div className="health-meter">
              <div
                className="health-meter__fill"
                style={{ width: `${dashboard.health.score}%` }}
              />
            </div>

            <div className="health-metrics">
              <article>
                <span>Tasa de ahorro</span>
                <strong>{formatPercent(dashboard.health.metrics.savingRate)}</strong>
              </article>
              <article>
                <span>Gastos / ingresos</span>
                <strong>{formatPercent(dashboard.health.metrics.expenseRatio)}</strong>
              </article>
              <article>
                <span>Desfase vs presupuesto</span>
                <strong>
                  {dashboard.health.metrics.budgetOvershootRel === null
                    ? '— sin presupuestos'
                    : `+${formatPercent(dashboard.health.metrics.budgetOvershootRel)}`}
                </strong>
              </article>
              <article>
                <span>Carga de deuda</span>
                <strong>{formatPercent(dashboard.health.metrics.debtLoad)}</strong>
              </article>
            </div>

            <p className="health-note">
              Analisis financiero basado en transacciones reales de los ultimos 90 dias
              ({dashboard.analysisRange.from} a {dashboard.analysisRange.to}).
            </p>
          </section>
        </>
      ) : null}
    </Layout>
  )
}
