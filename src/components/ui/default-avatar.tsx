import * as React from "react";

export function DefaultAvatar({ className = "" }: { className?: string }) {
  // Simple SVG avatar (random default)
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} width={32} height={32}>
      <circle cx="16" cy="16" r="16" fill="#e0e7ef" />
      <circle cx="16" cy="13" r="6" fill="#94a3b8" />
      <ellipse cx="16" cy="24" rx="9" ry="5" fill="#cbd5e1" />
    </svg>
  );
}
