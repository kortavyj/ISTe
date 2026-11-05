import "./VerifiedBadge.css";

const TYPES = {
  red: "Особлива верифікація ISTe від власника",
  silver: "Офіційно верифікований профіль ISTe",
  gold: "Верифікований медіа або партнер ISTe",
};

export default function VerifiedBadge({ size = 15, type = "silver", className = "" }) {
  const actualType = Object.hasOwn(TYPES, type) ? type : "silver";
  return (
    <span
      className={`iste-verified-badge iste-verified-badge--${actualType} ${className}`.trim()}
      role="img"
      aria-label={TYPES[actualType]}
      title={TYPES[actualType]}
      style={{ "--verified-size": `${size}px` }}
    >
      <svg viewBox="0 0 32 32" focusable="false" aria-hidden="true">
        <circle className="iste-verified-badge-ring" cx="16" cy="16" r="13" />
        <circle className="iste-verified-badge-inner" cx="16" cy="16" r="9.8" />
        <path d="m9.2 16.2 4.4 4.1 9.1-9.1" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
