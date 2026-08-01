import { useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase.js";

import "./News.css";

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function News() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
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

      if (!active) {
        return;
      }

      if (error) {
        setPosts([]);
        setErrorMessage("Не удалось загрузить новости.");
      } else {
        setPosts(Array.isArray(data) ? data : []);
      }

      setLoading(false);
    }

    void loadNews();

    return () => {
      active = false;
    };
  }, []);

  const featuredPost = useMemo(
    () => posts.find((post) => post.is_featured) ?? null,
    [posts],
  );

  const regularPosts = useMemo(
    () =>
      featuredPost
        ? posts.filter((post) => post.id !== featuredPost.id)
        : posts,
    [featuredPost, posts],
  );

  return (
    <section className="news-page">
      <div className="news-shell">
        <header className="news-header">
          <p className="page-eyebrow">LATEST UPDATES</p>
          <h1>Новости ISTe</h1>
         
        </header>

        {loading ? (
          <div className="news-state">
            <span className="news-loader" aria-hidden="true" />
            <p>Загружаем новости...</p>
          </div>
        ) : null}

        {!loading && errorMessage ? (
          <div className="news-state news-state-error">
            <h2>Ошибка загрузки</h2>
            <p>{errorMessage}</p>
          </div>
        ) : null}

        {!loading && !errorMessage && posts.length === 0 ? (
          <div className="news-state">
            <h2>Новостей пока нет</h2>
            <p>Опубликованные материалы появятся на этой странице.</p>
          </div>
        ) : null}

        {!loading && featuredPost ? (
          <article className="news-featured">
            <div className="news-featured-cover">
              {featuredPost.cover_url ? (
                <img src={featuredPost.cover_url} alt="" />
              ) : (
                <span>ISTe</span>
              )}
            </div>

            <div className="news-featured-content">
              <div className="news-meta">
                <b>Главная новость</b>
                <span>{featuredPost.category}</span>
                <time dateTime={featuredPost.published_at}>
                  {formatDate(featuredPost.published_at)}
                </time>
              </div>

              <h2>{featuredPost.title}</h2>
              <p>{featuredPost.excerpt || featuredPost.content}</p>

              <button
                type="button"
                onClick={() => setSelectedPost(featuredPost)}
              >
                Читать полностью
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
                    <span>ISTe</span>
                  )}
                </div>

                <div className="news-card-body">
                  <div className="news-meta">
                    <span>{post.category}</span>
                    <time dateTime={post.published_at}>
                      {formatDate(post.published_at)}
                    </time>
                  </div>

                  <h2>{post.title}</h2>
                  <p>{post.excerpt || post.content}</p>

                  <button
                    type="button"
                    onClick={() => setSelectedPost(post)}
                  >
                    Читать полностью
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
              setSelectedPost(null);
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
              onClick={() => setSelectedPost(null)}
              aria-label="Закрыть новость"
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
                {formatDate(selectedPost.published_at)}
              </time>
            </div>

            <h2 id="news-modal-title">{selectedPost.title}</h2>

            {selectedPost.excerpt ? (
              <p className="news-modal-excerpt">{selectedPost.excerpt}</p>
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
