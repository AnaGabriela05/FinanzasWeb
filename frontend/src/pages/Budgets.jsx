import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/layout/ModuleHeader'
import ConfirmModal from '../components/ConfirmModal'
import { TableSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { BudgetsService } from '../services/budgets'
import { formatPEN as formatMoney } from '../lib/currency'
import { usePreviewMode } from '../hooks/usePreviewMode'

function currentMonth() {
  return String(new Date().getMonth() + 1)
}

function currentYear() {
  return String(new Date().getFullYear())
}

const emptyForm = {
  categoryId: '',
  montoMensual: '',
  mes: currentMonth(),
  anio: currentYear()
}

const emptyFilters = {
  mes: '',
  anio: ''
}

export default function Budgets() {
  const toast = useToast()
  const isPreview = usePreviewMode()
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [filters, setFilters] = useState(emptyFilters)
  const [editingId, setEditingId] = useState(null)
  const [modalState, setModalState] = useState({ type: null, payload: null, loading: false })
  const formRef = useRef(null)

  const activosCount = budgets.length
  const alLimiteCount = useMemo(
    () => budgets.filter((b) => b.alLimite || b.estado === 'limite').length,
    [budgets]
  )

  function startNewBudget() {
    resetForm()
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  async function loadInitialData() {
    setLoading(true)
    setError('')

    if (isPreview) {
      setBudgets([])
      setCategories([])
      setLoading(false)
      return
    }

    try {
      const [budgetsData, categoriesData] = await Promise.all([
        BudgetsService.list(),
        BudgetsService.categories()
      ])

      setBudgets(Array.isArray(budgetsData) ? budgetsData : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los presupuestos')
    } finally {
      setLoading(false)
    }
  }

  async function refreshBudgets(nextFilters = filters) {
    const data = await BudgetsService.list(nextFilters)
    setBudgets(Array.isArray(data) ? data : [])
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateFilters(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function closeModal() {
    setModalState({ type: null, payload: null, loading: false })
  }

function handleSubmit(event) {
    event.preventDefault()
    setModalState({
      type: 'save',
      payload: {
        title: editingId ? 'Confirmar cambios en presupuesto' : 'Confirmar guardado de presupuesto',
        description: editingId
          ? 'Se guardaran los cambios de este presupuesto.'
          : 'Se registrara un nuevo presupuesto con los datos ingresados.'
      },
      loading: false
    })
  }

  async function confirmSave() {
    setModalState((current) => ({ ...current, loading: true }))
    setSaving(true)
    setError('')

    const payload = {
      categoryId: Number(form.categoryId),
      montoMensual: Number(form.montoMensual),
      mes: Number(form.mes),
      anio: Number(form.anio)
    }

    try {
      if (!payload.categoryId || !payload.mes || !payload.anio) {
        throw new Error('Completa categoria, mes y anio')
      }

      if (!Number.isFinite(payload.montoMensual) || payload.montoMensual <= 0) {
        throw new Error('Ingresa un monto mensual valido')
      }

      if (editingId) {
        await BudgetsService.update(editingId, payload)
        toast.success('Presupuesto actualizado correctamente')
      } else {
        await BudgetsService.create(payload)
        toast.success('Presupuesto guardado correctamente')
      }

      resetForm()
      closeModal()
      await refreshBudgets()
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar el presupuesto')
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(budget) {
    setEditingId(budget.id)
    setForm({
      categoryId: String(budget.categoryId || budget.category?.id || ''),
      montoMensual: budget.montoMensual ?? '',
      mes: String(budget.mes || ''),
      anio: String(budget.anio || '')
    })
  }

  function handleDelete(budget) {
    setError('')
    setModalState({
      type: 'delete',
      payload: { record: budget },
      loading: false
    })
  }

  async function confirmDelete() {
    const budget = modalState.payload?.record
    if (!budget) return

    setModalState((current) => ({ ...current, loading: true }))

    try {
      await BudgetsService.remove(budget.id)
      toast.success('Presupuesto eliminado correctamente')

      if (editingId === budget.id) {
        resetForm()
      }

      closeModal()
      await refreshBudgets()
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar el presupuesto')
      closeModal()
    }
  }

  async function handleFilterSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      setLoading(true)
      await refreshBudgets(filters)
    } catch (err) {
      setError(err.message || 'No se pudo filtrar el listado')
    } finally {
      setLoading(false)
    }
  }

  async function clearFilters() {
    setFilters(emptyFilters)
    setError('')

    try {
      setLoading(true)
      const data = await BudgetsService.list()
      setBudgets(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'No se pudo recargar el listado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Layout>
        <ModuleHeader
          subtitle="Define un límite mensual de gasto por categoría"
          badges={[
            { label: 'Activos', value: String(activosCount), variant: 'default' },
            ...(alLimiteCount > 0
              ? [{ label: 'Al límite', value: String(alLimiteCount), icon: '⚠️', variant: 'warning' }]
              : [])
          ]}
          primaryAction={{
            label: 'Asignar presupuesto',
            icon: '+',
            onClick: startNewBudget,
            disabled: isPreview,
            title: isPreview ? 'No disponible en modo vista previa' : undefined
          }}
        />

        {error ? (
          <section className="module-feedback module-feedback--error">
            {error}
          </section>
        ) : null}

        <section className="module-grid module-grid--wide">
          <article className="module-card" ref={formRef}>
            <div className="module-card__header">
              <h2>{editingId ? 'Editar presupuesto' : 'Asignar presupuesto'}</h2>
              <p>
                {editingId
                  ? 'Actualiza categoria, monto o periodo y guarda los cambios.'
                  : 'Crea o registra un presupuesto mensual por categoria.'}
              </p>
            </div>

            <form className="module-form" onSubmit={handleSubmit}>
              <label htmlFor="budget-category">Categoria</label>
              <select
                id="budget-category"
                value={form.categoryId}
                onChange={(event) => updateForm('categoryId', event.target.value)}
                required
              >
                <option value="">Selecciona una categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.nombre} ({category.tipo})
                  </option>
                ))}
              </select>

              <label htmlFor="budget-amount">Monto mensual</label>
              <input
                id="budget-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.montoMensual}
                onChange={(event) => updateForm('montoMensual', event.target.value)}
                placeholder="Ej. 500000"
                required
              />

              <div className="inline-grid">
                <div>
                  <label htmlFor="budget-month">Mes</label>
                  <input
                    id="budget-month"
                    type="number"
                    min="1"
                    max="12"
                    value={form.mes}
                    onChange={(event) => updateForm('mes', event.target.value)}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="budget-year">Anio</label>
                  <input
                    id="budget-year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={form.anio}
                    onChange={(event) => updateForm('anio', event.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="module-actions">
                <button className="button-primary" type="submit" disabled={saving}>
                  {saving
                    ? 'Guardando...'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Guardar presupuesto'}
                </button>

                <button
                  className="button-secondary"
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Limpiar
                </button>
              </div>
            </form>
          </article>

          <article className="module-card">
            <div className="module-card__header">
              <h2>Listado de presupuestos</h2>
              <p>{budgets.length} presupuestos cargados desde la API real.</p>
            </div>

            <form className="module-form module-form--inline" onSubmit={handleFilterSubmit}>
              <div className="inline-grid">
                <div>
                  <label htmlFor="filter-month">Filtrar por mes</label>
                  <input
                    id="filter-month"
                    type="number"
                    min="1"
                    max="12"
                    value={filters.mes}
                    onChange={(event) => updateFilters('mes', event.target.value)}
                    placeholder="Mes"
                  />
                </div>
                <div>
                  <label htmlFor="filter-year">Filtrar por anio</label>
                  <input
                    id="filter-year"
                    type="number"
                    min="2000"
                    max="2100"
                    value={filters.anio}
                    onChange={(event) => updateFilters('anio', event.target.value)}
                    placeholder="Anio"
                  />
                </div>
              </div>

              <div className="module-actions">
                <button className="button-secondary" type="submit">
                  Buscar
                </button>
                <button className="button-secondary" type="button" onClick={clearFilters}>
                  Quitar filtros
                </button>
              </div>
            </form>

            {loading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : budgets.length === 0 ? (
              <div className="table-state">
                <p>No hay presupuestos registrados todavia.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="module-table">
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Periodo</th>
                      <th>Monto</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {budgets.map((budget) => (
                      <tr key={budget.id}>
                        <td>
                          <div className="table-stack">
                            <strong>{budget.category?.nombre || 'Sin categoria'}</strong>
                            {budget.category?.tipo ? (
                              <span
                                className={`type-pill type-pill--${budget.category.tipo === 'ingreso' ? 'income' : 'expense'}`}
                              >
                                {budget.category.tipo}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>{budget.mes}/{budget.anio}</td>
                        <td><strong>{formatMoney(budget.montoMensual)}</strong></td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => handleEdit(budget)}
                            >
                              Editar
                            </button>
                            <button
                              className="button-danger"
                              type="button"
                              onClick={() => handleDelete(budget)}
                            >
                              Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </Layout>

      <ConfirmModal
        open={modalState.type === 'save'}
        title={modalState.payload?.title || 'Confirmar'}
        description={modalState.payload?.description || ''}
        confirmLabel="Guardar"
        loading={modalState.loading}
        onConfirm={confirmSave}
        onClose={closeModal}
      />

      <ConfirmModal
        open={modalState.type === 'delete'}
        title="Confirmar eliminacion"
        description={`Se eliminara el presupuesto de "${modalState.payload?.record?.category?.nombre || 'Sin categoria'}" para ${modalState.payload?.record?.mes || '—'}/${modalState.payload?.record?.anio || '—'}.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={modalState.loading}
        onConfirm={confirmDelete}
        onClose={closeModal}
      />
    </>
  )
}
