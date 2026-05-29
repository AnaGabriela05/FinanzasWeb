import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API } from '../lib/api'

export default function Register() {
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    const trimmedNombre = nombre.trim()
    if (!trimmedNombre) {
      setError('El nombre es obligatorio')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await API.post('/api/auth/register', {
        nombre: trimmedNombre,
        correo,
        password
      })
      navigate('/', {
        replace: true,
        state: { message: 'Cuenta creada correctamente. Inicia sesión.' }
      })
    } catch (err) {
      setError(err.message || 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-shell">
      <div className="auth-panel auth-panel--brand">
        <span className="auth-kicker">AhorroGo</span>
        <h1>Crea tu cuenta y empieza a controlar tu dinero.</h1>

        <div className="auth-badges">
          <span>Seguro</span>
          <span>Personalizado</span>
          <span>Rápido</span>
        </div>
      </div>

      <div className="auth-panel auth-panel--form">
        <div className="auth-card">
          <div className="auth-card__header">
            <h2>Crear cuenta</h2>
            <p>Llena tus datos para registrarte.</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Tu nombre"
              autoComplete="name"
              required
            />

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
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
            />

            <label htmlFor="confirmPassword">Confirmar contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repite tu contraseña"
              autoComplete="new-password"
              minLength={6}
              required
            />

            {error ? (
              <div className="auth-alert" role="alert">
                {error}
              </div>
            ) : null}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Registrarme'}
            </button>

            <p className="auth-foot">
              ¿Ya tienes cuenta? <Link to="/">Inicia sesión</Link>
            </p>
          </form>
        </div>
      </div>
    </section>
  )
}
