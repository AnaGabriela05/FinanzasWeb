import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/layout/ModuleHeader'
import ConfirmModal from '../components/ConfirmModal'
import DependencyActionModal from '../components/DependencyActionModal'
import { TableSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { PaymentMethodsService } from '../services/paymentMethods'
import { usePreviewMode } from '../hooks/usePreviewMode'

const emptyForm = {
  nombre: '',
  activo: true
}

export default function PaymentMethods() {
  const toast = useToast()
  const isPreview = usePreviewMode()
  const [paymentMethods, setPaymentMethods] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalState, setModalState] = useState({ type: null, payload: null, loading: false })
  const formRef = useRef(null)

  const activosCount = useMemo(
    () => paymentMethods.filter((m) => m.activo !== false).length,
    [paymentMethods]
  )

  function startNewMethod() {
    resetForm()
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    loadPaymentMethods()
  }, [])

  async function loadPaymentMethods() {
    setLoading(true)
    setError('')

    if (isPreview) {
      setPaymentMethods([])
      setLoading(false)
      return
    }

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
        toast.success('Metodo de pago actualizado correctamente')
      } else {
        await PaymentMethodsService.create({ nombre: payload.nombre })
        toast.success('Metodo de pago creado correctamente')
      }

      resetForm()
      closeModal()
      await loadPaymentMethods()
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar el metodo de pago')
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
  }

  async function handleDelete(paymentMethod) {
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
      toast.error(err.message || 'No se pudo eliminar el metodo de pago')
    }
  }

  async function confirmSimpleDelete() {
    const paymentMethod = modalState.payload?.record
    if (!paymentMethod) return

    setModalState((current) => ({ ...current, loading: true }))

    try {
      await PaymentMethodsService.remove(paymentMethod.id)
      toast.success('Metodo de pago eliminado correctamente')

      if (editingId === paymentMethod.id) {
        resetForm()
      }

      closeModal()
      await loadPaymentMethods()
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar el metodo de pago')
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
      toast.error(err.message || 'No se pudo procesar el metodo de pago')
      closeModal()
    }
  }

  return (
    <>
      <Layout>
        <ModuleHeader
          subtitle="Define los métodos de pago que usas con frecuencia"
          badges={[
            { label: 'Activos', value: String(activosCount), variant: 'success' }
          ]}
          primaryAction={{
            label: 'Nuevo método',
            icon: '+',
            onClick: startNewMethod,
            disabled: isPreview,
            title: isPreview ? 'No disponible en modo vista previa' : undefined
          }}
        />

        {error ? (
          <section className="module-feedback module-feedback--error">
            {error}
          </section>
        ) : null}

        <section className="module-grid">
          <article className="module-card" ref={formRef}>
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
              <TableSkeleton rows={4} columns={3} />
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
