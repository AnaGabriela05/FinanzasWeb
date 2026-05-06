import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import { TransactionsService } from '../services/transactions'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatMoney(value) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

const emptyForm = {
  fecha: today(),
  monto: '',
  descripcion: '',
  categoryId: '',
  paymentMethodId: ''
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalState, setModalState] = useState({ type: null, payload: null, loading: false })

  useEffect(() => {
    loadInitialData()
  }, [])

  const selectedCategory = useMemo(
    () => categories.find((category) => String(category.id) === String(form.categoryId)),
    [categories, form.categoryId]
  )

  async function loadInitialData() {
    setLoading(true)
    setError('')

    try {
      const [transactionsData, categoriesData, paymentMethodsData] = await Promise.all([
        TransactionsService.list(),
        TransactionsService.categories(),
        TransactionsService.paymentMethods()
      ])

      setTransactions(Array.isArray(transactionsData) ? transactionsData : [])
      setCategories(Array.isArray(categoriesData) ? categoriesData : [])
      setPaymentMethods(Array.isArray(paymentMethodsData) ? paymentMethodsData : [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las transacciones')
    } finally {
      setLoading(false)
    }
  }

  async function refreshTransactions() {
    const data = await TransactionsService.list()
    setTransactions(Array.isArray(data) ? data : [])
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

  function showFeedback(type, message) {
    setFeedback({ type, message })
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
    setFeedback(null)

    const payload = {
      fecha: form.fecha,
      monto: Number(form.monto),
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
        showFeedback('success', 'Transaccion actualizada correctamente')
      } else {
        await TransactionsService.create(payload)
        showFeedback('success', 'Transaccion creada correctamente')
      }

      resetForm()
      closeModal()
      await refreshTransactions()
    } catch (err) {
      showFeedback('error', err.message || 'No se pudo guardar la transaccion')
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
      descripcion: transaction.descripcion || '',
      categoryId: String(transaction.categoryId || transaction.category?.id || ''),
      paymentMethodId: String(transaction.paymentMethodId || transaction.paymentMethod?.id || '')
    })
    setFeedback(null)
  }

  function handleDelete(transaction) {
    setFeedback(null)
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
      showFeedback('success', 'Transaccion eliminada correctamente')

      if (editingId === transaction.id) {
        resetForm()
      }

      closeModal()
      await refreshTransactions()
    } catch (err) {
      showFeedback('error', err.message || 'No se pudo eliminar la transaccion')
      closeModal()
    }
  }

  return (
    <>
      <Layout>
        <section className="module-header">
          <div>
            <span className="module-header__eyebrow">Modulo</span>
            <h1>Transacciones</h1>
            <p>
              Registra y administra tus movimientos usando categorias y metodos de pago
              reales cargados desde el backend actual.
            </p>
          </div>
        </section>

        {feedback ? (
          <section className={`module-feedback module-feedback--${feedback.type}`}>
            {feedback.message}
          </section>
        ) : null}

        {error ? (
          <section className="module-feedback module-feedback--error">
            {error}
          </section>
        ) : null}

        <section className="module-grid module-grid--wide">
          <article className="module-card">
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

              <label htmlFor="transaction-amount">Monto</label>
              <input
                id="transaction-amount"
                type="number"
                min="0"
                step="0.01"
                value={form.monto}
                onChange={(event) => updateForm('monto', event.target.value)}
                placeholder="Ej. 150000"
                required
              />

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
              <p>{transactions.length} movimientos cargados desde la API real.</p>
            </div>

            {loading ? (
              <div className="table-state">
                <div className="dashboard-loader" />
                <p>Cargando transacciones...</p>
              </div>
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
                          <strong>{formatMoney(transaction.monto)}</strong>
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
        description={`Se eliminara la transaccion "${modalState.payload?.record?.descripcion || 'Sin detalle'}" por ${formatMoney(modalState.payload?.record?.monto || 0)}.`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={modalState.loading}
        onConfirm={confirmDelete}
        onClose={closeModal}
      />
    </>
  )
}
