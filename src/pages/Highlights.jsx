import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useSearchParams,
} from "react-router-dom";

import isteLogo from "../assets/logos/iste-logo.png";
import {
  getHighlightEmbedUrl,
  getHighlightThumbnail,
  isDirectVideoUrl,
  localizeHighlight,
} from "../lib/highlights.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Highlights.css";

const copy = {
  uk: {
    eyebrow:
      "ISTe HIGHLIGHTS",
    title:
      "НАЙКРАЩІ МОМЕНТИ",
    intro:
      "Клатчі, ACE, MVP та командні моменти ISTe з матчів і турнірів.",
    all: "Усі",
    highlight: "Highlights",
    clutch: "Clutch",
    ace: "ACE",
    mvp: "MVP",
    best_moments:
      "Best moments",
    empty:
      "Опублікованих хайлайтів поки немає.",
    player: "Гравець",
    match: "Матч",
    watch: "Дивитися",
    external:
      "Відкрити відео",
    close: "Закрити",
  },
  en: {
    eyebrow:
      "ISTe HIGHLIGHTS",
    title:
      "BEST MOMENTS",
    intro:
      "ISTe clutches, ACEs, MVPs and team moments from matches and tournaments.",
    all: "All",
    highlight: "Highlights",
    clutch: "Clutch",
    ace: "ACE",
    mvp: "MVP",
    best_moments:
      "Best moments",
    empty:
      "No published highlights yet.",
    player: "Player",
    match: "Match",
    watch: "Watch",
    external:
      "Open video",
    close: "Close",
  },
};

async function loadHighlights() {
  const response =
    await fetch(
      "/api/owner?module=highlights&action=public",
      {
        cache: "no-store",
      },
    );

  const result =
    await response
      .json()
      .catch(
        () => null,
      );

  if (
    !response.ok ||
    result?.ok !== true
  ) {
    throw new Error(
      "HIGHLIGHTS_LOAD_FAILED",
    );
  }

  return Array.isArray(
    result.highlights,
  )
    ? result.highlights
    : [];
}

export default function Highlights() {
  const {
    language,
  } = useLanguage();

  const [
    searchParams,
  ] = useSearchParams();

  const c =
    copy[language] ||
    copy.uk;

  const [
    highlights,
    setHighlights,
  ] = useState([]);

  const [
    activeType,
    setActiveType,
  ] = useState("all");

  const [
    selected,
    setSelected,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void loadHighlights()
      .then((items) => {
        if (cancelled) {
          return;
        }

        setHighlights(
          items,
        );

        const requested =
          searchParams.get(
            "open",
          );

        if (requested) {
          const match =
            items.find(
              (item) =>
                item.id ===
                requested,
            );

          if (match) {
            setSelected(
              match,
            );
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  useEffect(() => {
    if (!selected) {
      return undefined;
    }

    function onKeyDown(
      event,
    ) {
      if (
        event.key ===
        "Escape"
      ) {
        setSelected(null);
      }
    }

    document.addEventListener(
      "keydown",
      onKeyDown,
    );

    return () =>
      document.removeEventListener(
        "keydown",
        onKeyDown,
      );
  }, [selected]);

  const filtered =
    useMemo(
      () =>
        activeType ===
        "all"
          ? highlights
          : highlights.filter(
              (item) =>
                item.highlightType ===
                activeType,
            ),
      [
        activeType,
        highlights,
      ],
    );

  const selectedItem =
    selected
      ? localizeHighlight(
          selected,
          language,
        )
      : null;

  const embedUrl =
    selected
      ? getHighlightEmbedUrl(
          selected,
        )
      : "";

  return (
    <section className="highlights-page">
      <div className="highlights-shell">
        <header className="highlights-hero">
          <span>
            {c.eyebrow}
          </span>
          <h1>{c.title}</h1>
          <p>{c.intro}</p>
        </header>

        <div className="highlights-filters">
          {[
            "all",
            "highlight",
            "clutch",
            "ace",
            "mvp",
            "best_moments",
          ].map(
            (type) => (
              <button
                type="button"
                key={type}
                className={
                  activeType ===
                  type
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setActiveType(
                    type,
                  )
                }
              >
                {c[type]}
              </button>
            ),
          )}
        </div>

        {loading ? (
          <div className="highlights-empty">
            ...
          </div>
        ) : filtered.length ? (
          <div className="highlights-grid">
            {filtered.map(
              (highlight) => {
                const item =
                  localizeHighlight(
                    highlight,
                    language,
                  );

                return (
                  <button
                    type="button"
                    key={
                      highlight.id
                    }
                    className={
                      highlight.featured
                        ? "highlight-card featured"
                        : "highlight-card"
                    }
                    onClick={() =>
                      setSelected(
                        highlight,
                      )
                    }
                  >
                    <img
                      src={getHighlightThumbnail(
                        highlight,
                        isteLogo,
                      )}
                      alt=""
                      loading="lazy"
                    />

                    <span className="highlight-card-overlay">
                      <span className="highlight-card-top">
                        <i>
                          {c[
                            highlight
                              .highlightType
                          ] ||
                            highlight
                              .highlightType}
                        </i>

                        <b
                          aria-hidden="true"
                        >
                          ▶
                        </b>
                      </span>

                      <span className="highlight-card-copy">
                        <strong>
                          {item.title}
                        </strong>

                        <small>
                          {[
                            highlight
                              .playerName,
                            highlight
                              .matchLabel,
                          ]
                            .filter(
                              Boolean,
                            )
                            .join(
                              " · ",
                            )}
                        </small>
                      </span>
                    </span>
                  </button>
                );
              },
            )}
          </div>
        ) : (
          <div className="highlights-empty">
            {c.empty}
          </div>
        )}
      </div>

      {selectedItem ? (
        <div
          className="highlight-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setSelected(null);
            }
          }}
        >
          <section
            className="highlight-modal"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <span>
                  {c[
                    selected
                      .highlightType
                  ] ||
                    selected
                      .highlightType}
                </span>
                <h2>
                  {selectedItem.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
                aria-label={
                  c.close
                }
              >
                ×
              </button>
            </header>

            <div className="highlight-modal-player">
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={
                    selectedItem.title
                  }
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : isDirectVideoUrl(
                  selected.videoUrl,
                ) ? (
                <video
                  src={
                    selected.videoUrl
                  }
                  controls
                  autoPlay
                  playsInline
                />
              ) : (
                <div className="highlight-modal-external">
                  <img
                    src={getHighlightThumbnail(
                      selected,
                      isteLogo,
                    )}
                    alt=""
                  />
                  <a
                    href={
                      selected.videoUrl
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    ▶ {c.external}
                  </a>
                </div>
              )}
            </div>

            <div className="highlight-modal-copy">
              {selectedItem.description ? (
                <p>
                  {selectedItem.description}
                </p>
              ) : null}

              <div>
                {selected.playerName ? (
                  <span>
                    {c.player}:{" "}
                    <strong>
                      {
                        selected
                          .playerName
                      }
                    </strong>
                  </span>
                ) : null}

                {selected.matchLabel ? (
                  <span>
                    {c.match}:{" "}
                    <strong>
                      {
                        selected
                          .matchLabel
                      }
                    </strong>
                  </span>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
