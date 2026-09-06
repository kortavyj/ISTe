import isteLogo from "../../assets/logos/iste-logo.png";
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
  const { t } = useLanguage();

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
      </header>

      <div className="media-grid">
        {mediaItems.map(
          (item) => {
            const title = t(
              item.titleKey,
            );

            return (
              <a
                className={`media-card${
                  item.isBrandCard
                    ? " media-card-brand"
                    : ""
                }`}
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
    </section>
  );
}
