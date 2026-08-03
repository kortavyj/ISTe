import { Link } from "react-router-dom";

import logo from "../../assets/logos/iste-logo.png";
import useFaceitStats from "../../hooks/useFaceitStats.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./Hero.css";

const locales = {
  uk: "uk-UA",
  ru: "ru-RU",
  en: "en-US",
};

function formatNumber(
  value,
  locale,
  suffix = "",
) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value)
  ) {
    return "…";
  }

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(value)}${suffix}`;
}

function formatUpdatedAt(
  value,
  locale,
  t,
) {
  if (!value) {
    return t(
      "home.hero.waitingSync",
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t(
      "home.hero.unknownUpdateTime",
    );
  }

  const formattedDate =
    new Intl.DateTimeFormat(
      locale,
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      },
    ).format(date);

  return t(
    "home.hero.updated",
    {
      date: formattedDate,
    },
  );
}

export default function Hero() {
  const {
    language,
    t,
  } = useLanguage();

  const {
    stats,
    loading,
    error,
    reload,
  } = useFaceitStats();

  const locale =
    locales[language] ||
    locales.uk;

  const liveStats = [
    {
      value: formatNumber(
        stats.tournaments,
        locale,
      ),
      label: t(
        "home.hero.tournaments",
      ),
    },
    {
      value: formatNumber(
        stats.wins,
        locale,
      ),
      label: t(
        "home.hero.wins",
      ),
    },
    {
      value: formatNumber(
        stats.winRate,
        locale,
        "%",
      ),
      label: t(
        "home.hero.winRate",
      ),
    },
    {
      value: formatNumber(
        stats.players,
        locale,
      ),
      label: t(
        "home.hero.players",
      ),
    },
  ];

  return (
    <section
      className="hero"
      aria-labelledby="hero-title"
    >
      <div className="hero-content">
        <h1
          className="visually-hidden"
          id="hero-title"
        >
          {t("home.hero.title")}
        </h1>

        <img
          className="hero-logo"
          src={logo}
          alt="ISTe"
        />

        <p className="hero-slogan">
          PLAY • COMPETE • WIN
        </p>

        <div className="hero-buttons">
          <Link
            className="hero-button hero-button-primary"
            to="/team"
          >
            {t(
              "home.hero.rosterButton",
            )}
          </Link>

          <Link
            className="hero-button hero-button-secondary"
            to="/matches"
          >
            {t(
              "home.hero.matchesButton",
            )}
          </Link>
        </div>

        <div
          className="hero-live-status"
          aria-live="polite"
        >
          <span
            className={`hero-live-dot${
              error
                ? " hero-live-dot-error"
                : ""
            }`}
            aria-hidden="true"
          />

          <a
            href={stats.sourceUrl}
            target="_blank"
            rel="noreferrer"
          >
            FACEIT
          </a>

          <span>
            {loading
              ? t(
                  "home.hero.loadingStats",
                )
              : formatUpdatedAt(
                  stats.updatedAt,
                  locale,
                  t,
                )}
          </span>

          {error && (
            <button
              type="button"
              onClick={reload}
            >
              {t("common.retry")}
            </button>
          )}
        </div>

        <div
          className="hero-stats"
          aria-label={t(
            "home.hero.statsAria",
          )}
        >
          {liveStats.map(
            (stat) => (
              <div
                className="stat-card"
                key={stat.label}
              >
                <span className="stat-number">
                  {stat.value}
                </span>

                <span className="stat-label">
                  {stat.label}
                </span>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
