import { useCallback, useEffect, useState } from 'react'
import ModuleHeader from '../../components/layout/ModuleHeader'
import AdminTable from '../../components/admin/AdminTable'
import Modal from '../../components/Modal'
import ConfirmModal from '../../components/ConfirmModal'
import { AdminService } from '../../services/adminService'
import { CategoriesService } from '../../services/categories'
import { useToast } from '../../components/Toast'

const emptyForm = { nombre: '', tipo: 'gasto' }

export default function AdminGlobalCategories() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [confirm, setConfirm] = useState({ type: null, item: null, cascade: false, loading: false })

  const load = useCallback(() => {
    setLoading(true)
    CategoriesService.list()
      .then((data) => {
        const list = Array.isArray(data) ? data : []
        setItems(list.filter((c) => c.global))
      })
      .catch((err) => toast.error(err.message || 'No se pudo cargar el catálogo'))
      .finally(() => setLoading(false))
  }, [toast])

  useEffect(() => { load() }, [load])

  function openNew() {
    setEditing(null)
    setForm(emptyForm)
    setEditorOpen(true)
  }
  function openEdit(cat) {
    setEditing(cat)
    setForm({ nombre: cat.nombre || '', tipo: cat.tipo || 'gasto' })
    setEditorOpen(true)
  }
  function closeEditor() {
    if (saving) return
    setEditorOpen(false)
    setEditing(null)
    setForm(emptyForm)
  }

  async function handleSave() {
    const nombre = form.nombre.trim()
    if (!nombre) { toast.error('El nombre es obligatorio'); return }
    setSaving(true)
    try {
      if (editing) {
        await AdminService.updateGlobalCategory(editing.id, { nombre, tipo: form.tipo })
        toast.success('Categoría actualizada')
      } else {
        await AdminService.createGlobalCategory({ nombre, tipo: form.tipo })
        toast.success('Categoría creada')
      }
      setEditorOpen(false)
      setEditing(null)
      setForm(emptyForm)
      load()
    } catch (err) {
      toast.error(err.message || 'No se pudo guardar')
    } finally {
      setSaving(false)
    }
  }

  function openConfirm(type, item) {
    setConfirm({ type, item, cascade: false, loading: false })
  }
  function closeConfirm() { setConfirm({ type: null, item: null, cascade: false, loading: false }) }

  async function execConfirm() {
    const { type, item, cascade } = confirm
    if (!type || !item) return
    setConfirm((c) => ({ ...c, loading: true }))
    try {
      if (type === 'archive') {
        await AdminService.archiveGlobalCategory(item.id)
        toast.success('Categoría archivada')
      } else if (type === 'delete') {
        await AdminService.deleteGlobalCategory(item.id, cascade)
        toast.success(cascade ? 'Categoría y dependencias eliminadas' : 'Categoría eliminada')
      }
      closeConfirm()
      load()
    } catch (err) {
      const msg = err.message || 'No se pudo completar'
      // Si llega "Categoria global en uso", el backend manda 409 con detalles.
      if (/en uso/i.test(msg)) {
        setConfirm((c) => ({ ...c, loading: false, cascade: true }))
        toast.error('Tiene registros asociados. Marca "Eliminar todo" para forzar.')
      } else {
        toast.error(msg)
        closeConfirm()
      }
    }
  }

  const columns = [
    { key: 'nombre', header: 'Nombre', sortable: true },
    { key: 'tipo', header: 'Tipo', render: (c) => (
      <span className={`text-xs px-2 py-0.5 rounded-full ${c.tipo === 'ingreso' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
        {c.tipo}
      </span>
    ) },
    { key: 'activo', header: 'Estado', render: (c) => (
      c.activo
        ? <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Activa</span>
        : <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">Archivada</span>
    ) },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (c) => (
        <div className="inline-flex gap-1 flex-wrap justify-end">
          <button type="button" className="text-xs px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded" onClick={() => openEdit(c)}>
            Editar
          </button>
          {c.activo ? (
            <button type="button" className="text-xs px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded" onClick={() => openConfirm('archive', c)}>
              Archivar
            </button>
          ) : null}
          <button type="button" className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded" onClick={() => openConfirm('delete', c)}>
            Eliminar
          </button>
        </div>
      )
    }
  ]

  return (
    <>
      <ModuleHeader
        title="Categorías globales"
        subtitle="Catálogo compartido por todos los usuarios"
        badges={[{ label: 'Total', value: String(items.length), variant: 'brand' }]}
        primaryAction={{ label: 'Nueva categoría global', icon: '+', onClick: openNew }}
      />

      <AdminTable
        columns={columns}
        rows={items}
        loading={loading}
        emptyMessage="Aún no hay categorías globales. Crea la primera con el botón superior."
        getRowKey={(c) => c.id}
      />

      <Modal
        open={editorOpen}
        title={editing ? 'Editar categoría global' : 'Nueva categoría global'}
        onClose={closeEditor}
        footer={
          <>
            <button className="button-secondary" type="button" onClick={closeEditor} disabled={saving}>
              Cancelar
            </button>
            <button className="button-primary" type="button" onClick={handleSave} disabled={saving}>
              {saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear')}
            </button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700 font-medium">Nombre</span>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej. Educación"
              className="px-3 py-2 border border-slate-300 rounded-lg"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-slate-700 font-medium">Tipo</span>
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg bg-white"
            >
              <option value="gasto">Gasto</option>
              <option value="ingreso">Ingreso</option>
            </select>
          </label>
        </div>
      </Modal>

      <ConfirmModal
        open={!!confirm.type}
        title={confirm.type === 'archive' ? 'Archivar categoría' : 'Eliminar categoría global'}
        description={
          confirm.item
            ? confirm.type === 'archive'
              ? `Se archivará "${confirm.item.nombre}". Los usuarios la dejarán de ver pero su historial queda intacto.`
              : confirm.cascade
                ? `La categoría "${confirm.item.nombre}" tiene transacciones/presupuestos asociados. Al confirmar se ELIMINARÁN también esos registros de los usuarios.`
                : `Se eliminará "${confirm.item.nombre}". Si tiene dependencias se te pedirá confirmar el borrado en cascada.`
            : ''
        }
        confirmLabel={confirm.type === 'archive' ? 'Archivar' : (confirm.cascade ? 'Eliminar TODO' : 'Eliminar')}
        tone={confirm.type === 'delete' ? 'danger' : undefined}
        loading={confirm.loading}
        onConfirm={execConfirm}
        onClose={closeConfirm}
      />
    </>
  )
}
