import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./LanguageSwitcher.css";

const options = [
  { code: "uk", shortLabel: "UA" },
  { code: "ru", shortLabel: "RU" },
  { code: "en", shortLabel: "EN" },
];

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  const currentOption = useMemo(
    () =>
      options.find((option) => option.code === language) ||
      options[0],
    [language],
  );

  useEffect(() => {
    function handlePointerDown(event) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function selectLanguage(code) {
    setLanguage(code);
    setOpen(false);
  }

  return (
    <div
      className="language-select"
      ref={rootRef}
    >
      <button
        className={`language-select-trigger${
          open ? " language-select-trigger-open" : ""
        }`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("languages.selectorLabel")}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="language-select-code">
          {currentOption.shortLabel}
        </span>

        <svg
          className="language-select-chevron"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            d="m5.5 7.5 4.5 4.5 4.5-4.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
          />
        </svg>
      </button>

      <div
        className={`language-select-menu${
          open ? " language-select-menu-open" : ""
        }`}
        role="listbox"
        aria-label={t("languages.selectorLabel")}
        aria-hidden={!open}
      >
        {options.map(({ code, shortLabel }) => {
          const isActive = language === code;

          return (
            <button
              key={code}
              className={`language-select-option${
                isActive
                  ? " language-select-option-active"
                  : ""
              }`}
              type="button"
              role="option"
              aria-selected={isActive}
              tabIndex={open ? 0 : -1}
              onClick={() => selectLanguage(code)}
            >
              <span className="language-select-option-code">
                {shortLabel}
              </span>

              <span className="language-select-option-name">
                {t(`languages.${code}`)}
              </span>

              <span
                className="language-select-option-mark"
                aria-hidden="true"
              >
                {isActive ? "✓" : ""}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
