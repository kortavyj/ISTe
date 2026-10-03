import {
  useEffect,
  useState,
} from "react";
import {
  Link,
} from "react-router-dom";

import isteLogo from "../../assets/logos/iste-logo.png";
import {
  getHighlightThumbnail,
  localizeHighlight,
} from "../../lib/highlights.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./Media.css";

const mediaItems = [
  {
    titleKey:
      "home.media.twitchTitle",
    descriptionKey:
      "home.media.twitchDescription",
    type: "TWITCH",
    href:
      "https://www.twitch.tv/kortavyj",
    image:
      "https://static-cdn.jtvnw.net/previews-ttv/live_user_kortavyj-1280x720.jpg",
  },
  {
    titleKey:
      "home.media.discordTitle",
    descriptionKey:
      "home.media.discordDescription",
    type: "DISCORD",
    href:
      "https://discord.gg/AzpCxEgxye",
    image: isteLogo,
    isBrandCard: true,
  },
];

export default function Media() {
  const {
    t,
    language,
  } = useLanguage();

  const [
    highlights,
    setHighlights,
  ] = useState([]);

  useEffect(() => {
    let cancelled = false;

    void fetch(
      "/api/owner?module=highlights&action=public&limit=2",
      {
        cache: "no-store",
      },
    )
      .then((response) =>
        response
          .json()
          .then((data) => ({
            ok:
              response.ok,
            data,
          })),
      )
      .then((result) => {
        if (
          cancelled ||
          !result.ok ||
          result.data?.ok !==
            true
        ) {
          return;
        }

        setHighlights(
          Array.isArray(
            result.data
              .highlights,
          )
            ? result.data
                .highlights
            : [],
        );
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section
      className="section media-section"
      id="media"
    >
      <header className="section-header">
        <p className="section-tag">
          {t("home.media.tag")}
        </p>

        <h2 className="section-title">
          {t("home.media.title")}
        </h2>

        <p className="media-intro">
          {t(
            "home.media.highlightsDescription",
          )}
        </p>
      </header>

      {highlights.length ? (
        <div className="media-highlights-grid">
          {highlights.map(
            (highlight) => {
              const item =
                localizeHighlight(
                  highlight,
                  language,
                );

              return (
                <Link
                  className="media-card media-card-highlight"
                  to={
                    `/highlights?open=${encodeURIComponent(
                      highlight.id,
                    )}`
                  }
                  key={
                    highlight.id
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

                  <div className="media-overlay">
                    <div className="media-meta">
                      <span className="media-type">
                        {String(
                          highlight.highlightType ||
                          "highlight",
                        )
                          .replace(
                            "_",
                            " ",
                          )
                          .toUpperCase()}
                      </span>

                      <span
                        className="media-open"
                        aria-hidden="true"
                      >
                        ▶
                      </span>
                    </div>

                    <div className="media-copy">
                      <h3>
                        {item.title}
                      </h3>

                      <p>
                        {[
                          highlight.playerName,
                          highlight.matchLabel,
                        ]
                          .filter(
                            Boolean,
                          )
                          .join(
                            " · ",
                          ) ||
                          item.description}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            },
          )}
        </div>
      ) : null}

      <div className="media-grid">
        {mediaItems.map(
          (item) => {
            const title = t(
              item.titleKey,
            );

            return (
              <a
                className={`media-card${item.isBrandCard ? " media-card-brand" : ""}`}
                href={item.href}
                key={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${title}. ${t(
                  "common.openNewTab",
                )}`}
              >
                <img
                  src={item.image}
                  alt=""
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.src =
                      isteLogo;

                    event.currentTarget.classList.add(
                      "media-image-fallback",
                    );
                  }}
                />

                <div className="media-overlay">
                  <div className="media-meta">
                    <span className="media-type">
                      {item.type}
                    </span>

                    <span
                      className="media-open"
                      aria-hidden="true"
                    >
                      ↗
                    </span>
                  </div>

                  <div className="media-copy">
                    <h3>{title}</h3>

                    <p>
                      {t(
                        item.descriptionKey,
                      )}
                    </p>
                  </div>
                </div>
              </a>
            );
          },
        )}
      </div>

      <div className="media-highlights-action">
        <Link to="/highlights">
          {t(
            "home.media.viewHighlights",
          )}
          <span aria-hidden="true">
            →
          </span>
        </Link>
      </div>
    </section>
  );
}
