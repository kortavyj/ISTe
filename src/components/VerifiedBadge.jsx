import "./VerifiedBadge.css";

export default function VerifiedBadge({ size = 20, className = "" }) {
  return (
    <span
      className={`iste-verified-badge ${className}`.trim()}
      role="img"
      aria-label="Верифікований профіль ISTe"
      title="Верифікований профіль ISTe"
      style={{ "--verified-size": `${size}px` }}
    >
      <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
        <path
          className="iste-verified-badge-shape"
          d="M16 2.25c1.5 0 2.77 1.59 4.13 2.03 1.42.47 3.41-.1 4.55.72 1.15.83 1.09 2.9 1.92 4.05.83 1.16 2.91 1.38 4.07 2.79 1.17 1.4.53 3.39.53 4.82 0 1.44.64 3.42-.53 4.82-1.16 1.41-3.24 1.64-4.07 2.8-.83 1.14-.77 3.21-1.92 4.04-1.14.83-3.13.25-4.55.72-1.36.45-2.63 2.04-4.13 2.04s-2.77-1.59-4.13-2.04c-1.42-.47-3.41.11-4.55-.72-1.15-.83-1.09-2.9-1.92-4.05-.83-1.15-2.91-1.38-4.07-2.79-1.17-1.4-.53-3.39-.53-4.82 0-1.44-.64-3.42.53-4.82 1.16-1.41 3.24-1.63 4.07-2.79.83-1.15.77-3.22 1.92-4.05 1.14-.82 3.13-.25 4.55-.72C13.23 3.84 14.5 2.25 16 2.25Z"
          transform="translate(0 0)"
        />
        <path
          d="m9.3 16.15 4.3 4.15 9.15-9.05"
          fill="none"
          stroke="#fff"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}
