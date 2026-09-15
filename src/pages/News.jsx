import { useEffect, useMemo, useState } from "react";

import { useLanguage } from "../i18n/LanguageContext.jsx";
import { supabase } from "../lib/supabase.js";

import "./News.css";

const NEWS_COPY = {
  uk: {
    eyebrow: "ОСТАННІ ОНОВЛЕННЯ",
    title: "НОВИНИ ISTesport",
    loading: "Завантажуємо новини...",
    loadErrorTitle: "Помилка завантаження",
    loadErrorText: "Не вдалося завантажити новини.",
    emptyTitle: "Новин поки немає",
    emptyText: "Опубліковані матеріали з’являться на цій сторінці.",
    featured: "Головна новина",
    readMore: "Читати повністю",
    close: "Закрити новину",
  },
  en: {
    eyebrow: "LATEST UPDATES",
    title: "ISTesport NEWS",
    loading: "Loading news...",
    loadErrorTitle: "Loading error",
    loadErrorText: "Could not load news.",
    emptyTitle: "No news yet",
    emptyText: "Published articles will appear on this page.",
    featured: "Featured news",
    readMore: "Read full article",
    close: "Close article",
  },
};

const DATE_LOCALES = {
  uk: "uk-UA",
  en: "en-US",
};

const CATEGORY_TRANSLATIONS = {
  team: { uk: "КОМАНДА", en: "TEAM" },
  tournament: { uk: "ТУРНІР", en: "TOURNAMENT" },
  match: { uk: "МАТЧ", en: "MATCH" },
  club: { uk: "КЛУБ", en: "CLUB" },
  update: { uk: "ОНОВЛЕННЯ", en: "UPDATE" },
};

const CATEGORY_ALIASES = new Map([
  ["team", "team"],
  ["команда", "team"],
  ["tournament", "tournament"],
  ["турнир", "tournament"],
  ["турнір", "tournament"],
  ["match", "match"],
  ["матч", "match"],
  ["club", "club"],
  ["клуб", "club"],
  ["update", "update"],
  ["updates", "update"],
  ["обновление", "update"],
  ["оновлення", "update"],
]);

const LEGACY_UK_TRANSLATIONS = [
  {
    match: "roster updates: bandai and ysgramora",
    title:
      "Оновлення складу: Bandai та Ysgramora приєдналися до команди, а tokyok1ng та infuriat3 залишили склад",
    excerpt:
      "У складі ISTesport відбулися зміни: до команди приєдналися Bandai та Ysgramora, а tokyok1ng і infuriat3 залишили склад. Стежте за наступними оновленнями команди.",
    content:
      "У складі ISTesport відбулися зміни. До команди приєдналися два нові гравці: Bandai та Ysgramora. Водночас tokyok1ng та infuriat3 залишили склад. Оновлений ростер продовжить підготовку до наступних матчів і турнірів. Слідкуйте за новинами ISTesport, щоб не пропустити наступні анонси.",
  },
  {
    match: "how is the iste team doing at the uesf ukrainian championship",
    title:
      "Як виступає ISTesport на Чемпіонаті України UESF 2026 STAGE 4 Qualification 2?",
    excerpt:
      "ISTesport продовжує виступ у UESF Ukrainian Championship 2026 STAGE 4 Qualification 2 та бореться за вихід до наступного етапу.",
    content:
      "ISTesport продовжує свій виступ у UESF Ukrainian Championship 2026 STAGE 4 Qualification 2. Команда бореться за вихід до наступного етапу та продовжує підготовку до вирішальних матчів кваліфікації. Слідкуйте за новинами ISTesport, щоб не пропустити результати та наступні матчі команди.",
  },
];

function formatDate(value, language) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(
    DATE_LOCALES[language] || DATE_LOCALES.uk,
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  ).format(date);
}

function localizeCategory(value, language) {
  const source = String(value ?? "").trim();
  if (!source) return "";

  const key = CATEGORY_ALIASES.get(source.toLowerCase());
  const localized = key ? CATEGORY_TRANSLATIONS[key] : null;

  return localized?.[language] || source;
}

function getStoredTranslation(post, language, field) {
  const translations =
    post?.translations &&
    typeof post.translations === "object" &&
    !Array.isArray(post.translations)
      ? post.translations
      : null;

  const current = translations?.[language];
  const value =
    current && typeof current[field] === "string"
      ? current[field].trim()
      : "";

  return value;
}

function getLegacyUkTranslation(post, field) {
  const title = String(post?.title ?? "")
    .trim()
    .toLowerCase();

  const translation = LEGACY_UK_TRANSLATIONS.find((item) =>
    title.includes(item.match),
  );

  return translation?.[field] || "";
}

function readLocalizedField(post, language, field) {
  const stored = getStoredTranslation(post, language, field);
  if (stored) return stored;

  if (language === "uk") {
    const legacy = getLegacyUkTranslation(post, field);
    if (legacy) return legacy;
  }

  return typeof post?.[field] === "string" ? post[field] : "";
}

function localizePost(post, language) {
  return {
    ...post,
    title: readLocalizedField(post, language, "title"),
    excerpt: readLocalizedField(post, language, "excerpt"),
    content: readLocalizedField(post, language, "content"),
    category: localizeCategory(post.category, language),
  };
}

export default function News() {
  const { language } = useLanguage();
  const copy = NEWS_COPY[language] || NEWS_COPY.uk;

  const [posts, setPosts] = useState([]);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadNews() {
      setLoading(true);
      setErrorMessage("");

      const { data, error } = await supabase
        .from("news_posts")
        .select(
          "id, title, slug, excerpt, content, cover_url, category, is_featured, published_at",
        )
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order("is_featured", { ascending: false })
        .order("published_at", { ascending: false });

      if (!active) return;

      if (error) {
        setPosts([]);
        setErrorMessage(copy.loadErrorText);
        setLoading(false);
        return;
      }

      const basePosts = Array.isArray(data) ? data : [];
      let nextPosts = basePosts;

      if (basePosts.length > 0) {
        const ids = basePosts.map((post) => post.id).filter(Boolean);

        if (ids.length > 0) {
          const localizationResult = await supabase
            .from("news_posts")
            .select("id, translations")
            .in("id", ids);

          if (
            active &&
            !localizationResult.error &&
            Array.isArray(localizationResult.data)
          ) {
            const translationsById = new Map(
              localizationResult.data.map((post) => [
                post.id,
                post.translations,
              ]),
            );

            nextPosts = basePosts.map((post) => ({
              ...post,
              translations:
                translationsById.get(post.id) || null,
            }));
          }
        }
      }

      if (!active) return;

      setPosts(nextPosts);
      setLoading(false);
    }

    void loadNews();

    return () => {
      active = false;
    };
  }, [copy.loadErrorText]);

  const localizedPosts = useMemo(
    () => posts.map((post) => localizePost(post, language)),
    [language, posts],
  );

  const featuredPost = useMemo(
    () => localizedPosts.find((post) => post.is_featured) ?? null,
    [localizedPosts],
  );

  const regularPosts = useMemo(
    () =>
      featuredPost
        ? localizedPosts.filter((post) => post.id !== featuredPost.id)
        : localizedPosts,
    [featuredPost, localizedPosts],
  );

  const selectedPost = useMemo(
    () =>
      selectedPostId
        ? localizedPosts.find((post) => post.id === selectedPostId) ?? null
        : null,
    [localizedPosts, selectedPostId],
  );

  return (
    <section className="news-page">
      <div className="news-shell">
        <header className="news-header">
          <p className="page-eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
        </header>

        {loading ? (
          <div className="news-state">
            <span className="news-loader" aria-hidden="true" />
            <p>{copy.loading}</p>
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="news-state news-state-error">
            <h2>{copy.loadErrorTitle}</h2>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {!loading && !errorMessage && localizedPosts.length === 0 ? (
          <div className="news-state">
            <h2>{copy.emptyTitle}</h2>
            <p>{copy.emptyText}</p>
          </div>
        ) : null}

        {!loading && featuredPost ? (
          <article className="news-featured">
            <div className="news-featured-cover">
              {featuredPost.cover_url ? (
                <img src={featuredPost.cover_url} alt="" />
              ) : (
                <span>ISTesport</span>
              )}
            </div>

            <div className="news-featured-content">
              <div className="news-meta">
                <b>{copy.featured}</b>
                <span>{featuredPost.category}</span>
                <time dateTime={featuredPost.published_at}>
                  {formatDate(featuredPost.published_at, language)}
                </time>
              </div>

              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt || featuredPost.content}</p>

              <button
                type="button"
                onClick={() => setSelectedPostId(featuredPost.id)}
              >
                {copy.readMore}
              </button>
            </div>
          </article>
        ) : null}

        {!loading && regularPosts.length > 0 ? (
          <div className="news-grid">
            {regularPosts.map((post) => (
              <article className="news-card" key={post.id}>
                <div className="news-card-cover">
                  {post.cover_url ? (
                    <img src={post.cover_url} alt="" loading="lazy" />
                  ) : (
                    <span>ISTesport</span>
                  )}
                </div>

                <div className="news-card-body">
                  <div className="news-meta">
                    <span>{post.category}</span>
                    <time dateTime={post.published_at}>
                      {formatDate(post.published_at, language)}
                    </time>
                  </div>

                  <h2>{post.title}</h2>
                  <p>{post.excerpt || post.content}</p>

                  <button
                    type="button"
                    onClick={() => setSelectedPostId(post.id)}
                  >
                    {copy.readMore}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>

      {selectedPost ? (
        <div
          className="news-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedPostId(null);
            }
          }}
        >
          <article
            className="news-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-modal-title"
          >
            <button
              className="news-modal-close"
              type="button"
              onClick={() => setSelectedPostId(null)}
              aria-label={copy.close}
            >
              ×
            </button>

            {selectedPost.cover_url ? (
              <img
                className="news-modal-cover"
                src={selectedPost.cover_url}
                alt=""
              />
            ) : null}

            <div className="news-meta">
              <span>{selectedPost.category}</span>
              <time dateTime={selectedPost.published_at}>
                {formatDate(selectedPost.published_at, language)}
              </time>
            </div>

            <h2 id="news-modal-title">{selectedPost.title}</h2>

            {selectedPost.excerpt ? (
              <p className="news-modal-excerpt">
                {selectedPost.excerpt}
              </p>
            ) : null}

            <div className="news-modal-content">
              {selectedPost.content}
            </div>
          </article>
        </div>
      ) : null}
    </section>
  );
}
