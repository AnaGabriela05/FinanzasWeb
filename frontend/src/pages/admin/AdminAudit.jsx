import { useCallback, useEffect, useState } from 'react'
import ModuleHeader from '../../components/layout/ModuleHeader'
import AdminTable from '../../components/admin/AdminTable'
import { AdminService } from '../../services/adminService'
import { useToast } from '../../components/Toast'

const PAGE_SIZE = 30

function fmtDateTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-PE')
}

export default function AdminAudit() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [formato, setFormato] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const load = useCallback(() => {
    setLoading(true)
    AdminService.getExportLogs({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      formato: formato || undefined,
      userSearch: userSearch.trim() || undefined,
      from: from || undefined,
      to: to || undefined
    })
      .then((data) => {
        setItems(Array.isArray(data?.items) ? data.items : [])
        setTotal(Number(data?.total) || 0)
      })
      .catch((err) => toast.error(err.message || 'No se pudo cargar la auditoría'))
      .finally(() => setLoading(false))
  }, [page, formato, userSearch, from, to, toast])

  useEffect(() => { load() }, [load])

  const columns = [
    { key: 'createdAt', header: 'Fecha/Hora', sortable: true, render: (r) => fmtDateTime(r.createdAt) },
    { key: 'user', header: 'Usuario', render: (r) => r.user ? (
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-900">{r.user.nombre}</span>
        <span className="text-xs text-slate-500 break-all">{r.user.correo}</span>
      </div>
    ) : <span className="text-slate-400">Usuario eliminado</span> },
    { key: 'formato', header: 'Formato', render: (r) => (
      <span className={`text-xs px-2 py-0.5 rounded-full uppercase ${r.formato === 'pdf' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
        {r.formato}
      </span>
    )},
    { key: 'rango', header: 'Período exportado', render: (r) => `${r.desde || '—'} → ${r.hasta || '—'}` },
    { key: 'transactionType', header: 'Tipo', render: (r) => r.transactionType || '—' },
    { key: 'nombreArchivo', header: 'Archivo', render: (r) => <span className="break-all text-xs">{r.nombreArchivo}</span> }
  ]

  return (
    <>
      <ModuleHeader
        title="Auditoría · Exportaciones"
        subtitle="Registro de reportes exportados por los usuarios"
        badges={[{ label: 'Total', value: String(total), variant: 'brand' }]}
      />

      <div className="flex flex-wrap items-end gap-2 mb-4">
        <label className="flex flex-col text-xs text-slate-600">
          <span>Buscar usuario</span>
          <input
            type="search"
            value={userSearch}
            onChange={(e) => { setPage(1); setUserSearch(e.target.value) }}
            placeholder="correo o nombre"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm w-56"
          />
        </label>
        <label className="flex flex-col text-xs text-slate-600">
          <span>Formato</span>
          <select
            value={formato}
            onChange={(e) => { setPage(1); setFormato(e.target.value) }}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
          >
            <option value="">Todos</option>
            <option value="pdf">PDF</option>
            <option value="xlsx">Excel</option>
          </select>
        </label>
        <label className="flex flex-col text-xs text-slate-600">
          <span>Desde</span>
          <input type="date" value={from} onChange={(e) => { setPage(1); setFrom(e.target.value) }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </label>
        <label className="flex flex-col text-xs text-slate-600">
          <span>Hasta</span>
          <input type="date" value={to} onChange={(e) => { setPage(1); setTo(e.target.value) }} className="px-3 py-2 border border-slate-300 rounded-lg text-sm" />
        </label>
      </div>

      <AdminTable
        columns={columns}
        rows={items}
        loading={loading}
        emptyMessage="No hay exportaciones registradas todavía."
        getRowKey={(r) => r.id}
        pagination={totalPages > 1 ? { page, totalPages, onChange: setPage } : null}
      />
    </>
  )
}
