import Modal from './Modal'

export default function DependencyActionModal({
  open,
  title,
  itemName,
  details = [],
  dependencies = [],
  impactNote,
  loading = false,
  archiveEnabled = true,
  archiveLabel = 'Archivar',
  cascadeLabel = 'Eliminar TODO',
  onArchive,
  onCascade,
  onClose
}) {
  return (
    <Modal
      open={open}
      title={title}
      size="wide"
      onClose={loading ? undefined : onClose}
      footer={
        <>
          <button className="button-secondary" type="button" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          {archiveEnabled ? (
            <button className="button-secondary" type="button" onClick={onArchive} disabled={loading}>
              {loading ? 'Procesando...' : archiveLabel}
            </button>
          ) : null}
          <button className="button-danger" type="button" onClick={onCascade} disabled={loading}>
            {loading ? 'Procesando...' : cascadeLabel}
          </button>
        </>
      }
    >
      <div className="dependency-modal">
        <p className="modal-copy">
          El registro <strong>{itemName}</strong> tiene dependencias asociadas. Elige como quieres gestionarlo.
        </p>

        {details.length ? (
          <div className="dependency-grid">
            {details.map((detail) => (
              <article key={detail.label} className="dependency-card">
                <span>{detail.label}</span>
                <strong>{detail.value}</strong>
              </article>
            ))}
          </div>
        ) : null}

        {dependencies.length ? (
          <div className="dependency-list">
            {dependencies.map((dependency) => (
              <article key={dependency.label} className="dependency-list__item">
                <span>{dependency.label}</span>
                <strong>{dependency.value}</strong>
              </article>
            ))}
          </div>
        ) : null}

        {impactNote ? <p className="dependency-note">{impactNote}</p> : null}
      </div>
    </Modal>
  )
}
