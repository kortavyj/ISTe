import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://istesport.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

const publicPages = {
  "/": {
    title: "ISTe Esports | Официальный сайт киберспортивной команды",
    description:
      "Официальный сайт ISTe Esports: состав команды CS2, матчи, результаты, новости, история клуба и официальные социальные сети.",
  },
  "/team": {
    title: "Состав ISTe Esports по CS2 | Игроки команды",
    description:
      "Актуальный состав ISTe Esports по CS2: игроки, роли, FACEIT статистика и официальные социальные сети участников команды.",
  },
  "/matches": {
    title: "Матчи ISTe Esports | Результаты и расписание",
    description:
      "Предстоящие и завершённые матчи ISTe Esports, результаты встреч и актуальные данные команды с FACEIT.",
  },
  "/news": {
    title: "Новости ISTe Esports | Команда, турниры и обновления",
    description:
      "Официальные новости ISTe Esports: изменения состава, турниры, матчи, результаты и обновления киберспортивного клуба.",
  },
  "/partners": {
    title: "Партнёры ISTe Esports | Сотрудничество с командой",
    description:
      "Официальные партнёры ISTe Esports и информация для брендов, организаторов турниров и медиапроектов.",
  },
  "/history": {
    title: "Евгений Kortavyj | Основатель ISTe, стример и музыкант",
    description:
      "Евгений, известный как Kortavyj, — основатель и владелец ISTe Esports, стример и музыкант. История создания ISTe и развития проекта.",
  },
  "/contacts": {
    title: "Контакты ISTe Esports | Связаться с командой",
    description:
      "Официальные контакты ISTe Esports для партнёрства, турниров, медиапроектов и связи с командой.",
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
]);

const PROFILE_JSON_LD_ID = "iste-founder-profile-jsonld";

const founderProfileSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": "https://istesport.com/history#profilepage",
  url: "https://istesport.com/history",
  name: "Евгений Kortavyj — основатель ISTe",
  description:
    "Официальная страница Евгения, известного под ником Kortavyj, основателя и владельца ISTe Esports, стримера и музыканта.",
  inLanguage: "ru",
  isPartOf: {
    "@id": "https://istesport.com/#website",
  },
  publisher: {
    "@id": "https://istesport.com/#organization",
  },
  mainEntity: {
    "@type": "Person",
    "@id": "https://istesport.com/history#person",
    name: "Евгений",
    alternateName: "Kortavyj",
    url: "https://istesport.com/history",
    jobTitle: "Founder & Owner of ISTe",
    description:
      "Основатель и владелец ISTe Esports, стример и музыкант.",
    sameAs: [
      "https://www.twitch.tv/kortavyj",
      "https://www.youtube.com/@Hell_Hound_Game",
    ],
    worksFor: {
      "@id": "https://istesport.com/#organization",
    },
    affiliation: {
      "@id": "https://istesport.com/#organization",
    },
    mainEntityOfPage: {
      "@id": "https://istesport.com/history#profilepage",
    },
  },
};

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }

  Object.entries(attributes).forEach(([name, value]) => {
    element.setAttribute(name, value);
  });

  return element;
}

function ensureCanonical() {
  let canonical = document.head.querySelector('link[rel="canonical"]');

  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
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

function syncProfileJsonLd(path) {
  const existing = document.getElementById(PROFILE_JSON_LD_ID);

  if (path !== "/history") {
    existing?.remove();
    return;
  }

  const script = existing || document.createElement("script");

  script.id = PROFILE_JSON_LD_ID;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(founderProfileSchema);

  if (!existing) {
    document.head.appendChild(script);
  }
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const path = normalizePath(location.pathname);
    const page = publicPages[path];
    const isPrivate =
      noIndexPaths.has(path) ||
      path.startsWith("/admin/") ||
      path.startsWith("/owner/");
    const isIndexable = Boolean(page) && !isPrivate;

    const title = page?.title || "ISTe Esports";
    const description =
      page?.description ||
      "Официальный сайт киберспортивной команды ISTe Esports.";
    const canonicalUrl = `${SITE_URL}${path === "/" ? "/" : path}`;
    const robots = isIndexable
      ? "index, follow, max-image-preview:large"
      : "noindex, nofollow, noarchive";

    document.title = title;
    document.documentElement.lang = "ru";

    ensureMeta('meta[name="description"]', {
      name: "description",
      content: description,
    });
    ensureMeta('meta[name="robots"]', {
      name: "robots",
      content: robots,
    });
    ensureMeta('meta[name="googlebot"]', {
      name: "googlebot",
      content: robots,
    });

    ensureMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    ensureMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description,
    });
    ensureMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalUrl,
    });
    ensureMeta('meta[property="og:image"]', {
      property: "og:image",
      content: DEFAULT_IMAGE,
    });
    ensureMeta('meta[property="og:type"]', {
      property: "og:type",
      content: path === "/history" ? "profile" : "website",
    });
    ensureMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });
    ensureMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description,
    });
    ensureMeta('meta[name="twitter:image"]', {
      name: "twitter:image",
      content: DEFAULT_IMAGE,
    });

    ensureCanonical().setAttribute("href", canonicalUrl);

    syncProfileJsonLd(path);
  }, [location.pathname]);

  return null;
}
