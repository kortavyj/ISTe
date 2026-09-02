import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  translations,
} from "./translations.js";

const STORAGE_KEY =
  "iste_language";

const STORAGE_VERSION_KEY =
  "iste_language_schema";

/*
 * V2 сбрасывает старую тестовую настройку языка один раз,
 * чтобы после деплоя сайт снова впервые открылся на украинском.
 */
const STORAGE_VERSION =
  "2026-09-ua-default-v2";

const DEFAULT_LANGUAGE =
  "uk";

export const SUPPORTED_LANGUAGES =
  Object.freeze([
    "uk",
    "ru",
    "en",
  ]);

const LanguageContext =
  createContext(null);

function isSupportedLanguage(
  value,
) {
  return SUPPORTED_LANGUAGES
    .includes(value);
}

function readInitialLanguage() {
  if (
    typeof window ===
    "undefined"
  ) {
    return DEFAULT_LANGUAGE;
  }

  try {
    const storedVersion =
      window.localStorage
        .getItem(
          STORAGE_VERSION_KEY,
        );

    if (
      storedVersion !==
      STORAGE_VERSION
    ) {
      window.localStorage
        .setItem(
          STORAGE_KEY,
          DEFAULT_LANGUAGE,
        );

      window.localStorage
        .setItem(
          STORAGE_VERSION_KEY,
          STORAGE_VERSION,
        );

      return DEFAULT_LANGUAGE;
    }

    const storedLanguage =
      window.localStorage
        .getItem(
          STORAGE_KEY,
        );

    return isSupportedLanguage(
      storedLanguage,
    )
      ? storedLanguage
      : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function getNestedValue(
  source,
  path,
) {
  return path
    .split(".")
    .reduce(
      (
        current,
        part,
      ) =>
        current &&
        Object.prototype
          .hasOwnProperty
          .call(
            current,
            part,
          )
          ? current[part]
          : undefined,
      source,
    );
}

function interpolate(
  value,
  variables,
) {
  if (
    typeof value !==
      "string" ||
    !variables
  ) {
    return value;
  }

  return value.replace(
    /\{\{(\w+)\}\}/g,
    (
      match,
      name,
    ) =>
      Object.prototype
        .hasOwnProperty
        .call(
          variables,
          name,
        )
        ? String(
            variables[
              name
            ],
          )
        : match,
  );
}

export function LanguageProvider({
  children,
}) {
  const [
    language,
    setLanguageState,
  ] = useState(
    readInitialLanguage,
  );

  useEffect(() => {
    document
      .documentElement
      .lang =
      language;

    document
      .documentElement
      .dir =
      "ltr";

    document
      .documentElement
      .dataset
      .language =
      language;
  }, [language]);

  const setLanguage =
    useCallback(
      (
        nextLanguage,
      ) => {
        if (
          !isSupportedLanguage(
            nextLanguage,
          )
        ) {
          return;
        }

        setLanguageState(
          nextLanguage,
        );

        try {
          window
            .localStorage
            .setItem(
              STORAGE_KEY,
              nextLanguage,
            );

          window
            .localStorage
            .setItem(
              STORAGE_VERSION_KEY,
              STORAGE_VERSION,
            );
        } catch {
          // Язык всё равно меняется
          // в текущей вкладке.
        }
      },
      [],
    );

  const t =
    useCallback(
      (
        key,
        variables,
      ) => {
        const selectedValue =
          getNestedValue(
            translations[
              language
            ],
            key,
          );

        const fallbackValue =
          getNestedValue(
            translations[
              DEFAULT_LANGUAGE
            ],
            key,
          );

        return interpolate(
          selectedValue ??
            fallbackValue ??
            key,
          variables,
        );
      },
      [language],
    );

  const value =
    useMemo(
      () => ({
        language,
        setLanguage,
        t,

        defaultLanguage:
          DEFAULT_LANGUAGE,

        supportedLanguages:
          SUPPORTED_LANGUAGES,
      }),
      [
        language,
        setLanguage,
        t,
      ],
    );

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(
      LanguageContext,
    );

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider.",
    );
  }

  return context;
}
