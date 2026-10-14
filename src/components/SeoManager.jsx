import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";

const SITE_URL = "https://istesport.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const OG_LOCALE = {
  uk: "uk_UA",
  ru: "ru_RU",
  en: "en_US",
};

const SEO = {
  uk: {
    fallback: {
      title: "ISTesport",
      description:
        "Офіційний сайт кіберспортивної команди ISTesport.",
    },
    pages: {
      "/": {
        title:
          "ISTesport | Офіційний сайт кіберспортивної команди",
        description:
          "ISTesport — офіційний сайт кіберспортивної команди CS2: склад, матчі, результати, новини та історія клубу.",
      },
      "/team": {
        title:
          "Склад ISTesport з CS2 | Гравці команди",
        description:
          "Актуальний склад ISTesport з CS2: гравці, ролі, статистика FACEIT та офіційні соціальні мережі учасників команди.",
      },
      "/matches": {
        title:
          "Матчі ISTesport | Результати та розклад",
        description:
          "Майбутні та завершені матчі ISTesport, результати зустрічей і актуальні дані команди з FACEIT.",
      },
      "/news": {
        title:
          "Новини ISTesport | Команда, турніри та оновлення",
        description:
          "Офіційні новини ISTesport: зміни складу, турніри, матчі, результати та оновлення кіберспортивного клубу.",
      },
      "/partners": {
        title:
          "Партнери ISTesport | Співпраця з командою",
        description:
          "Офіційні партнери ISTesport та інформація для брендів, організаторів турнірів і медіапроєктів.",
      },
      "/history": {
        title:
          "Євген Kortavyj | Засновник ISTe, стример і музикант",
        description:
          "Євген, відомий як Kortavyj, — засновник і власник ISTesport, стример і музикант. Історія створення ISTe та розвитку проєкту.",
      },
      "/contacts": {
        title:
          "Контакти ISTesport | Зв’язатися з командою",
        description:
          "Офіційні контакти ISTesport для партнерства, турнірів, медіапроєктів і зв’язку з командою.",
      },
    },
    founder: {
      pageName:
        "Євген Kortavyj — засновник ISTe",
      pageDescription:
        "Офіційна сторінка Євгена, відомого під ніком Kortavyj, засновника і власника ISTesport, стримера та музиканта.",
      personDescription:
        "Засновник і власник ISTesport, стример та музикант.",
    },
  },

  ru: {
    fallback: {
      title: "ISTesport",
      description:
        "Официальный сайт киберспортивной команды ISTesport.",
    },
    pages: {
      "/": {
        title:
          "ISTesport | Официальный сайт киберспортивной команды",
        description:
          "ISTesport — официальный сайт киберспортивной команды CS2: состав, матчи, результаты, новости и история клуба.",
      },
      "/team": {
        title:
          "Состав ISTesport по CS2 | Игроки команды",
        description:
          "Актуальный состав ISTesport по CS2: игроки, роли, FACEIT статистика и официальные социальные сети участников команды.",
      },
      "/matches": {
        title:
          "Матчи ISTesport | Результаты и расписание",
        description:
          "Предстоящие и завершённые матчи ISTesport, результаты встреч и актуальные данные команды с FACEIT.",
      },
      "/news": {
        title:
          "Новости ISTesport | Команда, турниры и обновления",
        description:
          "Официальные новости ISTesport: изменения состава, турниры, матчи, результаты и обновления киберспортивного клуба.",
      },
      "/partners": {
        title:
          "Партнёры ISTesport | Сотрудничество с командой",
        description:
          "Официальные партнёры ISTesport и информация для брендов, организаторов турниров и медиапроектов.",
      },
      "/history": {
        title:
          "Евгений Kortavyj | Основатель ISTe, стример и музыкант",
        description:
          "Евгений, известный как Kortavyj, — основатель и владелец ISTesport, стример и музыкант. История создания ISTe и развития проекта.",
      },
      "/contacts": {
        title:
          "Контакты ISTesport | Связаться с командой",
        description:
          "Официальные контакты ISTesport для партнёрства, турниров, медиапроектов и связи с командой.",
      },
    },
    founder: {
      pageName:
        "Евгений Kortavyj — основатель ISTe",
      pageDescription:
        "Официальная страница Евгения, известного под ником Kortavyj, основателя и владельца ISTesport, стримера и музыканта.",
      personDescription:
        "Основатель и владелец ISTesport, стример и музыкант.",
    },
  },

  en: {
    fallback: {
      title: "ISTesport",
      description:
        "Official website of the ISTesport team.",
    },
    pages: {
      "/": {
        title:
          "ISTesport | Official Esports Team Website",
        description:
          "ISTesport — official CS2 esports team website with roster, matches, results, news and club history.",
      },
      "/team": {
        title:
          "ISTesport CS2 Roster | Team Players",
        description:
          "Current ISTesport CS2 roster: players, roles, FACEIT statistics and official social profiles.",
      },
      "/matches": {
        title:
          "ISTesport Matches | Results and Schedule",
        description:
          "Upcoming and completed ISTesport matches, results and current FACEIT team data.",
      },
      "/news": {
        title:
          "ISTesport News | Team, Tournaments and Updates",
        description:
          "Official ISTesport news: roster changes, tournaments, matches, results and club updates.",
      },
      "/partners": {
        title:
          "ISTesport Partners | Work With the Team",
        description:
          "Official ISTesport partners and information for brands, tournament organizers and media projects.",
      },
      "/history": {
        title:
          "Evgeniy Kortavyj | ISTe Founder, Streamer and Musician",
        description:
          "Evgeniy, known online as Kortavyj, is the founder and owner of ISTesport, a streamer and musician. The story of ISTe and its development.",
      },
      "/contacts": {
        title:
          "ISTesport Contacts | Contact the Team",
        description:
          "Official ISTesport contacts for partnerships, tournaments, media projects and team inquiries.",
      },
    },
    founder: {
      pageName:
        "Evgeniy Kortavyj — Founder of ISTe",
      pageDescription:
        "Official profile of Evgeniy, known online as Kortavyj, founder and owner of ISTesport, streamer and musician.",
      personDescription:
        "Founder and owner of ISTesport, streamer and musician.",
    },
  },
};

const noIndexPaths = new Set([
  "/shop",
  "/privacy",
  "/terms",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/blocked",
  "/account",
  "/users",
  "/admin/news",
  "/owner/users",
  "/owner/shop",
]);

const PROFILE_JSON_LD_ID =
  "iste-founder-profile-jsonld";

function getFounderProfileSchema(language) {
  const content = SEO[language] ?? SEO.uk;

  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id":
      "https://istesport.com/history#profilepage",
    url: "https://istesport.com/history",
    name: content.founder.pageName,
    description:
      content.founder.pageDescription,
    inLanguage: language,
    isPartOf: {
      "@id":
        "https://istesport.com/#website",
    },
    publisher: {
      "@id":
        "https://istesport.com/#organization",
    },
    mainEntity: {
      "@type": "Person",
      "@id":
        "https://istesport.com/history#person",
      name:
        language === "uk"
          ? "Євген"
          : language === "en"
            ? "Evgeniy"
            : "Евгений",
      alternateName: "Kortavyj",
      url: "https://istesport.com/history",
      jobTitle: "Founder & Owner of ISTe",
      description:
        content.founder.personDescription,
      sameAs: [
        "https://www.twitch.tv/kortavyj",
        "https://www.youtube.com/@Hell_Hound_Game",
      ],
      worksFor: {
        "@id":
          "https://istesport.com/#organization",
      },
      affiliation: {
        "@id":
          "https://istesport.com/#organization",
      },
      mainEntityOfPage: {
        "@id":
          "https://istesport.com/history#profilepage",
      },
    },
  };
}

function ensureMeta(selector, attributes) {
  let element =
    document.head.querySelector(selector);

  if (!element) {
    element =
      document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(
    ([name, value]) => {
      element.setAttribute(name, value);
    },
  );

  return element;
}

function ensureCanonical() {
  let canonical =
    document.head.querySelector(
      'link[rel="canonical"]',
    );

  if (!canonical) {
    canonical =
      document.createElement("link");
    canonical.setAttribute(
      "rel",
      "canonical",
    );
    document.head.appendChild(canonical);
  }

  return canonical;
}

function normalizePath(pathname) {
  if (pathname === "/") {
    return pathname;
  }

  return pathname.replace(/\/+$/, "");
}

function syncProfileJsonLd(path, language) {
  const existing =
    document.getElementById(
      PROFILE_JSON_LD_ID,
    );

  if (path !== "/history") {
    existing?.remove();
    return;
  }

  const script =
    existing ||
    document.createElement("script");

  script.id = PROFILE_JSON_LD_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(
    getFounderProfileSchema(language),
  );

  if (!existing) {
    document.head.appendChild(script);
  }
}

export default function SeoManager() {
  const location = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const path = normalizePath(
      location.pathname,
    );

    const content =
      SEO[language] ?? SEO.uk;

    const page = content.pages[path];

    const isPrivate =
      noIndexPaths.has(path) ||
      path.startsWith("/admin/") ||
      path.startsWith("/owner/");

    const isIndexable =
      Boolean(page) && !isPrivate;

    const title =
      page?.title ||
      content.fallback.title;

    const description =
      page?.description ||
      content.fallback.description;

    const canonicalUrl =
      `${SITE_URL}${
        path === "/" ? "/" : path
      }`;

    const robots = isIndexable
      ? "index, follow, max-image-preview:large"
      : "noindex, nofollow, noarchive";

    document.title = title;
    document.documentElement.lang =
      language;

    ensureMeta(
      'meta[name="description"]',
      {
        name: "description",
        content: description,
      },
    );

    ensureMeta(
      'meta[name="robots"]',
      {
        name: "robots",
        content: robots,
      },
    );

    ensureMeta(
      'meta[name="googlebot"]',
      {
        name: "googlebot",
        content: robots,
      },
    );

    ensureMeta(
      'meta[property="og:locale"]',
      {
        property: "og:locale",
        content:
          OG_LOCALE[language] ||
          OG_LOCALE.uk,
      },
    );

    ensureMeta(
      'meta[property="og:title"]',
      {
        property: "og:title",
        content: title,
      },
    );

    ensureMeta(
      'meta[property="og:description"]',
      {
        property: "og:description",
        content: description,
      },
    );

    ensureMeta(
      'meta[property="og:url"]',
      {
        property: "og:url",
        content: canonicalUrl,
      },
    );

    ensureMeta(
      'meta[property="og:image"]',
      {
        property: "og:image",
        content: DEFAULT_IMAGE,
      },
    );

    ensureMeta(
      'meta[property="og:type"]',
      {
        property: "og:type",
        content:
          path === "/history"
            ? "profile"
            : "website",
      },
    );

    ensureMeta(
      'meta[name="twitter:title"]',
      {
        name: "twitter:title",
        content: title,
      },
    );

    ensureMeta(
      'meta[name="twitter:description"]',
      {
        name: "twitter:description",
        content: description,
      },
    );

    ensureMeta(
      'meta[name="twitter:image"]',
      {
        name: "twitter:image",
        content: DEFAULT_IMAGE,
      },
    );

    ensureCanonical().setAttribute(
      "href",
      canonicalUrl,
    );

    syncProfileJsonLd(
      path,
      language,
    );
  }, [
    location.pathname,
    language,
  ]);

  return null;
}
