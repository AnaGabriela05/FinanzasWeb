import { useEffect, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Auth } from '../lib/auth'
import { usePreviewMode } from '../hooks/usePreviewMode'

const NAV_BASE = [
  { path: '/dashboard',       label: 'Dashboard' },
  { path: '/categories',      label: 'Categorias' },
  { path: '/payment-methods', label: 'Metodos de pago' },
  { path: '/transactions',    label: 'Transacciones' },
  { path: '/budgets',         label: 'Presupuestos' },
  { path: '/reports',         label: 'Reportes' },
  { path: '/learning',        label: 'Aprendizaje' }
]

export default function Layout({ children }) {
  const isPreview = usePreviewMode()
  // En preview, todos los enlaces internos llevan a /admin/preview/<path>.
  const NAV_LINKS = NAV_BASE.map((item) => ({
    to: isPreview ? `/admin/preview${item.path}` : item.path,
    matchPath: isPreview ? `/admin/preview${item.path}` : item.path,
    label: item.label
  }))
  const navigate = useNavigate()
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!navOpen) return
    function handleKey(event) {
      if (event.key === 'Escape') setNavOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [navOpen])

  function handleLogout() {
    if (isPreview) {
      navigate('/admin', { replace: true })
      return
    }
    Auth.logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar__brand-wrap">
          <p className="topbar__brand">AhorroGo</p>
          <p className="topbar__subtitle">Tus finanzas, en orden</p>
        </div>

        <button
          type="button"
          className="topbar__toggle"
          aria-label={navOpen ? 'Cerrar menu' : 'Abrir menu'}
          aria-expanded={navOpen}
          aria-controls="primary-nav"
          onClick={() => setNavOpen((open) => !open)}
        >
          {navOpen ? (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6L18 18M6 18L18 6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        <nav
          id="primary-nav"
          className={`topbar__nav flex items-center gap-6 max-[900px]:gap-3 ${navOpen ? 'topbar__nav--open' : ''}`}
          aria-label="Principal"
        >
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end
              className={({ isActive }) =>
                isActive
                  ? 'text-sm text-teal-700 font-medium border-b-2 border-teal-700 pb-1'
                  : 'text-sm text-slate-600 hover:text-slate-900 border-b-2 border-transparent pb-1 transition-colors'
              }
            >
              {link.label}
            </NavLink>
          ))}
          <span
            aria-hidden="true"
            className="h-5 w-px bg-slate-200 self-center mx-1 max-[900px]:hidden"
          />
          <button
            type="button"
            className="text-sm text-red-600 hover:text-red-700 font-medium transition-colors ml-2 max-[900px]:ml-0"
            onClick={handleLogout}
          >
            {isPreview ? 'Volver al panel' : 'Salir'}
          </button>
        </nav>
      </header>

      <main className="app-content">{children}</main>
    </div>
  )
}
