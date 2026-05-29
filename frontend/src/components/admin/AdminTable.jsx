import { useMemo, useState } from 'react'
import Skeleton from '../Skeleton'

/**
 * Tabla generica reutilizable para el panel admin.
 *
 * Props:
 *  - columns: [{ key, header, render?, sortable?, align? }]
 *  - rows: array
 *  - loading: boolean
 *  - emptyMessage: string
 *  - pagination?: { page, totalPages, onChange }
 *  - getRowKey: (row, idx) => key
 */
export default function AdminTable({
  columns,
  rows = [],
  loading = false,
  emptyMessage = 'No hay datos',
  pagination,
  getRowKey
}) {
  const [sort, setSort] = useState({ key: null, dir: 'asc' })

  const sortedRows = useMemo(() => {
    if (!sort.key) return rows
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortable) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = a?.[sort.key]
      const bv = b?.[sort.key]
      if (av === bv) return 0
      if (av === null || av === undefined) return 1
      if (bv === null || bv === undefined) return -1
      if (av < bv) return sort.dir === 'asc' ? -1 : 1
      return sort.dir === 'asc' ? 1 : -1
    })
    return copy
  }, [rows, sort, columns])

  function toggleSort(key) {
    const col = columns.find((c) => c.key === key)
    if (!col?.sortable) return
    setSort((prev) => {
      if (prev.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return { key: null, dir: 'asc' }
    })
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              {columns.map((col) => {
                const align = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                const isSorted = sort.key === col.key
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 font-semibold uppercase text-xs tracking-wide ${align} ${col.sortable ? 'cursor-pointer select-none hover:text-slate-900' : ''}`}
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortable && isSorted ? (sort.dir === 'asc' ? '▲' : '▼') : null}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={`sk-${i}`} className="border-t border-slate-100">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <Skeleton height={14} width="80%" />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedRows.length === 0 ? (
              <tr className="border-t border-slate-100">
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedRows.map((row, idx) => (
                <tr
                  key={getRowKey ? getRowKey(row, idx) : (row.id ?? idx)}
                  className="border-t border-slate-100 hover:bg-slate-50/60"
                >
                  {columns.map((col) => {
                    const align = col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    return (
                      <td key={col.key} className={`px-4 py-3 align-middle ${align}`}>
                        {col.render ? col.render(row, idx) : row?.[col.key] ?? '—'}
                      </td>
                    )
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/40 text-xs text-slate-600">
          <span>Página {pagination.page} de {pagination.totalPages}</span>
          <div className="flex gap-2">
            <button
              type="button"
              className="px-2 py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-40"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onChange(pagination.page - 1)}
            >
              ← Anterior
            </button>
            <button
              type="button"
              className="px-2 py-1 border border-slate-300 rounded hover:bg-white disabled:opacity-40"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => pagination.onChange(pagination.page + 1)}
            >
              Siguiente →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
