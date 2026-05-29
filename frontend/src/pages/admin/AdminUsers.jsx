import { useCallback, useEffect, useState } from 'react'
import ModuleHeader from '../../components/layout/ModuleHeader'
import AdminTable from '../../components/admin/AdminTable'
import ConfirmModal from '../../components/ConfirmModal'
import UserDetailModal from './components/UserDetailModal'
import { AdminService } from '../../services/adminService'
import { useToast } from '../../components/Toast'

const PAGE_SIZE = 25

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusChip({ user }) {
  if (user.bloqueado) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs">🔒 Bloqueado</span>
  }
  if ((user.failedLoginAttempts || 0) > 0) {
    return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">⚠️ {user.failedLoginAttempts} fallidos</span>
  }
  return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">✓ Activo</span>
}

export default function AdminUsers() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [detailUserId, setDetailUserId] = useState(null)
  const [confirm, setConfirm] = useState({ type: null, user: null, loading: false })

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(() => {
    setLoading(true)
    AdminService.listUsers({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: search.trim() || undefined,
      status: status === 'all' ? undefined : status
    })
      .then((data) => {
        setItems(Array.isArray(data?.items) ? data.items : [])
        setTotal(Number(data?.total) || 0)
      })
      .catch((err) => toast.error(err.message || 'No se pudo cargar la lista'))
      .finally(() => setLoading(false))
  }, [page, search, status, toast])

  useEffect(() => { load() }, [load])

  function openConfirm(type, user) { setConfirm({ type, user, loading: false }) }
  function closeConfirm() { setConfirm({ type: null, user: null, loading: false }) }

  async function execConfirm() {
    const { type, user } = confirm
    if (!type || !user) return
    setConfirm((c) => ({ ...c, loading: true }))
    try {
      if (type === 'lock') {
        await AdminService.lockUser(user.id, 30)
        toast.success(`${user.correo} bloqueado por 30 minutos`)
      } else if (type === 'unlock') {
        await AdminService.unlockUser(user.id)
        toast.success(`${user.correo} desbloqueado`)
      } else if (type === 'reset') {
        await AdminService.resetFailedAttempts(user.id)
        toast.success(`Contador de intentos reseteado para ${user.correo}`)
      }
      closeConfirm()
      load()
    } catch (err) {
      toast.error(err.message || 'No se pudo completar la acción')
      closeConfirm()
    }
  }

  const columns = [
    { key: 'nombre', header: 'Nombre', sortable: true },
    { key: 'correo', header: 'Correo', sortable: true, render: (u) => <span className="break-all">{u.correo}</span> },
    { key: 'roleName', header: 'Rol', render: (u) => <span className="text-xs uppercase">{u.roleName}</span> },
    { key: 'createdAt', header: 'Registro', sortable: true, render: (u) => formatDate(u.createdAt) },
    { key: 'updatedAt', header: 'Última actividad', sortable: true, render: (u) => formatDate(u.updatedAt) },
    { key: 'estado', header: 'Estado', render: (u) => <StatusChip user={u} /> },
    { key: 'transactionCount', header: '# Transacciones', align: 'right', sortable: true },
    {
      key: 'actions',
      header: 'Acciones',
      align: 'right',
      render: (u) => (
        <div className="inline-flex gap-1 flex-wrap justify-end">
          <button type="button" className="text-xs px-2 py-1 bg-white border border-slate-300 hover:bg-slate-50 rounded" onClick={() => setDetailUserId(u.id)}>
            Detalle
          </button>
          {u.bloqueado ? (
            <button type="button" className="text-xs px-2 py-1 bg-teal-700 hover:bg-teal-800 text-white rounded" onClick={() => openConfirm('unlock', u)}>
              Desbloquear
            </button>
          ) : (
            <button type="button" className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded" onClick={() => openConfirm('lock', u)}>
              Bloquear
            </button>
          )}
          {(u.failedLoginAttempts || 0) > 0 ? (
            <button type="button" className="text-xs px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded" onClick={() => openConfirm('reset', u)}>
              Reset intentos
            </button>
          ) : null}
        </div>
      )
    }
  ]

  return (
    <>
      <ModuleHeader
        title="Usuarios"
        subtitle="Gestión de cuentas de usuario (los admins no aparecen aquí)"
        badges={[
          { label: 'Total', value: String(total), variant: 'brand' }
        ]}
      />

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <input
          type="search"
          placeholder="Buscar por correo o nombre"
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value) }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-64 max-w-full"
        />
        <select
          value={status}
          onChange={(e) => { setPage(1); setStatus(e.target.value) }}
          className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
        >
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="locked">Bloqueados</option>
        </select>
      </div>

      <AdminTable
        columns={columns}
        rows={items}
        loading={loading}
        emptyMessage="No hay usuarios que coincidan."
        getRowKey={(u) => u.id}
        pagination={totalPages > 1 ? { page, totalPages, onChange: setPage } : null}
      />

      <UserDetailModal
        open={!!detailUserId}
        userId={detailUserId}
        onClose={() => setDetailUserId(null)}
      />

      <ConfirmModal
        open={!!confirm.type}
        title={
          confirm.type === 'lock' ? 'Bloquear usuario'
          : confirm.type === 'unlock' ? 'Desbloquear usuario'
          : confirm.type === 'reset' ? 'Resetear intentos fallidos'
          : 'Confirmar'
        }
        description={
          confirm.user
            ? confirm.type === 'lock'
              ? `Se bloqueará "${confirm.user.correo}" por 30 minutos.`
              : confirm.type === 'unlock'
                ? `Se desbloqueará "${confirm.user.correo}" inmediatamente.`
                : `Se reseteará el contador de intentos fallidos de "${confirm.user.correo}".`
            : ''
        }
        confirmLabel={
          confirm.type === 'lock' ? 'Bloquear'
          : confirm.type === 'unlock' ? 'Desbloquear'
          : 'Resetear'
        }
        tone={confirm.type === 'lock' ? 'danger' : undefined}
        loading={confirm.loading}
        onConfirm={execConfirm}
        onClose={closeConfirm}
      />
    </>
  )
}
