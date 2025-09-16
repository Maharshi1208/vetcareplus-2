import React from "react";

export default function LogoMark({ size = 40, letter = "v" }: { size?: number; letter?: string }) {
  const s = `${size}px`;
  return (
    <svg width={s} height={s} viewBox="0 0 48 48" role="img" aria-label="VetCare+ logo">
      <defs>
        <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />   {/* sky-500 */}
          <stop offset="100%" stopColor="#10b981" /> {/* emerald-500 */}
        </linearGradient>
        <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
        </filter>
      </defs>

      <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#vg)" filter="url(#softShadow)" />
      <text
        x="24"
        y="24"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#fff"
        fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif"
        fontSize="18"
        fontWeight="700"
      >
        {letter}
      </text>
    </svg>
  );
}
