import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import ModuleHeader from '../components/layout/ModuleHeader'
import ConfirmModal from '../components/ConfirmModal'
import { TableSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { TransactionsService } from '../services/transactions'
import { describeAmount, formatAmount, formatPEN, getExchangeRate } from '../lib/currency'
import { usePreviewMode } from '../hooks/usePreviewMode'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const emptyForm = {
  fecha: today(),
  monto: '',
  currency: 'PEN',
  descripcion: '',
  categoryId: '',
  paymentMethodId: ''
}

const PAGE_SIZE = 50

export default function Transactions() {
  const toast = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const isPreview = usePreviewMode()
  const [transactions, setTransactions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 })
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalState, setModalState] = useState({ type: null, payload: null, loading: false })
  const formRef = useRef(null)

  const gastoDelMes = useMemo(() => {
    const ahora = new Date()
    const ym = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`
    return transactions
      .filter(
        (t) =>
          String(t.fecha || '').slice(0, 7) === ym &&
          t.category?.tipo === 'gasto'
      )
      .reduce((sum, t) => sum + Number(t.monto || 0), 0)
  }, [transactions])

  function startNewTransaction() {
    resetForm()
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    loadInitialData()
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('nueva') === '1') {
      startNewTransaction()
      params.delete('nueva')
      const query = params.toString()
      navigate(`/transactions${query ? `?${query}` : ''}`, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search])

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(form.categoryId)),
    [categories, form.categoryId]
  )

  async function loadInitialData() {
    setLoading(true)
    setError('')

    if (isPreview) {
      setTransactions([])
      setPagination({ page: 1, total: 0, totalPages: 1 })
      setCategories([])
      setPaymentMethods([])
      setLoading(false)
      return
    }

    try {
      const [transactionsData, categoriesData, paymentMethodsData] = await Promise.all([
        TransactionsService.list({ page: 1, limit: PAGE_SIZE }),
        TransactionsService.categories(),
        TransactionsService.paymentMethods()
      ])

      applyTransactionsResponse(transactionsData, 1)
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las transacciones')
    } finally {
      setLoading(false)
    }
  }

  function applyTransactionsResponse(data, requestedPage) {
    const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []
    setTransactions(items)
    setPagination({
      page: data?.page ?? requestedPage,
      total: data?.total ?? items.length,
      totalPages: data?.totalPages ?? 1
    })
  }

  async function loadPage(page) {
    setLoading(true)
    setError('')
    try {
      const data = await TransactionsService.list({ page, limit: PAGE_SIZE })
      applyTransactionsResponse(data, page)
    } catch (err) {
      setError(err.message || 'No se pudo cargar la pagina')
    } finally {
      setLoading(false)
    }
  }

  async function refreshTransactions() {
    const data = await TransactionsService.list({ page: pagination.page, limit: PAGE_SIZE })
    applyTransactionsResponse(data, pagination.page)
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
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
        title: editingId ? 'Confirmar cambios en transaccion' : 'Confirmar creacion de transaccion',
        description: editingId
          ? 'Se guardaran los cambios de esta transaccion.'
          : 'Se registrara una nueva transaccion con los datos ingresados.'
      },
      loading: false
    })
  }

  async function confirmSave() {
    setModalState((current) => ({ ...current, loading: true }))
    setSaving(true)
    setError('')

    const payload = {
      fecha: form.fecha,
      monto: Number(form.monto),
      currency: form.currency || 'PEN',
      descripcion: form.descripcion.trim(),
      categoryId: Number(form.categoryId),
      paymentMethodId: Number(form.paymentMethodId)
    }

    try {
      if (!payload.fecha || !payload.categoryId || !payload.paymentMethodId) {
        throw new Error('Completa fecha, categoria y metodo de pago')
      }

      if (!Number.isFinite(payload.monto) || payload.monto <= 0) {
        throw new Error('Ingresa un monto valido')
      }

      if (editingId) {
        await TransactionsService.update(editingId, payload)
        toast.success('Transaccion actualizada correctamente')
      } else {
        await TransactionsService.create(payload)
        toast.success('Transaccion creada correctamente')
      }

      resetForm()
      closeModal()
      await refreshTransactions()
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar la transaccion')
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(transaction) {
    setEditingId(transaction.id)
    setForm({
      fecha: String(transaction.fecha || '').slice(0, 10),
      monto: transaction.monto ?? '',
      currency: transaction.currency || 'PEN',
      descripcion: transaction.descripcion || '',
      categoryId: String(transaction.categoryId || transaction.category?.id || ''),
      paymentMethodId: String(transaction.paymentMethodId || transaction.paymentMethod?.id || '')
    })
  }

  function handleDelete(transaction) {
    setError('')
    setModalState({
      type: 'delete',
      payload: { record: transaction },
      loading: false
    })
  }

  async function confirmDelete() {
    const transaction = modalState.payload?.record
    if (!transaction) return

    setModalState((current) => ({ ...current, loading: true }))

    try {
      await TransactionsService.remove(transaction.id)
      toast.success('Transaccion eliminada correctamente')

      if (editingId === transaction.id) {
        resetForm()
      }

      closeModal()
      await refreshTransactions()
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar la transaccion')
      closeModal()
    }
  }

  return (
    <>
      <Layout>
        <ModuleHeader
          subtitle="Registra cada ingreso y gasto para mantener tu control financiero"
          badges={[
            { label: 'Este mes', value: formatPEN(gastoDelMes), variant: 'warning' },
            { label: 'Total movimientos', value: String(pagination.total || transactions.length), variant: 'default' }
          ]}
          primaryAction={{
            label: 'Nueva transacción',
            icon: '+',
            onClick: startNewTransaction,
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
              <h2>{editingId ? 'Editar transaccion' : 'Nueva transaccion'}</h2>
              <p>
                {editingId
                  ? 'Actualiza la informacion y guarda los cambios.'
                  : 'Completa el formulario para registrar un movimiento.'}
              </p>
            </div>

            <form className="module-form" onSubmit={handleSubmit}>
              <label htmlFor="transaction-date">Fecha</label>
              <input
                id="transaction-date"
                type="date"
                value={form.fecha}
                onChange={(event) => updateForm('fecha', event.target.value)}
                required
              />

              <div className="inline-grid">
                <div>
                  <label htmlFor="transaction-amount">Monto</label>
                  <input
                    id="transaction-amount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.monto}
                    onChange={(event) => updateForm('monto', event.target.value)}
                    placeholder="Ej. 150"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="transaction-currency">Moneda</label>
                  <select
                    id="transaction-currency"
                    value={form.currency}
                    onChange={(event) => updateForm('currency', event.target.value)}
                  >
                    <option value="PEN">Soles (S/)</option>
                    <option value="USD">Dólares ($)</option>
                  </select>
                </div>
              </div>

              {form.currency === 'USD' && Number(form.monto) > 0 ? (
                <div className="inline-hint">
                  Equivale a {formatPEN(Number(form.monto) * getExchangeRate())} aproximadamente.
                </div>
              ) : null}

              <label htmlFor="transaction-description">Detalle</label>
              <input
                id="transaction-description"
                type="text"
                value={form.descripcion}
                onChange={(event) => updateForm('descripcion', event.target.value)}
                placeholder="Ej. Pago de servicio"
              />

              <label htmlFor="transaction-category">Categoria</label>
              <select
                id="transaction-category"
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

              {selectedCategory ? (
                <div className="inline-hint">
                  Tipo detectado por la categoria:
                  <span
                    className={`type-pill type-pill--${selectedCategory.tipo === 'ingreso' ? 'income' : 'expense'}`}
                  >
                    {selectedCategory.tipo}
                  </span>
                </div>
              ) : null}

              <label htmlFor="transaction-payment-method">Metodo de pago</label>
              <select
                id="transaction-payment-method"
                value={form.paymentMethodId}
                onChange={(event) => updateForm('paymentMethodId', event.target.value)}
                required
              >
                <option value="">Selecciona un metodo</option>
                {paymentMethods.map((paymentMethod) => (
                  <option key={paymentMethod.id} value={paymentMethod.id}>
                    {paymentMethod.nombre}
                  </option>
                ))}
              </select>

              <div className="module-actions">
                <button className="button-primary" type="submit" disabled={saving}>
                  {saving
                    ? 'Guardando...'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Registrar transaccion'}
                </button>

                {editingId ? (
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={resetForm}
                    disabled={saving}
                  >
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>
          </article>

          <article className="module-card">
            <div className="module-card__header">
              <h2>Listado de transacciones</h2>
              <p>
                {pagination.total > 0
                  ? `Mostrando ${transactions.length} de ${pagination.total} movimientos.`
                  : 'Sin movimientos cargados todavía.'}
              </p>
            </div>

            {loading ? (
              <TableSkeleton rows={6} columns={6} />
            ) : transactions.length === 0 ? (
              <div className="table-state">
                <p>No hay transacciones registradas todavia.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="module-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Detalle</th>
                      <th>Categoria</th>
                      <th>Metodo</th>
                      <th>Monto</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td>{String(transaction.fecha || '').slice(0, 10)}</td>
                        <td>
                          <div className="table-main">
                            <strong>{transaction.descripcion || 'Sin detalle'}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="table-stack">
                            <span>{transaction.category?.nombre || 'Sin categoria'}</span>
                            {transaction.category?.tipo ? (
                              <span
                                className={`type-pill type-pill--${transaction.category.tipo === 'ingreso' ? 'income' : 'expense'}`}
                              >
                                {transaction.category.tipo}
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td>{transaction.paymentMethod?.nombre || 'Sin metodo'}</td>
                        <td>
                          {(() => {
                            const desc = describeAmount(transaction.monto, transaction.currency)
                            return (
                              <div className="amount-cell">
                                <strong>{desc.display}</strong>
                                {desc.isForeign ? (
                                  <small className="amount-cell__approx">≈ {desc.approx}</small>
                                ) : null}
                              </div>
                            )
                          })()}
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => handleEdit(transaction)}
                            >
                              Editar
                            </button>
                            <button
                              className="button-danger"
                              type="button"
                              onClick={() => handleDelete(transaction)}
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

            {pagination.totalPages > 1 ? (
              <div className="pagination">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => loadPage(pagination.page - 1)}
                  disabled={loading || pagination.page <= 1}
                >
                  Anterior
                </button>
                <span className="pagination__info">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => loadPage(pagination.page + 1)}
                  disabled={loading || pagination.page >= pagination.totalPages}
                >
                  Siguiente
                </button>
              </div>
            ) : null}
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
        description={`Se eliminara la transaccion "${modalState.payload?.record?.descripcion || 'Sin detalle'}" por ${formatAmount(modalState.payload?.record?.monto || 0, modalState.payload?.record?.currency || 'PEN')}.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={modalState.loading}
        onConfirm={confirmDelete}
        onClose={closeModal}
      />
    </>
  )
}
