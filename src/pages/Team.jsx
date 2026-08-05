import useFaceitStats from "../hooks/useFaceitStats.js";
import infuriat3Portrait from "../assets/players/infuriat3.png";
import ishidoriPortrait from "../assets/players/ishidori.png";
import riflerPortrait from "../assets/players/rifler-support.png";
import awpPortrait from "../assets/players/awp-main.png";
import perinamaraPortrait from "../assets/players/perinamara.png";

import "./Team.css";
import "./TeamStats.css";

const EXCLUDED_PLAYER = "kortavyj";

const PROFILE_ORDER = Object.freeze([
  "infuriat3",
  "tokyok1ng",
  "silryd",
  "lor9n",
  "perinamara",
]);

const CUSTOM_PROFILES = Object.freeze([
  {
    sourceNickname: "infuriat3",
    nickname: null,
    roleLabel: "IGL",
    title: "Игровое мышление",
    description:
      "Капитан, который читает игру на несколько шагов вперёд и выстраивает стратегию по ходу раунда. Грамотно распределяет ресурсы, координирует действия команды и адаптируется под стиль соперника, сохраняя контроль над ситуацией.",
    strengths: ["Принятие решений", "Командная координация", "Адаптивность"],
    portrait: infuriat3Portrait,
    portraitMode: "cutout",
    socials: [
      {
        name: "Instagram",
        url: "https://www.instagram.com/jay._.zgg/?hl=ru",
        icon: "instagram",
      },
      {
        name: "Twitch",
        url: "https://www.twitch.tv/jayyzzg",
        icon: "twitch",
      },
    ],
  },
  {
    sourceNickname: "tokyok1ng",
    nickname: "Ishidori",
    roleLabel: "Lurker",
    title: "Контроль карты и давление",
    description:
      "Находит тайминги, наказывает ротации и создаёт постоянную угрозу на флангах. Терпеливо ждёт момент для решающего выхода и меняет ход раунда одним действием.",
    strengths: ["Терпение", "Тайминги", "Контроль карты"],
    portrait: ishidoriPortrait,
    portraitMode: "cutout",
    socials: [
      {
        name: "Instagram",
        url: "https://www.instagram.com/wasureteikenai/",
        icon: "instagram",
      },
    ],
  },
  {
    sourceNickname: "silryd",
    nickname: "silryd",
    roleLabel: "Rifler",
    title: "Универсальный саппорт",
    description:
      "Контролирует темп раунда, помогает открывать позиции и обеспечивает команде преимущество за счёт использования гранат.",
    strengths: ["Гранаты", "Размены", "Адаптация"],
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
    title: "Контроль пространства и давление",
    description:
      "Снайпер — главный источник огневой мощи и контроля пространства. Обладая феноменальной реакцией и безупречным чувством позиционирования, он превращает AWP в инструмент психологического давления: он не просто собирает первые фраги, он лишает врага права на ошибку и заставляет его бояться каждого открытого угла.",
    strengths: ["Позиционирование", "Первый фраг", "Давление AWP"],
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
    title: "Открытие раундов и темп",
    description:
      "Открывает раунды и задаёт темп игре. Первым выходит на контакт, берёт на себя риск и находит начальные фраги, ломая оборону соперника. Быстро принимает решения и создаёт пространство, позволяя команде уверенно заходить на позицию.",
    strengths: ["Первый контакт", "Аим и реакция", "Агрессия"],
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
]);

const PROFILE_BY_NICKNAME = new Map(
  CUSTOM_PROFILES.map((profile) => [profile.sourceNickname, profile]),
);

const ROLE_PROFILES = Object.freeze({
  IGL: {
    title: "Голос команды",
    description:
      "Читает раунд на несколько шагов вперёд, задаёт темп и объединяет игроков вокруг одного решения. Быстро перестраивает план, когда соперник ломает привычный сценарий.",
    strengths: ["Координация", "Чтение карты", "Решения под давлением"],
  },
  AWP: {
    title: "Контроль дистанции",
    description:
      "Закрывает ключевые углы и заставляет соперника менять маршрут ещё до начала атаки. Его задача не только делать первый фраг, но и постоянно держать противника в напряжении.",
    strengths: ["Первый контакт", "Удержание углов", "Хладнокровие"],
  },
  ENTRY: {
    title: "Открывает пространство",
    description:
      "Первым входит в опасную зону, собирает информацию и создаёт место для всей команды. Играет агрессивно, но каждое движение направлено на общий размен и захват позиции.",
    strengths: ["Темп", "Дуэли", "Создание пространства"],
  },
  RIFLER: {
    title: "Универсальная огневая сила",
    description:
      "Подстраивается под любой рисунок раунда, уверенно играет на разменах и удерживает сложные позиции. Это игрок, который сохраняет стабильность, когда ситуация становится хаотичной.",
    strengths: ["Стабильность", "Размены", "Адаптация"],
  },
  SUPPORT: {
    title: "Основа командной игры",
    description:
      "Готовит атаки гранатами, страхует тиммейтов и делает незаметную работу, без которой сильный раунд не складывается. Всегда оказывается там, где команде нужна помощь.",
    strengths: ["Гранаты", "Страховка", "Командная дисциплина"],
  },
});

const DEFAULT_PROFILE = Object.freeze({
  title: "Надёжный игрок состава",
  description:
    "Сохраняет баланс между индивидуальной игрой и интересами команды. Умеет менять темп, поддерживать партнёров и принимать полезные решения в нестандартных ситуациях.",
  strengths: ["Командная игра", "Гибкость", "Самообладание"],
});

function normalizeNickname(nickname) {
  return String(nickname || "").trim().toLowerCase();
}

function countryToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return "";
  }

  return countryCode
    .toUpperCase()
    .split("")
    .map((character) => String.fromCodePoint(127397 + character.charCodeAt(0)))
    .join("");
}

function formatInteger(value) {
  return Number.isFinite(value) ? Math.round(value).toLocaleString("ru-RU") : "—";
}

function formatDecimal(value, digits) {
  return Number.isFinite(value)
    ? value.toLocaleString("ru-RU", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    : "—";
}

function SocialIcon({ type }) {
  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="12"
          cy="12"
          r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
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
        <path
          d="M9 8v5M15 8v5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (type === "steam") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle
          cx="15.5"
          cy="8.5"
          r="3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle
          cx="7"
          cy="16.5"
          r="2.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        />
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

  return null;
}

function PlayerSocials({ socials, faceitUrl }) {
  const links = Array.isArray(socials) ? socials : [];

  if (links.length === 0) {
    return (
      <a
        className="team-profile__faceit"
        href={faceitUrl}
        target="_blank"
        rel="noreferrer"
      >
        Открыть профиль FACEIT
        <span aria-hidden="true">↗</span>
      </a>
    );
  }

  return (
    <div
      aria-label="Социальные сети игрока"
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
            transition:
              "transform 180ms ease, background 180ms ease, box-shadow 180ms ease",
          }}
          onMouseEnter={(event) => {
            event.currentTarget.style.transform = "translateY(-3px)";
            event.currentTarget.style.background = "rgba(255, 37, 37, 0.18)";
            event.currentTarget.style.boxShadow =
              "0 0 28px rgba(255, 37, 37, 0.28)";
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.transform = "translateY(0)";
            event.currentTarget.style.background = "rgba(255, 37, 37, 0.08)";
            event.currentTarget.style.boxShadow =
              "0 0 24px rgba(255, 37, 37, 0.10)";
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

function PlayerProfile({ player, index }) {
  const normalizedNickname = normalizeNickname(player.nickname);
  const customProfile = PROFILE_BY_NICKNAME.get(normalizedNickname) || null;
  const fallbackRole = String(player.role || "RIFLER").toUpperCase();
  const fallbackProfile = ROLE_PROFILES[fallbackRole] || DEFAULT_PROFILE;
  const profile = customProfile || fallbackProfile;
  const displayName = customProfile?.nickname || player.nickname;
  const roleLabel = customProfile?.roleLabel || fallbackRole;
  const flag = countryToFlag(player.country);
  const level = Number.isFinite(player.level) ? player.level : "—";
  const elo = formatInteger(player.elo);
  const winRate = Number.isFinite(player.winRate)
    ? `${formatDecimal(player.winRate, 1)}%`
    : "—";
  const kd = formatDecimal(player.kd, 2);
  const faceitUrl = player.faceitUrl || "https://www.faceit.com/ru";
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
          aria-label={`Личная статистика FACEIT игрока ${displayName}`}
        >
          {personalStats.map((stat) => (
            <div className="team-profile__personal-stat" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
            </div>
          ))}
        </div>

        <p className="team-profile__title">{profile.title}</p>
        <p className="team-profile__description">{profile.description}</p>

        <div className="team-profile__strengths" aria-label="Сильные стороны игрока">
          {profile.strengths.map((strength) => (
            <span key={strength}>{strength}</span>
          ))}
        </div>

        <PlayerSocials socials={profile.socials} faceitUrl={faceitUrl} />
      </div>
    </article>
  );
}

function ProfilesSkeleton() {
  return (
    <div className="team-profiles" aria-label="Загрузка игроков команды">
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
  const { stats, loading, error, reload } = useFaceitStats();
  const players = Array.isArray(stats.roster)
    ? stats.roster
        .filter((player) => normalizeNickname(player.nickname) !== EXCLUDED_PLAYER)
        .filter((player) => PROFILE_BY_NICKNAME.has(normalizeNickname(player.nickname)))
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
        <h1>Игроки команды</h1>
        <p>
          У каждого участника свой стиль, своя зона ответственности и свой способ влиять
          на раунд. Здесь собраны игровые портреты основного состава ISTe.
        </p>
        <div className="team-page__counter">
          <span>{players.length || CUSTOM_PROFILES.length}</span>
          <small>PLAYER PROFILES</small>
        </div>
      </header>

      {loading && players.length === 0 ? <ProfilesSkeleton /> : null}

      {!loading && players.length > 0 ? (
        <div className="team-profiles">
          {players.map((player, index) => (
            <PlayerProfile
              player={player}
              index={index}
              key={player.playerId || `${index}-${player.nickname || "player"}`}
            />
          ))}
        </div>
      ) : null}

      {!loading && players.length === 0 ? (
        <div className="team-page__empty">
          <p>
            {error
              ? "Не удалось получить состав из FACEIT. Проверь GitHub Actions и секрет FACEIT_API_KEY."
              : "Состав ещё не синхронизирован. Запусти обновление FACEIT в GitHub Actions."}
          </p>
          <button type="button" onClick={reload}>
            Повторить загрузку
          </button>
        </div>
      ) : null}
    </section>
  );
}
