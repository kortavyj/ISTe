import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { translations } from "./translations.js";

const STORAGE_KEY = "iste_language";
const DEFAULT_LANGUAGE = "uk";

export const SUPPORTED_LANGUAGES = Object.freeze([
  "uk",
  "ru",
  "en",
]);

const LanguageContext = createContext(null);

function isSupportedLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value);
}

function readStoredLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  try {
    const storedLanguage =
      window.localStorage.getItem(STORAGE_KEY);

    return isSupportedLanguage(storedLanguage)
      ? storedLanguage
      : DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

function getNestedValue(source, path) {
  return path.split(".").reduce(
    (current, part) =>
      current &&
      Object.prototype.hasOwnProperty.call(current, part)
        ? current[part]
        : undefined,
    source,
  );
}

function interpolate(value, variables) {
  if (typeof value !== "string" || !variables) {
    return value;
  }

  return value.replace(
    /\{\{(\w+)\}\}/g,
    (match, name) =>
      Object.prototype.hasOwnProperty.call(variables, name)
        ? String(variables[name])
        : match,
  );
}

export function LanguageProvider({ children }) {
  const [language, setLanguageState] =
    useState(readStoredLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = "ltr";
    document.documentElement.dataset.language = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    if (!isSupportedLanguage(nextLanguage)) {
      return;
    }

    setLanguageState(nextLanguage);

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        nextLanguage,
      );
    } catch {
      // Язык всё равно изменится для текущей страницы.
    }
  }, []);

  const t = useCallback(
    (key, variables) => {
      const selectedValue = getNestedValue(
        translations[language],
        key,
      );

      const fallbackValue = getNestedValue(
        translations[DEFAULT_LANGUAGE],
        key,
      );

      return interpolate(
        selectedValue ?? fallbackValue ?? key,
        variables,
      );
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [language, setLanguage, t],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider.",
    );
  }

  return context;
}
