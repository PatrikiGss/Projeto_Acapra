import "./ui.css";

function ConfirmModal({
  open,
  title = "Confirmar ação",
  message,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  onClose,
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="acapra-confirm-modal" role="presentation" onClick={onClose}>
      <div
        className="acapra-confirm-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="acapra-confirm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="acapra-confirm-modal-title" className="acapra-confirm-modal__title">
          {title}
        </h2>
        <p className="acapra-confirm-modal__message">{message}</p>
        <div className="acapra-confirm-modal__actions">
          <button
            type="button"
            className="acapra-confirm-modal__button acapra-confirm-modal__button--secondary"
            onClick={onClose}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="acapra-confirm-modal__button acapra-confirm-modal__button--primary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
