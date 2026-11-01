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
    image: null,
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
      <header className="section-header media-section-heading">
        <div className="media-heading-kicker-wrap">
          <span className="media-heading-line" aria-hidden="true" />
          <p className="section-tag media-heading-kicker">
            <span aria-hidden="true" className="media-heading-slashes">//</span>
            {t("home.media.tag")}
          </p>
          <span className="media-heading-line" aria-hidden="true" />
        </div>

        <h2 className="section-title media-heading-title">
          {t("home.media.title")}
        </h2>
        <span className="media-heading-accent" aria-hidden="true" />
        <p className="media-intro media-heading-description">
          {t("home.media.highlightsDescription")}
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
            const title = item.type === "TWITCH"
              ? (language === "uk" ? "СТРІМИ ISTe" : language === "ru" ? "СТРИМЫ ISTe" : "ISTe STREAMS")
              : t(item.titleKey);

            return (
              <a
                className={`media-card media-card-social ${item.isBrandCard ? " media-card-brand media-card-discord" : "media-card-twitch"}`}
                href={item.href}
                key={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${title}. ${t(
                  "common.openNewTab",
                )}`}
              >
                {item.type === "TWITCH" ? (
                  <div className="media-twitch-art" aria-hidden="true">
                    <div className="media-twitch-light media-twitch-light-left" />
                    <div className="media-twitch-light media-twitch-light-right" />
                    <div className="media-twitch-monitor">
                      <svg viewBox="0 0 96 96" fill="none" aria-hidden="true">
                        <path d="M17 13H83V61L67 77H49L37 88V77H17V13Z" fill="#A970FF" fillOpacity=".2" stroke="#C59AFF" strokeWidth="4"/>
                        <path d="M40 31V53M62 31V53" stroke="#E5CEFF" strokeWidth="7" strokeLinecap="square"/>
                      </svg>
                    </div>
                    <div className="media-twitch-desk" />
                  </div>
                ) : (
                  <img src={item.image} alt="" loading="lazy" />
                )}

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

    </section>
  );
}
