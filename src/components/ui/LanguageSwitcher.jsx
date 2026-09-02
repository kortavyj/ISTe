import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useLanguage,
} from "../../i18n/LanguageContext.jsx";

import "./LanguageSwitcher.css";

const OPTIONS =
  Object.freeze([
    {
      code: "uk",
      shortLabel: "UA",
      labelKey:
        "languages.uk",
    },
    {
      code: "ru",
      shortLabel: "RU",
      labelKey:
        "languages.ru",
    },
    {
      code: "en",
      shortLabel: "EN",
      labelKey:
        "languages.en",
    },
  ]);

function LanguageIcon() {
  return (
    <svg
      className="language-select-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
      />

      <path
        d="M3.9 12h16.2M12 3.7c2 2.25 3 5.02 3 8.3s-1 6.05-3 8.3M12 3.7c-2 2.25-3 5.02-3 8.3s1 6.05 3 8.3"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      aria-hidden="true"
    >
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

export default function LanguageSwitcher() {
  const {
    language,
    setLanguage,
    t,
  } = useLanguage();

  const [
    open,
    setOpen,
  ] = useState(false);

  const rootRef =
    useRef(null);

  const menuId =
    useId();

  const currentOption =
    useMemo(
      () =>
        OPTIONS.find(
          (option) =>
            option.code ===
            language,
        ) ||
        OPTIONS[0],
      [language],
    );

  useEffect(() => {
    function handlePointerDown(
      event,
    ) {
      if (
        rootRef.current &&
        !rootRef.current
          .contains(
            event.target,
          )
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(
      event,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
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

  function selectLanguage(
    code,
  ) {
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
          open
            ? " language-select-trigger-open"
            : ""
        }`}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t(
          "languages.selectorLabel",
        )}
        title={t(
          currentOption
            .labelKey,
        )}
        onClick={() =>
          setOpen(
            (current) =>
              !current,
          )
        }
      >
        <span className="language-select-symbol">
          <LanguageIcon />
        </span>

        <span className="language-select-code">
          {
            currentOption
              .shortLabel
          }
        </span>

        <svg
          className="language-select-chevron"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path
            d="m5.8 7.8 4.2 4.2 4.2-4.2"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.65"
          />
        </svg>
      </button>

      <div
        id={menuId}
        className={`language-select-menu${
          open
            ? " language-select-menu-open"
            : ""
        }`}
        role="listbox"
        aria-label={t(
          "languages.selectorLabel",
        )}
        aria-hidden={!open}
      >
        {OPTIONS.map(
          (option) => {
            const isActive =
              language ===
              option.code;

            return (
              <button
                key={
                  option.code
                }
                className={`language-select-option${
                  isActive
                    ? " language-select-option-active"
                    : ""
                }`}
                type="button"
                role="option"
                aria-selected={
                  isActive
                }
                tabIndex={
                  open
                    ? 0
                    : -1
                }
                onClick={() =>
                  selectLanguage(
                    option.code,
                  )
                }
              >
                <span className="language-select-option-code">
                  {
                    option
                      .shortLabel
                  }
                </span>

                <span className="language-select-option-name">
                  {t(
                    option
                      .labelKey,
                  )}
                </span>

                <span
                  className={`language-select-option-check${
                    isActive
                      ? " language-select-option-check-active"
                      : ""
                  }`}
                  aria-hidden="true"
                >
                  {isActive ? (
                    <CheckIcon />
                  ) : null}
                </span>
              </button>
            );
          },
        )}
      </div>
    </div>
  );
}
