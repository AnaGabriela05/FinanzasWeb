import { useEffect, useState } from 'react'
import Modal from '../../../components/Modal'
import Skeleton from '../../../components/Skeleton'
import { AdminService } from '../../../services/adminService'

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('es-PE')
}

export default function UserDetailModal({ open, userId, onClose }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !userId) return undefined
    setLoading(true)
    setError('')
    setData(null)
    let cancelled = false
    AdminService.getUserMetadata(userId)
      .then((d) => { if (!cancelled) setData(d) })
      .catch((err) => { if (!cancelled) setError(err.message || 'No se pudo cargar') })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, userId])

  return (
    <Modal
      open={open}
      title={data?.nombre ? `Usuario · ${data.nombre}` : 'Detalle de usuario'}
      onClose={onClose}
      footer={
        <button type="button" className="button-secondary" onClick={onClose}>
          Cerrar
        </button>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={18} />)}
        </div>
      ) : error ? (
        <p className="text-red-600 m-0">{error}</p>
      ) : data ? (
        <div className="flex flex-col gap-3 text-sm">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 m-0">
            <dt className="text-slate-500">Nombre</dt>
            <dd className="font-medium text-slate-900 m-0">{data.nombre}</dd>
            <dt className="text-slate-500">Correo</dt>
            <dd className="m-0 break-all">{data.correo}</dd>
            <dt className="text-slate-500">Rol</dt>
            <dd className="m-0">{data.rol}</dd>
            <dt className="text-slate-500">Registro</dt>
            <dd className="m-0">{formatDate(data.fechaRegistro)}</dd>
            <dt className="text-slate-500">Último acceso</dt>
            <dd className="m-0">{formatDate(data.ultimoAcceso)}</dd>
            <dt className="text-slate-500">Estado</dt>
            <dd className="m-0">
              {data.bloqueado ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-xs">
                  🔒 Bloqueado hasta {formatDate(data.lockUntil)}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-xs">
                  ✓ Activo
                </span>
              )}
            </dd>
            <dt className="text-slate-500">Intentos fallidos</dt>
            <dd className="m-0">{data.failedLoginAttempts}</dd>
          </dl>

          <hr className="border-slate-200" />

          <div>
            <h3 className="m-0 mb-2 text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Actividad (solo conteos)
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <CountTile label="Transacciones"   value={data.counts.transactionCount} />
              <CountTile label="Categorías"      value={data.counts.categoryCount} />
              <CountTile label="Métodos de pago" value={data.counts.paymentMethodCount} />
              <CountTile label="Presupuestos"    value={data.counts.budgetCount} />
            </div>
          </div>

          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 m-0">
            🔒 Por privacidad, los datos financieros del usuario (montos, fechas, descripciones) NO son visibles al administrador.
          </p>
        </div>
      ) : null}
    </Modal>
  )
}

function CountTile({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 flex flex-col">
      <span className="text-xs text-slate-500">{label}</span>
      <strong className="text-base text-slate-900">{value}</strong>
    </div>
  )
}
