/**
 * SVG illustrations for empty states.
 * Intentionally minimalist — use currentColor so they pick up text tokens,
 * with accents hard-coded for visual rhythm.
 */

export function NoDataIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="4" y="16" width="112" height="56" rx="6" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" />
      <rect x="14" y="26" width="28" height="40" rx="2" fill="var(--surface-subtle)" />
      <rect x="46" y="34" width="28" height="32" rx="2" fill="var(--surface-subtle)" />
      <rect x="78" y="40" width="28" height="26" rx="2" fill="var(--surface-subtle)" />
      <circle cx="90" cy="22" r="10" fill="var(--surface)" stroke="var(--ink-subtle)" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="97" y1="29" x2="102" y2="34" stroke="var(--ink-subtle)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function DisconnectedIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="12" y="28" width="44" height="24" rx="4" fill="var(--surface-subtle)" stroke="var(--line)" strokeWidth="1.5" />
      <rect x="64" y="28" width="44" height="24" rx="4" fill="var(--surface-subtle)" stroke="var(--line)" strokeWidth="1.5" />
      <line x1="56" y1="40" x2="64" y2="40" stroke="var(--ink-subtle)" strokeWidth="1.5" strokeDasharray="2 2" />
      <circle cx="60" cy="40" r="3" fill="var(--danger)" />
      <path d="M30 40h8M80 40h8" stroke="var(--ink-subtle)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ComingSoonIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect x="8" y="18" width="104" height="48" rx="6" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="60" cy="42" r="14" fill="var(--surface-subtle)" stroke="var(--line-subtle)" strokeWidth="1.5" />
      <path d="M60 34v8l5 3" stroke="var(--ink-subtle)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SuccessIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <circle cx="60" cy="40" r="28" fill="var(--surface-subtle)" stroke="var(--line)" strokeWidth="1.5" />
      <path d="M48 40l8 8 16-16" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
