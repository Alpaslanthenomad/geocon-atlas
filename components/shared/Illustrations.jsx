"use client";
// Inline SVG illustrations — line art, monochrome, uses currentColor so
// the host EmptyState/Hero can tint them. Drop into <EmptyState
// illustration={<EmptyAtlas />} /> or any place that needs a small
// editorial mark instead of a single-emoji glyph.

const baseProps = {
  width: 96,
  height: 96,
  viewBox: "0 0 96 96",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

export function EmptyAtlas({ size = 96, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} {...rest}>
      <circle cx="48" cy="48" r="28" />
      <path d="M48 20v56M20 48h56" opacity="0.5" />
      <path d="M48 20c-9 7-12 18-12 28s3 21 12 28M48 20c9 7 12 18 12 28s-3 21-12 28" opacity="0.5" />
      <circle cx="32" cy="38" r="1.4" fill="currentColor" />
      <circle cx="64" cy="58" r="1.4" fill="currentColor" />
      <circle cx="56" cy="32" r="1.4" fill="currentColor" />
      <path d="M76 22l3 3M82 18l-2 2M78 14l3-1" opacity="0.7" />
    </svg>
  );
}

export function EmptyInbox({ size = 96, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} {...rest}>
      <rect x="18" y="36" width="60" height="40" rx="4" />
      <path d="M18 50l20 12h20l20-12" />
      <path d="M28 30l10-10h20l10 10v6" />
      <path d="M40 30h16" />
    </svg>
  );
}

export function EmptyGarden({ size = 96, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} {...rest}>
      <path d="M30 78h36" />
      <path d="M48 78V44" />
      <path d="M48 44c0-8 6-14 14-14-2 8-7 14-14 14z" />
      <path d="M48 50c0-6-5-12-12-12 1 8 6 12 12 12z" />
      <ellipse cx="48" cy="78" rx="18" ry="3" opacity="0.5" />
    </svg>
  );
}

export function EmptyShelf({ size = 96, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} {...rest}>
      <path d="M14 32h68M14 64h68" />
      <rect x="18" y="20" width="8" height="12" />
      <rect x="28" y="16" width="8" height="16" />
      <rect x="38" y="22" width="8" height="10" />
      <rect x="50" y="18" width="6" height="14" />
      <rect x="58" y="20" width="10" height="12" />
      <rect x="22" y="50" width="10" height="14" />
      <rect x="34" y="46" width="8" height="18" />
      <rect x="44" y="52" width="8" height="12" />
      <rect x="54" y="48" width="6" height="16" />
      <rect x="62" y="50" width="8" height="14" />
    </svg>
  );
}

export function EmptyFlask({ size = 96, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} {...rest}>
      <path d="M40 16h16" />
      <path d="M42 16v18l-12 24c-2 6 2 12 8 12h36c6 0 10-6 8-12L54 34V16" />
      <path d="M34 56h28" opacity="0.5" />
      <circle cx="44" cy="62" r="2" fill="currentColor" />
      <circle cx="52" cy="66" r="1.5" fill="currentColor" />
      <circle cx="48" cy="58" r="1" fill="currentColor" />
    </svg>
  );
}

export function EmptyNetwork({ size = 96, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} {...rest}>
      <circle cx="48" cy="24" r="5" />
      <circle cx="22" cy="56" r="5" />
      <circle cx="48" cy="72" r="5" />
      <circle cx="74" cy="56" r="5" />
      <circle cx="32" cy="36" r="3" />
      <circle cx="64" cy="36" r="3" />
      <path d="M48 29v38M27 56h42M44 28l-18 24M52 28l18 24M34 38L42 70M62 38L54 70" opacity="0.5" />
    </svg>
  );
}

export function EmptyTrophy({ size = 96, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} {...rest}>
      <path d="M34 20h28v18a14 14 0 01-28 0V20z" />
      <path d="M34 24h-8a6 6 0 006 8M62 24h8a6 6 0 01-6 8" />
      <path d="M48 52v8M40 72h16M42 60h12v12H42z" />
      <path d="M44 32l3 3 8-8" opacity="0.7" />
    </svg>
  );
}

export function EmptyOffline({ size = 96, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} {...rest}>
      <path d="M18 38c8-8 18-12 30-12 4 0 8 0.5 12 1.5" />
      <path d="M16 26l64 64" />
      <path d="M26 50c4-4 9-7 15-8" />
      <path d="M34 60c2-2 5-3 8-3" />
      <circle cx="48" cy="72" r="2" fill="currentColor" />
    </svg>
  );
}

export function NotFound404({ size = 140, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} viewBox="0 0 140 96" {...rest}>
      <text x="70" y="60" fontSize="36" fontWeight="700" textAnchor="middle"
        fontFamily="Crimson Pro, Georgia, serif" fill="currentColor" stroke="none">404</text>
      <path d="M30 78c14-3 26-3 40-3s26 0 40 3" opacity="0.6" />
      <circle cx="44" cy="32" r="2" fill="currentColor" />
      <circle cx="96" cy="28" r="1.5" fill="currentColor" />
      <circle cx="110" cy="40" r="1.2" fill="currentColor" />
      <circle cx="26" cy="22" r="1.2" fill="currentColor" />
    </svg>
  );
}

export function ServerError500({ size = 140, ...rest }) {
  return (
    <svg {...baseProps} width={size} height={size} viewBox="0 0 140 96" {...rest}>
      <text x="70" y="60" fontSize="36" fontWeight="700" textAnchor="middle"
        fontFamily="Crimson Pro, Georgia, serif" fill="currentColor" stroke="none">500</text>
      <path d="M32 78l8-8 6 6 8-10 10 8 8-6 6 8 8-4 6 6" opacity="0.6" />
    </svg>
  );
}

// Default registry — pass a key to <EmptyState illustrationKey="atlas" />.
export const ILLUSTRATIONS = {
  atlas:    EmptyAtlas,
  inbox:    EmptyInbox,
  garden:   EmptyGarden,
  shelf:    EmptyShelf,
  flask:    EmptyFlask,
  network:  EmptyNetwork,
  trophy:   EmptyTrophy,
  offline:  EmptyOffline,
  "404":    NotFound404,
  "500":    ServerError500,
};
