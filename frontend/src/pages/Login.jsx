import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { API } from '../lib/api'
import { Auth } from '../lib/auth'
import { useToast } from '../components/Toast'

export default function Login() {
  const toast = useToast()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const noticeShownRef = useRef(false)

  useEffect(() => {
    if (location.state?.message && !noticeShownRef.current) {
      toast.success(location.state.message)
      noticeShownRef.current = true
      // Limpia el state para que no reaparezca al volver atras
      window.history.replaceState({}, '')
    }
  }, [location.state, toast])

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await API.post('/api/auth/login', { correo, password })
      Auth.saveToken(response.token, response.user)
      const target = response.user?.role === 'admin' ? '/admin' : '/dashboard'
      navigate(target, { replace: true })
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel auth-panel--brand">
        <span className="auth-kicker">AhorroGo</span>
        <h1>Ingresa y toma el control de tu dinero.</h1>
        
        <div className="auth-badges">
          <span>Transacciones</span>
          <span>Presupuestos</span>
          <span>Reportes</span>
        </div>
      </div>

      <div className="auth-panel auth-panel--form">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>Iniciar sesion</h2>
            <p>Usa tu correo y tu contraseña.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="correo">Correo</label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="tucorreo@ejemplo.com"
              autoComplete="email"
              required
            />

            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              required
            />

            {error ? (
              <div className="auth-alert" role="alert">
                {error}
              </div>
            ) : null}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Ingresando...' : 'Entrar'}
            </button>

            <p className="auth-foot">
              ¿No tienes cuenta? <Link to="/register">Crear una</Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
