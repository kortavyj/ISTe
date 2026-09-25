import useFaceitStats from "../hooks/useFaceitStats.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import riflerPortrait from "../assets/players/rifler-support.png";
import awpPortrait from "../assets/players/awp-main.png";

import "./Team.css";
import "./TeamStats.css";


const EXCLUDED_PLAYERS = new Set([
  "kortavyj",
  "infuriat3",
  "tokyok1ng",
  "perinamara",
  "hak3p",
]);

const PROFILE_ORDER = Object.freeze([
  "valaf",
  "silryd",
  "lor9n",
]);

const PAGE_COPY = Object.freeze({
  uk: {
    title: "Гравці команди",
    description:
      "Кожен учасник має власний стиль, свою зону відповідальності та свій спосіб впливати на раунд. Тут зібрані ігрові портрети основного складу ISTe.",
    socialsAria: "Соціальні мережі гравця",
    statsAria: (name) => `Особиста статистика FACEIT гравця ${name}`,
    strengthsAria: "Сильні сторони гравця",
    loadingAria: "Завантаження гравців команди",
    loadError:
      "Не вдалося отримати склад із FACEIT. Перевір GitHub Actions і секрет FACEIT_API_KEY.",
    empty:
      "Склад ще не синхронізовано. Запусти оновлення FACEIT у GitHub Actions.",
    retry: "Повторити завантаження",
  },
  en: {
    title: "Team players",
    description:
      "Every player has a distinct style, area of responsibility and way of influencing a round. Here you can find the player profiles of the main ISTe roster.",
    socialsAria: "Player social media",
    statsAria: (name) => `${name} FACEIT personal statistics`,
    strengthsAria: "Player strengths",
    loadingAria: "Loading team players",
    loadError:
      "Could not retrieve the roster from FACEIT. Check GitHub Actions and the FACEIT_API_KEY secret.",
    empty:
      "The roster has not been synchronized yet. Run the FACEIT update in GitHub Actions.",
    retry: "Retry loading",
  },
});

const CUSTOM_PROFILES = Object.freeze([
  {
    sourceNickname: "valaf",
    nickname: "VALAF",
    roleLabel: "AWP",
    copy: {
      uk: {
        title: "Valentyn",
        description:
          "Основний снайпер ISTe. Контролює ключові кути, шукає перший контакт і створює простір для команди завдяки точній та холоднокровній грі з AWP.",
        strengths: ["Точність", "Позиціонування", "Клатчі"],
      },
      en: {
        title: "Valentyn",
        description:
          "ISTe's primary sniper. He controls key angles, looks for opening contacts and creates space for the team through precise and composed AWP play.",
        strengths: ["Precision", "Positioning", "Clutches"],
      },
    },
    portrait: null,
    portraitMode: "cutout",
    socials: [
      {
        name: "Twitch",
        url: "https://www.twitch.tv/valaf_",
        icon: "twitch",
      },
      {
        name: "Telegram",
        url: "https://t.me/valafff",
        icon: "telegram",
      },
    ],
  },
  {
    sourceNickname: "silryd",
    nickname: "silryd",
    roleLabel: "Rifler",
    copy: {
      uk: {
        title: "Універсальний сапорт",
        description:
          "Контролює темп раунду, допомагає відкривати позиції та забезпечує команді перевагу завдяки грамотному використанню гранат.",
        strengths: ["Гранати", "Розміни", "Адаптація"],
      },
      en: {
        title: "Versatile support",
        description:
          "Controls the pace of the round, helps open positions and gives the team an advantage through smart utility usage.",
        strengths: ["Utility", "Trading", "Adaptation"],
      },
    },
    portrait: riflerPortrait,
    portraitMode: "cutout",
    socials: [
      {
        name: "Instagram",
        url: "https://www.instagram.com/silryd/",
        icon: "instagram",
      },
      {
        name: "Twitch",
        url: "https://www.twitch.tv/silryd",
        icon: "twitch",
      },
    ],
  },
  {
    sourceNickname: "lor9n",
    nickname: "Lor9n",
    roleLabel: "AWP",
    copy: {
      uk: {
        title: "Контроль простору та тиск",
        description:
          "Снайпер є головним джерелом вогневої потужності та контролю простору. Завдяки швидкій реакції й точному позиціонуванню він перетворює AWP на інструмент постійного тиску, знаходить перші фраги та змушує суперника обережно грати кожен відкритий кут.",
        strengths: ["Позиціонування", "Перший фраг", "Тиск з AWP"],
      },
      en: {
        title: "Space control and pressure",
        description:
          "The sniper is a key source of firepower and map control. With fast reactions and precise positioning, he turns the AWP into a constant pressure tool, finds opening kills and forces opponents to respect every exposed angle.",
        strengths: ["Positioning", "Opening kill", "AWP pressure"],
      },
    },
    portrait: awpPortrait,
    portraitMode: "cutout",
    socials: [
      {
        name: "Steam",
        url: "https://steamcommunity.com/id/Lor9n/",
        icon: "steam",
      },
      {
        name: "Twitch",
        url: "https://www.twitch.tv/lor9n",
        icon: "twitch",
      },
    ],
  },

]);

const PROFILE_BY_NICKNAME = new Map(
  CUSTOM_PROFILES.map((profile) => [profile.sourceNickname, profile]),
);

function normalizeNickname(nickname) {
  return String(nickname || "").trim().toLowerCase();
}

function countryToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "";

  return countryCode
    .toUpperCase()
    .split("")
    .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join("");
}

function getLocale(language) {
  return language === "en" ? "en-US" : "uk-UA";
}

function formatInteger(value, language) {
  return Number.isFinite(value)
    ? Math.round(value).toLocaleString(getLocale(language))
    : "—";
}

function formatDecimal(value, digits, language) {
  return Number.isFinite(value)
    ? value.toLocaleString(getLocale(language), {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";
}

function SocialIcon({ type }) {
  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.4" cy="6.7" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  if (type === "twitch") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4 3h17v11.5l-4.8 4.8h-3.7L10 22H7v-2.7H3V6L4 3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        <path d="M9 8v5M15 8v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (type === "telegram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M21.5 3.5 18.2 19c-.25 1.1-.9 1.35-1.82.84l-5.03-3.71-2.43 2.34c-.27.27-.5.5-1.02.5l.36-5.12 9.32-8.42c.4-.36-.09-.56-.63-.2L5.43 12.5.47 10.95c-1.08-.34-1.1-1.08.23-1.6L20.1 1.87c.9-.33 1.69.2 1.4 1.63Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (type === "steam") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="15.5" cy="8.5" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="7" cy="16.5" r="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M9.2 15.3l3.6-2.2M4.8 15.4 2.5 14.5M18.7 11.1l2.5 1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "tiktok") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14.5 4v10.1a4.1 4.1 0 1 1-3.5-4.05v2.65a1.7 1.7 0 1 0 1.1 1.6V4h2.4Zm0 0c.45 2.2 1.8 3.65 4 4.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return null;
}

function PlayerSocials({ socials, copy }) {
  const links = Array.isArray(socials) ? socials : [];

  if (links.length === 0) {
    return null;
  }

  return (
    <div
      aria-label={copy.socialsAria}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "30px",
      }}
    >
      {links.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noreferrer"
          aria-label={social.name}
          title={social.name}
          style={{
            display: "grid",
            width: "46px",
            height: "46px",
            placeItems: "center",
            border: "1px solid rgba(255, 55, 55, 0.42)",
            borderRadius: "14px",
            background: "rgba(255, 37, 37, 0.08)",
            boxShadow: "0 0 24px rgba(255, 37, 37, 0.10)",
            color: "#ffffff",
            transition: "transform 180ms ease, background 180ms ease, box-shadow 180ms ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = "translateY(-3px)";
            event.currentTarget.style.background = "rgba(255, 37, 37, 0.18)";
            event.currentTarget.style.boxShadow = "0 0 28px rgba(255, 37, 37, 0.28)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = "translateY(0)";
            event.currentTarget.style.background = "rgba(255, 37, 37, 0.08)";
            event.currentTarget.style.boxShadow = "0 0 24px rgba(255, 37, 37, 0.10)";
          }}
        >
          <span style={{ display: "grid", width: "23px", height: "23px" }}>
            <SocialIcon type={social.icon} />
          </span>
        </a>
      ))}
    </div>
  );
}

function PlayerPortrait({ player, profile, displayName }) {
  const initial =
    displayName?.charAt(0)?.toUpperCase() ||
    player.nickname?.charAt(0)?.toUpperCase() ||
    "?";
  const portrait = profile.portrait || player.avatar;
  const isCutout = profile.portraitMode === "cutout";

  return (
    <div
      className={`team-profile__portrait${isCutout ? " team-profile__portrait--cutout" : ""}`}
      aria-hidden="true"
    >
      {!isCutout ? <span>{initial}</span> : null}
      {portrait ? (
        <img
          src={portrait}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.hidden = true;
          }}
        />
      ) : null}
    </div>
  );
}

function PlayerProfile({ player, index, language, copy }) {
  const normalizedNickname = normalizeNickname(player.nickname);
  const profile = PROFILE_BY_NICKNAME.get(normalizedNickname);

  if (!profile) return null;

  const profileCopy = profile.copy[language] || profile.copy.uk;
  const displayName = profile.nickname || player.nickname;
  const roleLabel = profile.roleLabel || String(player.role || "RIFLER").toUpperCase();
  const flag = countryToFlag(player.country);
  const level = Number.isFinite(player.level) ? player.level : "—";
  const elo = formatInteger(player.elo, language);
  const winRate = Number.isFinite(player.winRate)
    ? `${formatDecimal(player.winRate, 1, language)}%`
    : "—";
  const kd = formatDecimal(player.kd, 2, language);
  const isCutout = profile.portraitMode === "cutout";

  const personalStats = [
    { label: "LEVEL", value: level },
    { label: "ELO", value: elo },
    { label: "WINRATE", value: winRate },
    { label: "K/D", value: kd },
  ];

  return (
    <article className={`team-profile${isCutout ? " team-profile--cutout" : ""}`}>
      <div className={`team-profile__visual${isCutout ? " team-profile__visual--cutout" : ""}`}>
        <span className="team-profile__number" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <PlayerPortrait player={player} profile={profile} displayName={displayName} />
        <div className="team-profile__scanline" aria-hidden="true" />
      </div>

      <div className="team-profile__content">
        <div className="team-profile__heading">
          <div>
            <p className="team-profile__role">{roleLabel}</p>
            <h2>{displayName}</h2>
          </div>

          <div className="team-profile__meta">
            {flag ? <span title={player.country}>{flag}</span> : null}
            <span>FACEIT</span>
          </div>
        </div>

        <div
          className="team-profile__personal-stats"
          aria-label={copy.statsAria(displayName)}
        >
          {personalStats.map((stat) => (
            <div className="team-profile__personal-stat" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        <p className="team-profile__title">{profileCopy.title}</p>
        <p className="team-profile__description">{profileCopy.description}</p>

        <div className="team-profile__strengths" aria-label={copy.strengthsAria}>
          {profileCopy.strengths.map((strength) => (
            <span key={strength}>{strength}</span>
          ))}
        </div>

        <PlayerSocials socials={profile.socials} copy={copy} />
      </div>
    </article>
  );
}

function ProfilesSkeleton({ copy }) {
  return (
    <div className="team-profiles" aria-label={copy.loadingAria}>
      {Array.from({ length: CUSTOM_PROFILES.length }, (_, index) => (
        <div className="team-profile team-profile--loading" key={index} aria-hidden="true">
          <div className="team-profile__visual" />
          <div className="team-profile__content">
            <span className="team-skeleton team-skeleton--small" />
            <span className="team-skeleton team-skeleton--title" />
            <span className="team-skeleton team-skeleton--text" />
            <span className="team-skeleton team-skeleton--text" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Team() {
  const { language } = useLanguage();
  const { stats, loading, error, reload } = useFaceitStats();
  const copy = PAGE_COPY[language] || PAGE_COPY.uk;

  const players = Array.isArray(stats.roster)
    ? stats.roster
        .filter(
          (player) => !EXCLUDED_PLAYERS.has(normalizeNickname(player.nickname)),
        )
        .filter((player) =>
          PROFILE_BY_NICKNAME.has(normalizeNickname(player.nickname)),
        )
        .sort((left, right) => {
          const leftIndex = PROFILE_ORDER.indexOf(normalizeNickname(left.nickname));
          const rightIndex = PROFILE_ORDER.indexOf(normalizeNickname(right.nickname));
          return leftIndex - rightIndex;
        })
    : [];

  return (
    <section className="team-page">
      <div className="team-page__glow" aria-hidden="true" />

      <header className="team-page__header">
        <p className="page-eyebrow">ISTE PLAYER PROFILES</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <div className="team-page__counter">
          <span>{players.length || CUSTOM_PROFILES.length}</span>
          <small>PLAYER PROFILES</small>
        </div>
      </header>

      {loading && players.length === 0 ? <ProfilesSkeleton copy={copy} /> : null}

      {!loading && players.length > 0 ? (
        <div className="team-profiles">
          {players.map((player, index) => (
            <PlayerProfile
              player={player}
              index={index}
              language={language}
              copy={copy}
              key={player.playerId || `${index}-${player.nickname || "player"}`}
            />
          ))}
        </div>
      ) : null}

      {!loading && players.length === 0 ? (
        <div className="team-page__empty">
          <p>{error ? copy.loadError : copy.empty}</p>
          <button type="button" onClick={reload}>
            {copy.retry}
          </button>
        </div>
      ) : null}
    </section>
  );
}
