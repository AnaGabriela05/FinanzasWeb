import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Auth } from '../lib/auth'

const NAV_ITEMS = [
  { to: '/admin/metrics',    label: 'Métricas',            icon: '📊' },
  { to: '/admin/users',      label: 'Usuarios',            icon: '👥' },
  { to: '/admin/categories', label: 'Categorías globales', icon: '🏷️' },
  { to: '/admin/audit',      label: 'Auditoría',           icon: '📋' }
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const user = Auth.user()

  function handleLogout() {
    Auth.logout()
    navigate('/', { replace: true })
  }

  function isActive(path) {
    if (path === '/admin/metrics') {
      return location.pathname === '/admin' || location.pathname.startsWith('/admin/metrics')
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-teal-700">AhorroGo</span>
          <span className="text-xs uppercase tracking-wider text-slate-400">·</span>
          <span className="text-sm font-semibold text-slate-700">Panel admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-600 hidden sm:inline">
            Hola, <strong>{user?.nombre || 'admin'}</strong>
          </span>
          <button
            type="button"
            onClick={() => navigate('/admin/preview/dashboard')}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg"
          >
            👤 Vista como usuario
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        <aside className="w-60 shrink-0 bg-white border-r border-slate-200 py-4">
          <nav className="flex flex-col gap-1 px-3" aria-label="Panel admin">
            {NAV_ITEMS.map((item) => {
              const active = isActive(item.to)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    active
                      ? 'bg-teal-50 text-teal-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 min-w-0 p-6 overflow-x-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
