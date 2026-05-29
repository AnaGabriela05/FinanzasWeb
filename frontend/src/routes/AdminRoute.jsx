import { Navigate } from 'react-router-dom'
import { Auth } from '../lib/auth'

/**
 * Ruta para administradores. Si no esta logueado, manda a /.
 * Si es usuario regular, manda a /dashboard (no puede entrar al panel admin).
 */
export default function AdminRoute({ children }) {
  if (!Auth.isLoggedIn()) return <Navigate to="/" replace />
  const user = Auth.user()
  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}
