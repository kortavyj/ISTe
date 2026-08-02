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
    title: "История ISTe Esports | Развитие киберспортивной команды",
    description:
      "История создания и развития ISTe Esports, ценности команды, ключевые этапы и планы киберспортивного клуба.",
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
  }, [location.pathname]);

  return null;
}
