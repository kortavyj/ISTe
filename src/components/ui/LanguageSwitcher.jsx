import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./LanguageSwitcher.css";

const options = [
  { code: "uk", shortLabel: "UA" },
  { code: "ru", shortLabel: "RU" },
  { code: "en", shortLabel: "EN" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div
      className="language-switcher"
      role="group"
      aria-label={t("languages.selectorLabel")}
    >
      {options.map(({ code, shortLabel }) => {
        const isActive = language === code;

        return (
          <button
            key={code}
            className={`language-switcher-button${
              isActive
                ? " language-switcher-button-active"
                : ""
            }`}
            type="button"
            aria-pressed={isActive}
            title={t(`languages.${code}`)}
            onClick={() => setLanguage(code)}
          >
            {shortLabel}
          </button>
        );
      })}
    </div>
  );
}
