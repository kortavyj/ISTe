import useFaceitStats from "../hooks/useFaceitStats.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import riflerPortrait from "../assets/players/rifler-support.png";
import awpPortrait from "../assets/players/awp-main.png";
import perinamaraPortrait from "../assets/players/perinamara.png";

import "./Team.css";
import "./TeamStats.css";

const newcomerPortrait = "data:image/webp;base64,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";

const EXCLUDED_PLAYERS = new Set([
  "kortavyj",
  "infuriat3",
  "tokyok1ng",
]);

const PROFILE_ORDER = Object.freeze([
  "silryd",
  "lor9n",
  "perinamara",
  "bandai",
  "ysgramora",
]);

const PAGE_COPY = Object.freeze({
  uk: {
    title: "Гравці команди",
    description:
      "Кожен учасник має власний стиль, свою зону відповідальності та свій спосіб впливати на раунд. Тут зібрані ігрові портрети основного складу ISTe.",
    faceitProfile: "Відкрити профіль FACEIT",
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
    faceitProfile: "Open FACEIT profile",
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
  {
    sourceNickname: "perinamara",
    nickname: "Perinamara",
    roleLabel: "Entry Fragger",
    copy: {
      uk: {
        title: "Відкриття раундів і темп",
        description:
          "Відкриває раунди та задає темп грі. Першим виходить на контакт, бере на себе ризик і знаходить початкові фраги, руйнуючи оборону суперника. Швидко приймає рішення та створює простір, допомагаючи команді впевнено заходити на позицію.",
        strengths: ["Перший контакт", "Aim і реакція", "Агресія"],
      },
      en: {
        title: "Opening rounds and setting the pace",
        description:
          "Opens rounds and sets the pace of the game. Takes first contact, accepts the risk and finds opening kills that break the opponent's defence. Makes quick decisions and creates space for the team to enter positions with confidence.",
        strengths: ["First contact", "Aim and reactions", "Aggression"],
      },
    },
    portrait: perinamaraPortrait,
    portraitMode: "cutout",
    socials: [
      {
        name: "Instagram",
        url: "https://www.instagram.com/nikita5227_st/",
        icon: "instagram",
      },
    ],
  },
  {
    sourceNickname: "bandai",
    nickname: "bandai",
    roleLabel: "Rifler",
    copy: {
      uk: {
        title: "Стабільний rifler",
        description:
          "Грає від точності та дисципліни, впевнено тримає позиції, підключається до розмінів і зберігає темп команди в середніх та пізніх стадіях раунду.",
        strengths: ["Стрільба", "Розміни", "Стабільність"],
      },
      en: {
        title: "Consistent rifler",
        description:
          "Plays with precision and discipline, holds positions confidently, joins trades and keeps the team stable through the mid and late stages of the round.",
        strengths: ["Aim", "Trading", "Consistency"],
      },
    },
    portrait: newcomerPortrait,
    portraitMode: "cutout",
    socials: [
      {
        name: "TikTok",
        url: "https://www.tiktok.com/@xifo55",
        icon: "tiktok",
      },
      {
        name: "Twitch",
        url: "https://www.twitch.tv/bandai03",
        icon: "twitch",
      },
    ],
  },
  {
    sourceNickname: "ysgramora",
    nickname: "ysgramora",
    roleLabel: "Support",
    copy: {
      uk: {
        title: "Командний сапорт",
        description:
          "Підсилює команду через грамотне використання гранат, своєчасні розміни та уважну роботу з інформацією. Допомагає партнерам займати простір і стабілізує раунд у складних ситуаціях.",
        strengths: ["Гранати", "Комунікація", "Розміни"],
      },
      en: {
        title: "Team support",
        description:
          "Strengthens the team with smart utility usage, timely trades and reliable information work. Helps teammates take space and stabilizes difficult rounds.",
        strengths: ["Utility", "Communication", "Trading"],
      },
    },
    portrait: newcomerPortrait,
    portraitMode: "cutout",
    socials: [
      {
        name: "Twitch",
        url: "https://www.twitch.tv/hailrakeg",
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

function PlayerSocials({ socials, faceitUrl, copy }) {
  const links = Array.isArray(socials) ? socials : [];

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

      <a
        className="team-profile__faceit"
        href={faceitUrl}
        target="_blank"
        rel="noreferrer"
      >
        {copy.faceitProfile}
        <span aria-hidden="true">↗</span>
      </a>
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
  const faceitUrl = player.faceitUrl || "https://www.faceit.com";
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

        <PlayerSocials socials={profile.socials} faceitUrl={faceitUrl} copy={copy} />
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
