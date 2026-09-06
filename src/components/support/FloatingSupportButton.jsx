import { NavLink } from "react-router-dom";

import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./FloatingSupportButton.css";

const LABELS = {
  uk: "Підтримка ISTe",
  ru: "Поддержка ISTe",
  en: "ISTe Support",
};

export default function FloatingSupportButton() {
  const { language } = useLanguage();
  const label = LABELS[language] || LABELS.uk;

  return (
    <NavLink
      to="/support"
      className={({ isActive }) =>
        `floating-support${isActive ? " floating-support-active" : ""}`
      }
      aria-label={label}
      title={label}
    >
      <span className="floating-support-orbit" aria-hidden="true" />

      <svg
        className="floating-support-icon"
        viewBox="0 0 32 32"
        aria-hidden="true"
      >
        <path
          d="M7.5 16v-2.1C7.5 9.55 11.05 6 15.4 6h1.2c4.35 0 7.9 3.55 7.9 7.9V16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2.15"
        />
        <path
          d="M7.4 15.2H6.1c-.9 0-1.6.73-1.6 1.63v3.35c0 .9.7 1.62 1.6 1.62h1.3c.9 0 1.6-.72 1.6-1.62v-3.35c0-.9-.7-1.63-1.6-1.63Zm18.5 0h-1.3c-.9 0-1.6.73-1.6 1.63v3.35c0 .9.7 1.62 1.6 1.62h1.3c.9 0 1.6-.72 1.6-1.62v-3.35c0-.9-.7-1.63-1.6-1.63Z"
          fill="currentColor"
        />
        <path
          d="M11 13.4h10c1.15 0 2.1.94 2.1 2.1v4.1c0 1.15-.95 2.1-2.1 2.1h-5.05l-3.65 2.72.95-2.72H11a2.1 2.1 0 0 1-2.1-2.1v-4.1c0-1.16.94-2.1 2.1-2.1Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.85"
        />
      </svg>
    </NavLink>
  );
}
