import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

const DEFAULT_DURATION = 4000

function ToastItem({ toast, onDismiss }) {
  const [closing, setClosing] = useState(false)

  function handleClose() {
    if (closing) return
    setClosing(true)
    setTimeout(() => onDismiss(toast.id), 200)
  }

  return (
    <div
      className={`toast toast--${toast.type} ${closing ? 'toast--closing' : ''}`}
      role={toast.type === 'error' ? 'alert' : 'status'}
    >
      <div className="toast__body">{toast.message}</div>
      <button
        type="button"
        className="toast__close"
        onClick={handleClose}
        aria-label="Cerrar notificacion"
      >
        ×
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timersRef = useRef(new Map())

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id))
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
  }, [])

  const show = useCallback(
    (message, type = 'info', duration = DEFAULT_DURATION) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      setToasts((current) => [...current, { id, message, type }])

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismiss]
  )

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const api = useMemo(
    () => ({
      success: (message, options = {}) => show(message, 'success', options.duration),
      error: (message, options = {}) => show(message, 'error', options.duration ?? 6000),
      info: (message, options = {}) => show(message, 'info', options.duration),
      dismiss
    }),
    [show, dismiss]
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>')
  }
  return ctx
}
