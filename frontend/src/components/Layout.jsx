import { Link, useNavigate } from 'react-router-dom'
import { Auth } from '../lib/auth'

export default function Layout({ children }) {
  const navigate = useNavigate()

  function handleLogout() {
    Auth.logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="topbar__brand">Finanzas</p>
          <p className="topbar__subtitle">Panel React</p>
        </div>

        <nav className="topbar__nav" aria-label="Principal">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/categories">Categorias</Link>
          <Link to="/payment-methods">Metodos de pago</Link>
          <Link to="/transactions">Transacciones</Link>
          <Link to="/budgets">Presupuestos</Link>
          <Link to="/reports">Reportes</Link>
          <button type="button" onClick={handleLogout}>
            Salir
          </button>
        </nav>
      </header>

      <main className="app-content">{children}</main>
    </div>
  )
}
