import {
  useLayoutEffect,
} from "react";

import {
  useLanguage,
} from "./LanguageContext.jsx";

import {
  AUTO_TRANSLATIONS,
} from "./autoTranslations.js";

const SUPPORTED_LANGUAGES = [
  "uk",
  "ru",
  "en",
];

const ATTRIBUTE_NAMES = [
  "placeholder",
  "title",
  "aria-label",
];

const SKIP_SELECTOR = [
  "script",
  "style",
  "code",
  "pre",
  "textarea",
  "[data-no-auto-translate]",
  ".news-featured-content h2",
  ".news-featured-content > p",
  ".news-card-body h2",
  ".news-card-body > p",
  ".news-modal h2",
  ".news-modal-excerpt",
  ".news-modal-content",
  ".admin-news-card-body h2",
  ".user-result-heading h2",
  ".user-result-heading span",
  ".user-result-bio",
].join(",");

const exactLookup = new Map();

for (const item of AUTO_TRANSLATIONS) {
  for (const language of SUPPORTED_LANGUAGES) {
    const value = normalizeText(
      item[language],
    );

    if (value) {
      exactLookup.set(value, item);
    }
  }
}

const ENGLISH_MONTH_INDEX = new Map([
  ["january", 0],
  ["february", 1],
  ["march", 2],
  ["april", 3],
  ["may", 4],
  ["june", 5],
  ["july", 6],
  ["august", 7],
  ["september", 8],
  ["october", 9],
  ["november", 10],
  ["december", 11],
]);

const MONTH_INDEX = new Map([
  ["января", 0],
  ["февраля", 1],
  ["марта", 2],
  ["апреля", 3],
  ["мая", 4],
  ["июня", 5],
  ["июля", 6],
  ["августа", 7],
  ["сентября", 8],
  ["октября", 9],
  ["ноября", 10],
  ["декабря", 11],
  ["січня", 0],
  ["лютого", 1],
  ["березня", 2],
  ["квітня", 3],
  ["травня", 4],
  ["червня", 5],
  ["липня", 6],
  ["серпня", 7],
  ["вересня", 8],
  ["жовтня", 9],
  ["листопада", 10],
  ["грудня", 11],
]);

const LOCALES = {
  uk: "uk-UA",
  ru: "ru-RU",
  en: "en-US",
};

function normalizeText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function keepOuterWhitespace(
  source,
  translated,
) {
  const leading =
    source.match(/^\s*/)?.[0] ?? "";

  const trailing =
    source.match(/\s*$/)?.[0] ?? "";

  return `${leading}${translated}${trailing}`;
}

function translateKnownDate(
  normalized,
  language,
) {
  const englishMatch = normalized.match(
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s+(\d{4})(?:\s+at\s+(\d{1,2}):(\d{2})\s*(AM|PM))?$/i,
  );

  if (englishMatch) {
    const month = ENGLISH_MONTH_INDEX.get(
      englishMatch[1].toLowerCase(),
    );

    let hour = Number(
      englishMatch[4] || 0,
    );

    const period =
      englishMatch[6]?.toUpperCase();

    if (period === "PM" && hour < 12) {
      hour += 12;
    }

    if (period === "AM" && hour === 12) {
      hour = 0;
    }

    const date = new Date(
      Number(englishMatch[3]),
      month,
      Number(englishMatch[2]),
      hour,
      Number(englishMatch[5] || 0),
    );

    return new Intl.DateTimeFormat(
      LOCALES[language] || LOCALES.uk,
      {
        day: "2-digit",
        month: "long",
        year: "numeric",

        ...(englishMatch[4]
          ? {
              hour: "2-digit",
              minute: "2-digit",
            }
          : {}),
      },
    ).format(date);
  }

  const match = normalized.match(
    /^(\d{1,2})\s+([а-яіїєґ]+)\s+(\d{4})(?:\s+(?:г\.|р\.))?(?:,?\s+(?:в|о)\s+(\d{1,2}):(\d{2}))?$/iu,
  );

  if (!match) {
    return null;
  }

  const month = MONTH_INDEX.get(
    match[2].toLowerCase(),
  );

  if (month === undefined) {
    return null;
  }

  const date = new Date(
    Number(match[3]),
    month,
    Number(match[1]),
    Number(match[4] || 0),
    Number(match[5] || 0),
  );

  const options = {
    day: "2-digit",
    month: "long",
    year: "numeric",

    ...(match[4]
      ? {
          hour: "2-digit",
          minute: "2-digit",
        }
      : {}),
  };

  return new Intl.DateTimeFormat(
    LOCALES[language] || LOCALES.uk,
    options,
  ).format(date);
}

function translateDynamicText(
  normalized,
  language,
) {
  const date = translateKnownDate(
    normalized,
    language,
  );

  if (date) {
    return date;
  }

  const excerptCounter =
    normalized.match(
      /^(\d+)\s+из\s+320\s+символов$/i,
    );

  if (excerptCounter) {
    if (language === "uk") {
      return `${excerptCounter[1]} із 320 символів`;
    }

    if (language === "en") {
      return `${excerptCounter[1]} of 320 characters`;
    }
  }

  const memberSince =
    normalized.match(
      /^(?:Участник с|Учасник з|Member since)\s+(.+)$/i,
    );

  if (memberSince) {
    const prefix = {
      uk: "Учасник з",
      ru: "Участник с",
      en: "Member since",
    }[language];

    return `${prefix} ${memberSince[1]}`;
  }

  return null;
}

function translateText(
  source,
  language,
) {
  const normalized =
    normalizeText(source);

  if (!normalized) {
    return source;
  }

  const item =
    exactLookup.get(normalized);

  const translated = item
    ? item[language]
    : translateDynamicText(
        normalized,
        language,
      );

  if (!translated) {
    return source;
  }

  return keepOuterWhitespace(
    source,
    translated,
  );
}

function shouldSkipElement(element) {
  return Boolean(
    element?.closest?.(SKIP_SELECTOR),
  );
}

function translateTextNode(
  node,
  language,
) {
  const parent = node.parentElement;

  if (
    !parent ||
    shouldSkipElement(parent)
  ) {
    return;
  }

  const nextValue = translateText(
    node.nodeValue,
    language,
  );

  if (nextValue !== node.nodeValue) {
    node.nodeValue = nextValue;
  }
}

function translateElementAttributes(
  element,
  language,
) {
  if (
    !(element instanceof Element) ||
    shouldSkipElement(element)
  ) {
    return;
  }

  for (const attributeName of ATTRIBUTE_NAMES) {
    if (!element.hasAttribute(attributeName)) {
      continue;
    }

    const currentValue =
      element.getAttribute(attributeName);

    const nextValue = translateText(
      currentValue,
      language,
    );

    if (nextValue !== currentValue) {
      element.setAttribute(
        attributeName,
        nextValue,
      );
    }
  }
}

function translateTree(
  root,
  language,
) {
  if (!root) {
    return;
  }

  if (root.nodeType === Node.TEXT_NODE) {
    translateTextNode(root, language);
    return;
  }

  if (!(root instanceof Element)) {
    return;
  }

  translateElementAttributes(
    root,
    language,
  );

  const walker =
    document.createTreeWalker(
      root,
      NodeFilter.SHOW_ELEMENT |
        NodeFilter.SHOW_TEXT,
    );

  let current = walker.nextNode();

  while (current) {
    if (
      current.nodeType ===
      Node.TEXT_NODE
    ) {
      translateTextNode(
        current,
        language,
      );
    } else {
      translateElementAttributes(
        current,
        language,
      );
    }

    current = walker.nextNode();
  }
}

export default function AutoTranslate() {
  const { language } = useLanguage();

  useLayoutEffect(() => {
    const root =
      document.getElementById("root");

    if (!root) {
      return undefined;
    }

    let frameId = 0;

    const applyTranslations = () => {
      frameId = 0;
      translateTree(root, language);
    };

    const scheduleTranslation = () => {
      if (frameId) {
        return;
      }

      frameId =
        window.requestAnimationFrame(
          applyTranslations,
        );
    };

    translateTree(root, language);

    const observer =
      new MutationObserver(
        (mutations) => {
          for (const mutation of mutations) {
            if (
              mutation.type ===
              "characterData"
            ) {
              translateTree(
                mutation.target,
                language,
              );
              continue;
            }

            if (
              mutation.type ===
              "attributes"
            ) {
              translateElementAttributes(
                mutation.target,
                language,
              );
              continue;
            }

            for (const node of mutation.addedNodes) {
              translateTree(
                node,
                language,
              );
            }
          }

          scheduleTranslation();
        },
      );

    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ATTRIBUTE_NAMES,
    });

    scheduleTranslation();

    return () => {
      observer.disconnect();

      if (frameId) {
        window.cancelAnimationFrame(
          frameId,
        );
      }
    };
  }, [language]);

  return null;
}
