import { Navigate } from 'react-router-dom'
import { Auth } from '../lib/auth'

/**
 * Ruta para usuarios regulares. Si no esta logueado, manda a /.
 * Si es admin, manda a /admin (SoD: el admin no puede usar la app de usuario).
 */
export default function UserRoute({ children }) {
  if (!Auth.isLoggedIn()) return <Navigate to="/" replace />
  const user = Auth.user()
  if (user?.role === 'admin') return <Navigate to="/admin" replace />
  return children
}
