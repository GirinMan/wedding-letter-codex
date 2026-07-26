import { useEffect, useId, useRef, type PropsWithChildren } from "react";

export function Dialog({
  open,
  title,
  onClose,
  className = "",
  children,
}: PropsWithChildren<{ open: boolean; title: string; onClose: () => void; className?: string }>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      className={`dialog ${className}`}
      ref={dialogRef}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={() => {
        if (open) onClose();
      }}
    >
      <div className="dialog__header">
        <h2 id={titleId}>{title}</h2>
        <button className="icon-button" type="button" onClick={onClose} aria-label="닫기">
          ×
        </button>
      </div>
      <div className="dialog__body">{children}</div>
    </dialog>
  );
}
