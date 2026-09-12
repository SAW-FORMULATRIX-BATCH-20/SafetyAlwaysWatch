import { useEffect, useRef } from "react";

export function AccessibleDialog({
  children,
  label,
  onDismiss,
}: {
  children: React.ReactNode;
  label: string;
  onDismiss: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const initialFocus = dialogRef.current?.querySelector<HTMLElement>("[data-dialog-initial-focus], button, [href], input, select, textarea");
    initialFocus?.focus();
    return () => previousFocusRef.current?.focus();
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onDismiss();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])") ?? [])];
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  return <section aria-label={label} aria-modal="true" className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-5" onKeyDown={handleKeyDown} ref={dialogRef} role="dialog">{children}</section>;
}
