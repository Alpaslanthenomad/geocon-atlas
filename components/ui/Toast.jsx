"use client";
// Toast notification system.
//
// Usage:
//   // 1. Mount <ToastProvider /> once at the root (already done in app/layout.js)
//   // 2. Get the helpers anywhere with the hook:
//
//   const toast = useToast();
//   toast.success("Saved");
//   toast.error("Couldn't save", { detail: "RLS denied", duration: 6000 });
//   toast.info("Importing 47 works…");
//   toast.warning("Profile incomplete");
//
// Auto-dismiss after `duration` ms (default 4500). Click to dismiss.

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);

const TONE_STYLES = {
  success: { bg: "var(--gx-success-soft)",  fg: "var(--gx-success)",  border: "var(--gx-success)",  icon: "✓"  },
  error:   { bg: "var(--gx-danger-soft)",   fg: "var(--gx-danger)",   border: "var(--gx-danger)",   icon: "✕"  },
  warning: { bg: "var(--gx-warning-soft)",  fg: "var(--gx-warning)",  border: "var(--gx-warning)",  icon: "⚠"  },
  info:    { bg: "var(--gx-info-soft)",     fg: "var(--gx-info)",     border: "var(--gx-info)",     icon: "ℹ"  },
  neutral: { bg: "var(--gx-surface-2)",     fg: "var(--gx-ink)",      border: "var(--gx-border)",   icon: "·"  },
};

let _idSeq = 0;

export function ToastProvider({ children, max = 5 }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((arr) => arr.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((tone, message, opts = {}) => {
    const id = ++_idSeq;
    const duration = opts.duration ?? (tone === "error" ? 7000 : 4500);
    setToasts((arr) => {
      const next = [...arr, { id, tone, message, detail: opts.detail, action: opts.action, createdAt: Date.now() }];
      // Drop oldest if over cap
      return next.length > max ? next.slice(next.length - max) : next;
    });
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
    return id;
  }, [dismiss, max]);

  const api = {
    success: (m, o) => push("success", m, o),
    error:   (m, o) => push("error",   m, o),
    warning: (m, o) => push("warning", m, o),
    info:    (m, o) => push("info",    m, o),
    show:    (m, o) => push(o?.tone || "neutral", m, o),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Allow callers outside a provider to still try without crashing.
    return {
      success: () => {}, error: () => {}, warning: () => {}, info: () => {},
      show: () => {}, dismiss: () => {},
    };
  }
  return ctx;
}

function ToastViewport({ toasts, dismiss }) {
  // v5.1-e — Mobile (≤480px): bottom-center within thumb zone.
  // Desktop: bottom-right corner. CSS media query via @media in className
  // would require global styles; the inline override below uses CSS env()
  // for safe-area-inset to clear iOS home indicator. Centering on small
  // viewports done by inline media-query injection at runtime — simplest
  // is two classes via a style tag.
  return (
    <>
      <style jsx>{`
        @media (max-width: 480px) {
          .gx-toast-viewport {
            right: 0 !important;
            left: 0 !important;
            margin: 0 auto !important;
            align-items: center !important;
          }
        }
      `}</style>
      <div
        className="gx-toast-viewport"
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "fixed",
          right: 16,
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 16px)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 8,
          pointerEvents: "none",
          maxWidth: "min(420px, calc(100vw - 32px))",
        }}
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </>
  );
}

function ToastCard({ toast, onDismiss }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) {
      // Trigger gx-rise via class addition once mounted
      ref.current.classList.add("gx-rise");
    }
  }, []);

  const styles = TONE_STYLES[toast.tone] || TONE_STYLES.neutral;
  return (
    <div
      ref={ref}
      role="status"
      onClick={onDismiss}
      style={{
        pointerEvents: "auto",
        cursor: "pointer",
        background: "var(--gx-surface)",
        border: `1px solid ${styles.border}`,
        borderLeft: `4px solid ${styles.fg}`,
        borderRadius: "var(--gx-radius-3)",
        padding: "12px 16px",
        boxShadow: "var(--gx-shadow-2)",
        display: "flex",
        alignItems: "flex-start",
        gap: 12,
      }}
    >
      <div style={{
        flexShrink: 0,
        width: 22, height: 22, borderRadius: "50%",
        background: styles.bg, color: styles.fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 700, marginTop: 1,
      }}>
        {styles.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "var(--gx-font-body)",
          fontSize: 13, fontWeight: 600, lineHeight: 1.4,
          color: "var(--gx-ink)",
        }}>
          {toast.message}
        </div>
        {toast.detail && (
          <div style={{
            fontSize: 11, color: "var(--gx-ink-muted)",
            marginTop: 3, lineHeight: 1.5,
            whiteSpace: "pre-wrap",
          }}>
            {toast.detail}
          </div>
        )}
        {toast.action && (
          <button
            onClick={(e) => { e.stopPropagation(); toast.action.onClick?.(); onDismiss(); }}
            style={{
              marginTop: 8,
              fontSize: 11, fontWeight: 700,
              color: styles.fg,
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
