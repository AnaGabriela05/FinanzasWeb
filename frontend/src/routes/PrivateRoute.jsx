import { Navigate } from 'react-router-dom'
import { Auth } from '../lib/auth'

export default function PrivateRoute({ children }) {
  return Auth.isLoggedIn() ? children : <Navigate to="/" replace />
}