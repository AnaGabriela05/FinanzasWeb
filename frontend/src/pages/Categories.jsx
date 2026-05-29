import { useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout'
import ModuleHeader from '../components/layout/ModuleHeader'
import { Auth } from '../lib/auth'
import ConfirmModal from '../components/ConfirmModal'
import DependencyActionModal from '../components/DependencyActionModal'
import { TableSkeleton } from '../components/Skeleton'
import { useToast } from '../components/Toast'
import { CategoriesService } from '../services/categories'
import { usePreviewMode } from '../hooks/usePreviewMode'

const emptyForm = {
  nombre: '',
  tipo: 'gasto',
  global: false
}

export default function Categories() {
  const user = Auth.user()
  const isAdmin = user.role === 'admin'
  const isPreview = usePreviewMode()
  const toast = useToast()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [modalState, setModalState] = useState({ type: null, payload: null, loading: false })
  const formRef = useRef(null)

  const { personalesCount, globalesCount } = useMemo(() => {
    let personales = 0
    let globales = 0
    for (const c of categories) {
      if (c.global) globales += 1
      else personales += 1
    }
    return { personalesCount: personales, globalesCount: globales }
  }, [categories])

  function startNewCategory() {
    resetForm()
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    loadCategories()
  }, [])

  async function loadCategories() {
    setLoading(true)
    setError('')

    try {
      const data = await CategoriesService.list()
      setCategories(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las categorias')
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
        title: editingId ? 'Confirmar cambios en categoria' : 'Confirmar creacion de categoria',
        description: editingId
          ? 'Se guardaran los cambios de esta categoria.'
          : 'Se creara una nueva categoria con los datos ingresados.'
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
      tipo: form.tipo,
      global: isAdmin ? Boolean(form.global) : false
    }

    try {
      if (!payload.nombre) {
        throw new Error('El nombre es obligatorio')
      }

      if (editingId) {
        await CategoriesService.update(editingId, payload)
        toast.success('Categoria actualizada correctamente')
      } else {
        await CategoriesService.create(payload)
        toast.success('Categoria creada correctamente')
      }

      resetForm()
      closeModal()
      await loadCategories()
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar la categoria')
      closeModal()
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(category) {
    setEditingId(category.id)
    setForm({
      nombre: category.nombre || '',
      tipo: category.tipo || 'gasto',
      global: Boolean(category.global)
    })
  }

  async function handleDelete(category) {
    setError('')

    try {
      const stats = await CategoriesService.usage(category.id)
      const hasDependencies = Number(stats.txCount || 0) > 0 || Number(stats.budgetCount || 0) > 0

      if (hasDependencies) {
        setModalState({
          type: 'dependencies',
          payload: { record: category, stats },
          loading: false
        })
        return
      }

      setModalState({
        type: 'delete',
        payload: { record: category },
        loading: false
      })
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar la categoria')
    }
  }

  async function confirmSimpleDelete() {
    const category = modalState.payload?.record
    if (!category) return

    setModalState((current) => ({ ...current, loading: true }))

    try {
      await CategoriesService.remove(category.id)
      toast.success('Categoria eliminada correctamente')

      if (editingId === category.id) {
        resetForm()
      }

      closeModal()
      await loadCategories()
    } catch (err) {
      toast.error(err.message || 'No se pudo eliminar la categoria')
      closeModal()
    }
  }

  async function handleDependencyAction(mode) {
    const category = modalState.payload?.record
    if (!category) return

    setModalState((current) => ({ ...current, loading: true }))

    try {
      const query = mode === 'archive' ? '?archive=1' : '?cascade=1'
      await CategoriesService.remove(category.id, query)
      showFeedback(
        'success',
        mode === 'archive'
          ? 'Categoria archivada correctamente'
          : 'Categoria eliminada junto con sus dependencias'
      )

      if (editingId === category.id) {
        resetForm()
      }

      closeModal()
      await loadCategories()
    } catch (err) {
      toast.error(err.message || 'No se pudo procesar la categoria')
      closeModal()
    }
  }

  return (
    <>
      <Layout>
        <ModuleHeader
          subtitle="Organiza tus ingresos y gastos por categoría"
          badges={[
            { label: 'Personales', value: String(personalesCount), variant: 'default' },
            { label: 'Globales', value: String(globalesCount), variant: 'info' }
          ]}
          primaryAction={{
            label: 'Nueva categoría',
            icon: '+',
            onClick: startNewCategory,
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
              <h2>{editingId ? 'Editar categoria' : 'Nueva categoria'}</h2>
              <p>
                {editingId
                  ? 'Actualiza los datos y guarda los cambios.'
                  : 'Completa el formulario para registrar una categoria.'}
              </p>
            </div>

            <form className="module-form" onSubmit={handleSubmit}>
              <label htmlFor="category-name">Nombre</label>
              <input
                id="category-name"
                type="text"
                value={form.nombre}
                onChange={(event) => updateForm('nombre', event.target.value)}
                placeholder="Ej. Alimentacion"
                required
              />

              <label htmlFor="category-type">Tipo</label>
              <select
                id="category-type"
                value={form.tipo}
                onChange={(event) => updateForm('tipo', event.target.value)}
              >
                <option value="gasto">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>

              {isAdmin ? (
                <label className="module-checkbox">
                  <input
                    type="checkbox"
                    checked={form.global}
                    onChange={(event) => updateForm('global', event.target.checked)}
                  />
                  Marcar como global
                </label>
              ) : null}

              <div className="module-actions">
                <button className="button-primary" type="submit" disabled={saving}>
                  {saving
                    ? 'Guardando...'
                    : editingId
                      ? 'Guardar cambios'
                      : 'Crear categoria'}
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
              <h2>Listado de categorias</h2>
              <p>{categories.length} categorias visibles segun tu sesion actual.</p>
            </div>

            {loading ? (
              <TableSkeleton rows={5} columns={4} />
            ) : categories.length === 0 ? (
              <div className="table-state">
                <p>No hay categorias disponibles todavia.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="module-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Tipo</th>
                      <th>Alcance</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((category) => (
                      <tr key={category.id}>
                        <td>
                          <div className="table-main">
                            <strong>{category.nombre}</strong>
                            {!category.activo ? <span className="table-tag">Inactiva</span> : null}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`type-pill type-pill--${category.tipo === 'ingreso' ? 'income' : 'expense'}`}
                          >
                            {category.tipo}
                          </span>
                        </td>
                        <td>{category.global ? 'Global' : 'Personal'}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="button-secondary"
                              type="button"
                              onClick={() => handleEdit(category)}
                            >
                              Editar
                            </button>
                            <button
                              className="button-danger"
                              type="button"
                              onClick={() => handleDelete(category)}
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
        description={`Se eliminara la categoria "${modalState.payload?.record?.nombre || ''}".`}
        confirmLabel="Eliminar"
        tone="danger"
        loading={modalState.loading}
        onConfirm={confirmSimpleDelete}
        onClose={closeModal}
      />

      <DependencyActionModal
        open={modalState.type === 'dependencies'}
        title="Gestionar categoria con dependencias"
        itemName={modalState.payload?.record?.nombre || ''}
        details={[
          { label: 'Nombre', value: modalState.payload?.record?.nombre || '—' },
          { label: 'Tipo', value: modalState.payload?.record?.tipo || '—' },
          { label: 'Estado', value: modalState.payload?.record?.activo === false ? 'Inactiva' : 'Activa' },
          { label: 'Alcance', value: modalState.payload?.record?.global ? 'Global' : 'Personal' }
        ]}
        dependencies={[
          { label: 'Transacciones asociadas', value: modalState.payload?.stats?.txCount ?? 0 },
          { label: 'Presupuestos asociados', value: modalState.payload?.stats?.budgetCount ?? 0 }
        ]}
        impactNote="Cambiar o eliminar esta categoria tambien impactara indirectamente los reportes que usan esas transacciones y presupuestos."
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
