import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../lib/api'
import { Auth } from '../lib/auth'

export default function Login() {
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await API.post('/api/auth/login', { correo, password })
      Auth.saveToken(response.token, response.user)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.message || 'Error al iniciar sesion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel auth-panel--brand">
        <span className="auth-kicker">Finanzas personales</span>
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
          </form>
        </div>
      </div>
    </section>
  )
}
