import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./LanguageSwitcher.css";

const OPTIONS = Object.freeze([
  { code: "uk", shortLabel: "UA", flagClass: "ua" },
  { code: "ru", shortLabel: "RU", flagClass: "ru" },
  { code: "en", shortLabel: "EN", flagClass: "en" },
]);

function GlobeIcon() {
  return (
    <svg
      className="language-select-globe-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.55"
      />

      <path
        d="M3.8 12h16.4M12 3.5c2.1 2.35 3.15 5.18 3.15 8.5S14.1 18.15 12 20.5M12 3.5C9.9 5.85 8.85 8.68 8.85 12S9.9 18.15 12 20.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path
        d="m4.6 10.2 3.25 3.25 7.55-7.4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function LanguageFlag({ flagClass }) {
  return (
    <span
      className={`language-select-flag language-select-flag-${flagClass}`}
      aria-hidden="true"
    />
  );
}

export default function LanguageSwitcher() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();

  const currentOption = useMemo(
    () =>
      OPTIONS.find((option) => option.code === language) ||
      OPTIONS[0],
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

    document.addEventListener(
      "pointerdown",
      handlePointerDown,
    );
    document.addEventListener(
      "keydown",
      handleKeyDown,
    );

    return () => {
      document.removeEventListener(
        "pointerdown",
        handlePointerDown,
      );
      document.removeEventListener(
        "keydown",
        handleKeyDown,
      );
    };
  }, []);

  function selectLanguage(code) {
    setLanguage(code);
    setOpen(false);
  }

  return (
    <div className="language-select" ref={rootRef}>
      <button
        className={`language-select-trigger${
          open ? " language-select-trigger-open" : ""
        }`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("languages.selectorLabel")}
        title={t(`languages.${language}`)}
        onClick={() =>
          setOpen((current) => !current)
        }
      >
        <span className="language-select-globe">
          <GlobeIcon />

          <span className="language-select-current-flag">
            <LanguageFlag
              flagClass={currentOption.flagClass}
            />
          </span>
        </span>

        <span className="language-select-current">
          <strong>{currentOption.shortLabel}</strong>
          <small>{t(`languages.${language}`)}</small>
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
        id={menuId}
        className={`language-select-menu${
          open ? " language-select-menu-open" : ""
        }`}
        role="listbox"
        aria-label={t("languages.selectorLabel")}
        aria-hidden={!open}
      >
        <div className="language-select-menu-head">
          <span className="language-select-menu-icon">
            <GlobeIcon />
          </span>

          <div>
            <strong>{t("languages.selectorLabel")}</strong>
            <small>ISTe GLOBAL</small>
          </div>
        </div>

        <div className="language-select-menu-divider" />

        {OPTIONS.map(
          ({ code, shortLabel, flagClass }) => {
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
                <span className="language-select-option-flag">
                  <LanguageFlag flagClass={flagClass} />
                </span>

                <span className="language-select-option-copy">
                  <strong>
                    {t(`languages.${code}`)}
                  </strong>
                  <small>{shortLabel}</small>
                </span>

                <span
                  className={`language-select-option-mark${
                    isActive
                      ? " language-select-option-mark-active"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  {isActive ? <CheckIcon /> : null}
                </span>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
