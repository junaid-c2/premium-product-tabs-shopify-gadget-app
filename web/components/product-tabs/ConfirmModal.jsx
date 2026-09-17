import { useEffect, useRef } from "react";

export function ConfirmModal({
  modalId = "confirm-modal",
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onClose,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (open) {
      modal.showOverlay?.();
    } else {
      modal.hideOverlay?.();
    }
  }, [open]);

  const handleConfirm = () => {
    onConfirm();
    onClose();
    modalRef.current?.hideOverlay?.();
  };

  const handleCancel = () => {
    onClose();
    modalRef.current?.hideOverlay?.();
  };

  return (
    // @ts-expect-error Polaris web component
    <s-modal ref={modalRef} id={modalId} heading={title}>
      <s-text>{message}</s-text>
      {/* @ts-expect-error Polaris web component */}
      <s-button
        slot="primary-action"
        variant="primary"
        tone={destructive ? "critical" : undefined}
        commandFor={modalId}
        command="--hide"
        onClick={handleConfirm}
      >
        {confirmLabel}
      </s-button>
      {/* @ts-expect-error Polaris web component */}
      <s-button
        slot="secondary-actions"
        variant="secondary"
        commandFor={modalId}
        command="--hide"
        onClick={handleCancel}
      >
        {cancelLabel}
      </s-button>
    </s-modal>
  );
}
