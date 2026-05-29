import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
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

  function isActive(path) {
    return location.pathname === path
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
          className={`topbar__nav ${navOpen ? 'topbar__nav--open' : ''}`}
          aria-label="Principal"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={isActive(link.matchPath) ? 'topbar__nav-link topbar__nav-link--active' : 'topbar__nav-link'}
            >
              {link.label}
            </Link>
          ))}
          <button type="button" className="topbar__nav-logout" onClick={handleLogout}>
            {isPreview ? 'Volver al panel' : 'Salir'}
          </button>
        </nav>
      </header>

      <main className="app-content">{children}</main>
    </div>
  )
}
