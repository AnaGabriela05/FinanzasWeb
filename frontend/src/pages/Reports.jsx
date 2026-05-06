import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import { ReportService } from '../services/reportService'
import ReportBreakdownCard from '../components/report/ReportBreakdownCard'
import ReportFiltersPanel from '../components/report/ReportFiltersPanel'
import ReportKpiGrid from '../components/report/ReportKpiGrid'
import ReportVisualPanel from '../components/report/ReportVisualPanel'
import { Link } from 'react-router-dom'

function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

function daysAgo(days = 90) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().slice(0, 10)
}

function getDefaultFilters() {
  return {
    from: daysAgo(90),
    to: new Date().toISOString().slice(0, 10),
    categoryId: '',
    paymentMethodId: '',
    transactionType: ''
  }
}

function summarizeTransactions(transactions) {
  return transactions.reduce(
    (summary, transaction) => {
      const amount = Number(transaction.monto || 0)
      const type = transaction.category?.tipo

      if (type === 'ingreso') {
        summary.ingresos += amount
      } else if (type === 'gasto') {
        summary.gastos += amount
      }

      summary.count += 1
      return summary
    },
    { ingresos: 0, gastos: 0, saldo: 0, count: 0 }
  )
}

function finalizeSummary(summary) {
  return {
    ...summary,
    saldo: summary.ingresos - summary.gastos
  }
}

function groupByCategory(transactions) {
  const grouped = new Map()

  for (const transaction of transactions) {
    const categoryName = transaction.category?.nombre || 'Sin categoria'
    const type = transaction.category?.tipo || 'sin tipo'
    const amount = Number(transaction.monto || 0)
    const key = `${categoryName}-${type}`

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        label: categoryName,
        type,
        total: 0,
        count: 0
      })
    }

    const current = grouped.get(key)
    current.total += amount
    current.count += 1
  }

  return Array.from(grouped.values()).sort((a, b) => b.total - a.total)
}

function groupByPaymentMethod(transactions) {
  const grouped = new Map()

  for (const transaction of transactions) {
    const name = transaction.paymentMethod?.nombre || 'Sin metodo'
    const amount = Number(transaction.monto || 0)

    if (!grouped.has(name)) {
      grouped.set(name, {
        label: name,
        total: 0,
        count: 0
      })
    }

    const current = grouped.get(name)
    current.total += amount
    current.count += 1
  }

  return Array.from(grouped.values()).sort((a, b) => b.total - a.total)
}

function groupMonthly(transactions) {
  const incomeByMonth = new Map()
  const expenseByMonth = new Map()

  for (const transaction of transactions) {
    const month = String(transaction.fecha || '').slice(0, 7)
    const amount = Number(transaction.monto || 0)
    const type = transaction.category?.tipo

    if (!month) continue

    if (type === 'ingreso') {
      incomeByMonth.set(month, (incomeByMonth.get(month) || 0) + amount)
    } else if (type === 'gasto') {
      expenseByMonth.set(month, (expenseByMonth.get(month) || 0) + amount)
    }
  }

  const labels = Array.from(new Set([...incomeByMonth.keys(), ...expenseByMonth.keys()])).sort()

  return labels.map((label) => ({
    label,
    income: incomeByMonth.get(label) || 0,
    expense: expenseByMonth.get(label) || 0
  }))
}

function getTypeLabel(type) {
  if (type === 'ingreso') return 'Ingreso'
  if (type === 'gasto') return 'Gasto'
  return 'Mixto'
}

function getTypeTone(type) {
  if (type === 'ingreso') return 'income'
  if (type === 'gasto') return 'expense'
  return 'neutral'
}

function getMonthTrend(rows) {
  if (rows.length < 2) {
    return {
      label: 'Tendencia reciente',
      value: 'Sin suficiente historial',
      help: 'Necesitas al menos dos meses con movimientos para comparar.'
    }
  }

  const current = rows[rows.length - 1]
  const previous = rows[rows.length - 2]
  const currentNet = current.income - current.expense
  const previousNet = previous.income - previous.expense
  const diff = currentNet - previousNet

  if (diff > 0) {
    return {
      label: 'Tendencia reciente',
      value: 'Mejora mensual',
      help: `El balance neto de ${current.label} mejoro ${formatMoney(diff)} frente a ${previous.label}.`
    }
  }

  if (diff < 0) {
    return {
      label: 'Tendencia reciente',
      value: 'Presion en gastos',
      help: `El balance neto de ${current.label} bajo ${formatMoney(Math.abs(diff))} frente a ${previous.label}.`
    }
  }

  return {
    label: 'Tendencia reciente',
    value: 'Sin cambios fuertes',
    help: `El balance neto de ${current.label} se mantuvo muy cercano al mes anterior.`
  }
}

function getExpensePressure(summary) {
  const ingresos = Number(summary.ingresos || 0)
  const gastos = Number(summary.gastos || 0)

  if (ingresos <= 0) {
    return {
      value: 'Sin base suficiente',
      accent: 'expense',
      help: 'No hay ingresos suficientes en el filtro para comparar la presion del gasto.'
    }
  }

  const ratio = gastos / ingresos

  if (ratio < 0.7) {
    return {
      value: 'Controlada',
      accent: 'income',
      help: `Los gastos representan ${Math.round(ratio * 100)}% de los ingresos del periodo.`
    }
  }

  if (ratio <= 0.95) {
    return {
      value: 'Atencion moderada',
      accent: 'balance',
      help: `Los gastos representan ${Math.round(ratio * 100)}% de los ingresos del periodo.`
    }
  }

  return {
    value: 'Alta',
    accent: 'expense',
    help: `Los gastos representan ${Math.round(ratio * 100)}% de los ingresos del periodo.`
  }
}

export default function Reports() {
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [draftFilters, setDraftFilters] = useState(getDefaultFilters)
  const [appliedFilters, setAppliedFilters] = useState(getDefaultFilters)
  const [reportData, setReportData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadOptions() {
      try {
        const [categoriesData, paymentMethodsData] = await Promise.all([
          ReportService.getCategories(),
          ReportService.getPaymentMethods()
        ])

        if (!cancelled) {
          setCategories(Array.isArray(categoriesData) ? categoriesData : [])
          setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : [])
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudieron cargar los filtros del modulo')
        }
      }
    }

    loadOptions()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadReport() {
      setLoading(true)
      setError('')

      try {
        const backendFilters = {
          from: appliedFilters.from,
          to: appliedFilters.to,
          categoryId: appliedFilters.categoryId,
          paymentMethodId: appliedFilters.paymentMethodId,
          transactionType: appliedFilters.transactionType
        }

        const [insights, transactions] = await Promise.all([
          ReportService.getInsights(backendFilters),
          ReportService.getTransactions(backendFilters)
        ])

        if (!cancelled) {
          setReportData({
            insights,
            transactions: Array.isArray(transactions) ? transactions : []
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'No se pudieron cargar los reportes')
          setReportData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadReport()

    return () => {
      cancelled = true
    }
  }, [appliedFilters])

  const filteredTransactions = useMemo(() => {
    const source = reportData?.transactions || []

    if (!appliedFilters.transactionType) {
      return source
    }

    return source.filter(
      (transaction) => transaction.category?.tipo === appliedFilters.transactionType
    )
  }, [reportData, appliedFilters.transactionType])

  const summary = useMemo(() => {
    if (!reportData) {
      return finalizeSummary({ ingresos: 0, gastos: 0, saldo: 0, count: 0 })
    }

    if (!appliedFilters.transactionType) {
      return {
        ingresos: Number(reportData.insights?.totals?.ingresos || 0),
        gastos: Number(reportData.insights?.totals?.gastos || 0),
        saldo: Number(reportData.insights?.totals?.saldo || 0),
        count: filteredTransactions.length
      }
    }

    return finalizeSummary(summarizeTransactions(filteredTransactions))
  }, [reportData, appliedFilters.transactionType, filteredTransactions])

  const categorySummary = useMemo(
    () => groupByCategory(filteredTransactions),
    [filteredTransactions]
  )

  const expenseCategorySummary = useMemo(
    () => categorySummary.filter((item) => item.type === 'gasto'),
    [categorySummary]
  )

  const paymentMethodSummary = useMemo(
    () => groupByPaymentMethod(filteredTransactions),
    [filteredTransactions]
  )

  const monthlyRows = useMemo(
    () => groupMonthly(filteredTransactions),
    [filteredTransactions]
  )

  const trend = useMemo(
    () => getMonthTrend(monthlyRows),
    [monthlyRows]
  )

  const expensePressure = useMemo(
    () => getExpensePressure(summary),
    [summary]
  )

  const topExpenseCategory = expenseCategorySummary[0] || null
  const topPaymentMethod = paymentMethodSummary[0] || null

  function updateDraftFilter(field, value) {
    setDraftFilters((current) => ({ ...current, [field]: value }))
  }

  function applyFilters(event) {
    event.preventDefault()
    setAppliedFilters(draftFilters)
  }

  function resetFilters() {
    const defaults = getDefaultFilters()
    setDraftFilters(defaults)
    setAppliedFilters(defaults)
  }

  async function handleExport(format) {
    setExporting(format)
    setError('')

    try {
      await ReportService.downloadExport(appliedFilters, format)
    } catch (err) {
      setError(err.message || 'No se pudo exportar el reporte')
    } finally {
      setExporting('')
    }
  }

  return (
    <Layout>
      <section className="module-header report-header">
        <div>
          <span className="module-header__eyebrow">Analisis</span>
          <h1>Reportes de transacciones</h1>
          <p>
            Tablero ejecutivo para leer tu actividad financiera con filtros reales,
            KPIs, distribuciones y exportacion lista para compartir.
          </p>
        </div>
      </section>

      {error ? (
        <section className="module-feedback module-feedback--error">{error}</section>
      ) : null}

      <section className="reports-layout">
        <ReportFiltersPanel
          categories={categories}
          paymentMethods={paymentMethods}
          draftFilters={draftFilters}
          appliedFilters={appliedFilters}
          loading={loading}
          exporting={exporting}
          onChange={updateDraftFilter}
          onApply={applyFilters}
          onReset={resetFilters}
          onExport={handleExport}
        />

        <div className="report-panel">
          {loading ? (
            <section className="dashboard-state">
              <div className="dashboard-loader" />
              <p>Cargando analisis financiero...</p>
            </section>
          ) : reportData ? (
            <>
              <ReportVisualPanel
                monthlyRows={monthlyRows}
                expenseCategorySummary={expenseCategorySummary}
                paymentMethodSummary={paymentMethodSummary}
                trend={trend}
                expensePressure={expensePressure}
                categoryCount={categorySummary.length}
                paymentMethodCount={paymentMethodSummary.length}
                topExpenseCategory={topExpenseCategory}
                topPaymentMethod={topPaymentMethod}
                formatMoney={formatMoney}
              />

              <ReportKpiGrid
                summary={{
                  ingresos: formatMoney(summary.ingresos),
                  gastos: formatMoney(summary.gastos),
                  saldo: formatMoney(summary.saldo)
                }}
                transactionCount={summary.count}
                categoryCount={categorySummary.length}
                paymentMethodCount={paymentMethodSummary.length}
              />

              <section className="report-grid-2">
                <ReportBreakdownCard
                  title="Resumen por categoria"
                  subtitle="Distribucion del monto total por categoria dentro del rango actual."
                  items={categorySummary}
                  tone="category"
                  emptyLabel="No hay categorias con movimientos en el filtro actual."
                  formatMoney={formatMoney}
                  getTypeLabel={getTypeLabel}
                  getTypeTone={getTypeTone}
                />

                <ReportBreakdownCard
                  title="Resumen por metodo de pago"
                  subtitle="Lectura ejecutiva del peso de cada metodo de pago."
                  items={paymentMethodSummary}
                  tone="payment"
                  emptyLabel="No hay metodos de pago con movimientos en el filtro actual."
                  formatMoney={formatMoney}
                  getTypeLabel={getTypeLabel}
                  getTypeTone={getTypeTone}
                />
              </section>

              <article className="report-detail-card">
                <div className="report-detail-card__header">
                  <div>
                    <span className="report-detail-card__eyebrow">Detalle operativo</span>
                    <h2>El detalle completo vive en Transacciones</h2>
                    <p>
                      Este modulo queda enfocado en lectura analitica. Si necesitas
                      revisar movimientos uno por uno, editar registros o validar
                      descripciones, usa el modulo especializado de transacciones.
                    </p>
                  </div>
                  <Link className="button-secondary report-detail-card__link" to="/transactions">
                    Ver detalle en Transacciones
                  </Link>
                </div>
              </article>
            </>
          ) : null}
        </div>
      </section>
    </Layout>
  )
}
