const TYPE_STYLES = {
  ahorro:      { bg: '#CCFBF1', border: '#0F766E', text: '#134E4A', icon: '💰', label: 'Ahorro' },
  presupuesto: { bg: '#D1FAE5', border: '#16A34A', text: '#14532D', icon: '📊', label: 'Presupuesto' },
  gasto:       { bg: '#FEF3C7', border: '#F59E0B', text: '#78350F', icon: '⚠️', label: 'Gasto' },
  deuda:       { bg: '#FECACA', border: '#DC2626', text: '#7F1D1D', icon: '🔴', label: 'Deuda' }
}

function relativeDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'hoy'
  if (diffDays === 1) return 'hace 1 día'
  if (diffDays < 7) return `hace ${diffDays} días`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return weeks === 1 ? 'hace 1 semana' : `hace ${weeks} semanas`
  }
  const months = Math.floor(diffDays / 30)
  return months === 1 ? 'hace 1 mes' : `hace ${months} meses`
}

export default function AdviceCard({ tipo, contenido, fechaGeneracion, variant = 'default' }) {
  const style = TYPE_STYLES[tipo] || TYPE_STYLES.ahorro
  const isCompact = variant === 'compact'

  return (
    <article
      className={`advice-card advice-card--${variant} advice-card--${tipo}`}
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderLeft: `4px solid ${style.border}`,
        color: style.text,
        borderRadius: 10,
        padding: isCompact ? '12px 14px' : '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: style.border,
            color: '#FFFFFF',
            padding: '3px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase'
          }}
        >
          <span aria-hidden="true">{style.icon}</span>
          {style.label}
        </span>
        {fechaGeneracion ? (
          <time
            dateTime={fechaGeneracion}
            style={{ fontSize: 12, opacity: 0.75 }}
            title={new Date(fechaGeneracion).toLocaleString()}
          >
            {relativeDate(fechaGeneracion)}
          </time>
        ) : null}
      </header>

      <p
        style={{
          margin: 0,
          fontSize: isCompact ? 14 : 15,
          lineHeight: 1.5,
          fontWeight: 500
        }}
      >
        {contenido}
      </p>
    </article>
  )
}
