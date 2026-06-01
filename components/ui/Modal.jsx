"use client";
// Modal — accessible dialog with backdrop blur, focus trap, ESC close,
// and click-outside close.
//
//   const [open, setOpen] = useState(false);
//   <Modal open={open} onClose={() => setOpen(false)} title="Confirm">
//     <p>Are you sure?</p>
//     <Modal.Footer>
//       <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
//       <Button variant="danger" onClick={...}>Delete</Button>
//     </Modal.Footer>
//   </Modal>

import { useEffect, useRef } from "react";

export default function Modal({
  open,
  onClose,
  title,
  size = "md",        // sm / md / lg
  closeOnBackdrop = true,
  hideHeader = false,
  children,
}) {
  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = typeof document !== "undefined" ? document.activeElement : null;
    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose?.();
      } else if (e.key === "Tab") {
        const focusable = dialogRef.current?.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    document.addEventListener("keydown", onKey);
    // Focus first focusable on open
    const t = setTimeout(() => {
      const focusable = dialogRef.current?.querySelector(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 30);
    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      lastFocusedRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  const maxWidth = size === "sm" ? 420 : size === "lg" ? 880 : 620;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
      onMouseDown={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose?.();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9998,
        background: "color-mix(in srgb, var(--gx-overlay) 100%, transparent)",
        backdropFilter: "blur(6px)",
        WebkitBackdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        animation: "gx-fade-in 180ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
      }}
    >
      <div
        ref={dialogRef}
        style={{
          width: "100%",
          maxWidth,
          maxHeight: "calc(100vh - 32px)",
          overflow: "auto",
          background: "var(--gx-surface)",
          borderRadius: "var(--gx-radius-5)",
          boxShadow: "var(--gx-shadow-3)",
          border: "1px solid var(--gx-border)",
          animation: "gx-fade-in 220ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        }}
      >
        {!hideHeader && (
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--gx-border-soft)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}>
            {typeof title === "string" ? (
              <h2 className="gx-h2" style={{ margin: 0 }}>{title}</h2>
            ) : title}
            <button
              type="button"
              onClick={() => onClose?.()}
              aria-label="Kapat"
              style={{
                background: "transparent",
                border: "none",
                color: "var(--gx-ink-muted)",
                fontSize: 22,
                lineHeight: 1,
                cursor: "pointer",
                padding: 4,
              }}
            >
              ×
            </button>
          </div>
        )}
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

Modal.Footer = function ModalFooter({ children, style }) {
  return (
    <div style={{
      display: "flex",
      gap: 8,
      justifyContent: "flex-end",
      paddingTop: 16,
      marginTop: 16,
      borderTop: "1px solid var(--gx-border-soft)",
      ...style,
    }}>
      {children}
    </div>
  );
};
