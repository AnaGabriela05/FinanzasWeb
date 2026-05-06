export default function Modal({ open, title, children, onClose, footer, size = 'default' }) {
  if (!open) return null

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal-card modal-card--${size}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-card__header">
          <h2>{title}</h2>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
            x
          </button>
        </div>

        <div className="modal-card__body">{children}</div>

        {footer ? <div className="modal-card__footer">{footer}</div> : null}
      </div>
    </div>
  )
}
