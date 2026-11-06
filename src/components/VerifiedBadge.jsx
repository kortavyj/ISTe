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
        <path className="iste-verified-badge-seal" d="M16 2 19.5 4.8 23.6 4.5 24.8 8.7 28.5 11.1 27.4 15.8 28.5 20.3 24.8 23 23.6 27.5 19.5 27.2 16 30 12.5 27.2 8.4 27.5 7.2 23 3.5 20.3 4.6 15.8 3.5 11.1 7.2 8.7 8.4 4.5 12.5 4.8Z" />
        <path className="iste-verified-badge-check" d="m10.2 16.1 4 4 7.7-8.2" fill="none" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
