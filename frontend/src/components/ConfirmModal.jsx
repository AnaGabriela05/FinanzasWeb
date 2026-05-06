import Modal from './Modal'

export default function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Aceptar',
  cancelLabel = 'Cancelar',
  tone = 'primary',
  loading = false,
  onConfirm,
  onClose
}) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={loading ? undefined : onClose}
      footer={
        <>
          <button className="button-secondary" type="button" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className={tone === 'danger' ? 'button-danger' : 'button-primary'}
            type="button"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Procesando...' : confirmLabel}
          </button>
        </>
      }
    >
      <p className="modal-copy">{description}</p>
    </Modal>
  )
}
