import { useEffect, useRef } from 'react';

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  isPending = false,
  destructive = false,
}) {
  const cancelRef = useRef(null);
  const restoreRef = useRef(null);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    restoreRef.current = document.activeElement;
    cancelRef.current?.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape' && !isPending) {
        onClose?.();
        return;
      }

      // Focus trap. `aria-modal` tells a screen reader the rest of the page is
      // inert, but it does nothing for the Tab key: without this, tabbing out
      // of the last button walks into the page behind the overlay while the
      // dialog is still up.
      if (e.key !== 'Tab' || !panelRef.current) return;

      const focusable = panelRef.current.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, isPending, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-t4"
      role="presentation"
      onClick={() => {
        if (!isPending) onClose?.();
      }}
    >
      <div className="absolute inset-0 bg-dial/85" aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="register flyback relative w-full max-w-md p-t5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* A destructive confirmation gets the red edge; the message stays
            lume so it is never a wall of coloured text. */}
        {destructive && <span className="absolute inset-x-0 top-0 h-[3px] bg-hand" aria-hidden />}

        <h2 id="confirm-dialog-title" className="legend text-legend text-lume">
          {title}
        </h2>
        {message && <p className="mt-t3 text-body leading-relaxed text-lume-dim">{message}</p>}

        <div className="mt-t5 flex flex-wrap justify-end gap-t2">
          <button ref={cancelRef} type="button" onClick={onClose} disabled={isPending} className="ctl-ghost">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={destructive ? 'ctl-danger' : 'ctl-primary'}
          >
            {isPending ? 'Working' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
