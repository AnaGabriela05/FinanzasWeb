import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../Modal'
import Skeleton from '../Skeleton'
import { AdviceService } from '../../services/adviceService'
import AdviceCard from './AdviceCard'

export default function AdviceModal({ open, onClose }) {
  const navigate = useNavigate()
  const [advices, setAdvices] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    setLoading(true)
    setError('')
    setAdvices([])

    AdviceService.getCurrentAdvice()
      .then((data) => {
        if (cancelled) return
        const list = Array.isArray(data?.advices) ? data.advices : (Array.isArray(data) ? data : [])
        setAdvices(list)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'No se pudieron cargar los consejos')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open])

  function goToLearning() {
    onClose?.()
    navigate('/learning?tab=advice')
  }

  return (
    <Modal
      open={open}
      title="Consejos personalizados para ti"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="button-secondary" onClick={onClose}>
            Cerrar
          </button>
          <button type="button" className="button-primary" onClick={goToLearning}>
            Ver todos en Aprendizaje
          </button>
        </>
      }
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height={70} radius={10} />
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <p style={{ color: '#B91C1C', margin: 0 }}>{error}</p>
      ) : null}

      {!loading && !error ? (
        advices.length === 0 ? (
          <p style={{ margin: 0 }}>
            Aun no tenemos consejos para mostrarte. Registra mas movimientos
            para obtener una asesoria personalizada.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {advices.map((advice) => (
              <AdviceCard
                key={advice.id || `${advice.tipo}-${advice.contenido?.slice(0, 24)}`}
                tipo={advice.tipo}
                contenido={advice.contenido}
                fechaGeneracion={advice.fechaGeneracion}
                variant="compact"
              />
            ))}
          </div>
        )
      ) : null}
    </Modal>
  )
}
