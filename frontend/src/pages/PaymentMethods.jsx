import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import ConfirmModal from '../components/ConfirmModal'
import DependencyActionModal from '../components/DependencyActionModal'
import { PaymentMethodsService } from '../services/paymentMethods'

const emptyForm = {
  nombre: '',
  activo: true
}

export default function PaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalState, setModalState] = useState({ type: null, payload: null, loading: false })

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  async function loadPaymentMethods() {
    setLoading(true)
    setError('')

    try {
      const data = await PaymentMethodsService.list()
      setPaymentMethods(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los metodos de pago')
    } finally {
      setLoading(false)
    }
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
        title: editingId ? 'Confirmar cambios en metodo de pago' : 'Confirmar creacion de metodo de pago',
        description: editingId
          ? 'Se guardaran los cambios de este metodo de pago.'
          : 'Se creara un nuevo metodo de pago con los datos ingresados.'
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
      nombre: form.nombre.trim(),
      activo: Boolean(form.activo)
    }

    try {
      if (!payload.nombre) {
        throw new Error('El nombre es obligatorio')
      }

      if (editingId) {
        await PaymentMethodsService.update(editingId, payload)
        showFeedback('success', 'Metodo de pago actualizado correctamente')
      } else {
        await PaymentMethodsService.create({ nombre: payload.nombre })
        showFeedback('success', 'Metodo de pago creado correctamente')
      }

      resetForm()
      closeModal()
      await loadPaymentMethods()
    } catch (err) {
      showFeedback('error', err.message || 'No se pudo guardar el metodo de pago')
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(paymentMethod) {
    setEditingId(paymentMethod.id)
    setForm({
      nombre: paymentMethod.nombre || '',
      activo: paymentMethod.activo !== false
    })
    setFeedback(null)
  }

  async function handleDelete(paymentMethod) {
    setFeedback(null)
    setError('')

    try {
      const stats = await PaymentMethodsService.usage(paymentMethod.id)
      const hasDependencies = Number(stats.txCount || 0) > 0

      if (hasDependencies) {
        setModalState({
          type: 'dependencies',
          payload: { record: paymentMethod, stats },
          loading: false
        })
        return
      }

      setModalState({
        type: 'delete',
        payload: { record: paymentMethod },
        loading: false
      })
    } catch (err) {
      showFeedback('error', err.message || 'No se pudo eliminar el metodo de pago')
    }
  }

  async function confirmSimpleDelete() {
    const paymentMethod = modalState.payload?.record
    if (!paymentMethod) return

    setModalState((current) => ({ ...current, loading: true }))

    try {
      await PaymentMethodsService.remove(paymentMethod.id)
      showFeedback('success', 'Metodo de pago eliminado correctamente')

      if (editingId === paymentMethod.id) {
        resetForm()
      }

      closeModal()
      await loadPaymentMethods()
    } catch (err) {
      showFeedback('error', err.message || 'No se pudo eliminar el metodo de pago')
      closeModal()
    }
  }

  async function handleDependencyAction(mode) {
    const paymentMethod = modalState.payload?.record
    if (!paymentMethod) return

    setModalState((current) => ({ ...current, loading: true }))

    try {
      const query = mode === 'archive' ? '?archive=1' : '?cascade=1'
      await PaymentMethodsService.remove(paymentMethod.id, query)
      showFeedback(
        'success',
        mode === 'archive'
          ? 'Metodo de pago archivado correctamente'
          : 'Metodo de pago eliminado junto con sus transacciones'
      )

      if (editingId === paymentMethod.id) {
        resetForm()
      }

      closeModal()
      await loadPaymentMethods()
    } catch (err) {
      showFeedback('error', err.message || 'No se pudo procesar el metodo de pago')
      closeModal()
    }
  }

  return (
    <>
      <Layout>
        <section className="module-header">
          <div>
            <span className="module-header__eyebrow">Modulo</span>
            <h1>Metodos de pago</h1>
            <p>
              Gestiona tus metodos de pago con la API real del proyecto. Desde aqui
              puedes listar, crear, editar y eliminar.
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

        <section className="module-grid">
          <article className="module-card">
            <div className="module-card__header">
              <h2>{editingId ? 'Editar metodo de pago' : 'Nuevo metodo de pago'}</h2>
              <p>
                {editingId
                  ? 'Actualiza los datos y guarda los cambios.'
                  : 'Completa el formulario para registrar un nuevo metodo.'}
              </p>
            </div>

            <form className="module-form" onSubmit={handleSubmit}>
              <label htmlFor="payment-method-name">Nombre</label>
              <input
                id="payment-method-name"
                type="text"
                value={form.nombre}
                onChange={(event) => updateForm('nombre', event.target.value)}
                placeholder="Ej. Tarjeta debito"
                required
              />

              {editingId ? (
                <label className="module-checkbox">
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(event) => updateForm('activo', event.target.checked)}
                  />
                  Metodo activo
                </label>
              ) : null}

              <div className="module-actions">
                <button className="button-primary" type="submit" disabled={saving}>
                  {saving
                    ? 'Guardando...'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Crear metodo'}
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
              <h2>Listado de metodos</h2>
              <p>{paymentMethods.length} metodos visibles segun tu sesion actual.</p>
            </div>

            {loading ? (
              <div className="table-state">
                <div className="dashboard-loader" />
                <p>Cargando metodos de pago...</p>
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="table-state">
                <p>No hay metodos de pago disponibles todavia.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="module-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentMethods.map((paymentMethod) => (
                      <tr key={paymentMethod.id}>
                        <td>
                          <div className="table-main">
                            <strong>{paymentMethod.nombre}</strong>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`status-pill status-pill--${paymentMethod.activo === false ? 'inactive' : 'active'}`}
                          >
                            {paymentMethod.activo === false ? 'Inactivo' : 'Activo'}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => handleEdit(paymentMethod)}
                            >
                              Editar
                            </button>
                            <button
                              className="button-danger"
                              type="button"
                              onClick={() => handleDelete(paymentMethod)}
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
        description={`Se eliminara el metodo de pago "${modalState.payload?.record?.nombre || ''}".`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={modalState.loading}
        onConfirm={confirmSimpleDelete}
        onClose={closeModal}
      />

      <DependencyActionModal
        open={modalState.type === 'dependencies'}
        title="Gestionar metodo de pago con dependencias"
        itemName={modalState.payload?.record?.nombre || ''}
        details={[
          { label: 'Nombre', value: modalState.payload?.record?.nombre || '—' },
          { label: 'Estado', value: modalState.payload?.record?.activo === false ? 'Inactivo' : 'Activo' }
        ]}
        dependencies={[
          { label: 'Transacciones asociadas', value: modalState.payload?.stats?.txCount ?? 0 }
        ]}
        impactNote="Cambiar o eliminar este metodo de pago afectara indirectamente los reportes que usan esas transacciones."
        loading={modalState.loading}
        archiveLabel="Archivar (mantener historial)"
        cascadeLabel="Eliminar TODO"
        onArchive={() => handleDependencyAction('archive')}
        onCascade={() => handleDependencyAction('cascade')}
        onClose={closeModal}
      />
    </>
  )
}
