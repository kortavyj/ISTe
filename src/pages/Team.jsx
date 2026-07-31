import useFaceitStats from "../hooks/useFaceitStats.js";

import "./Team.css";

const EXCLUDED_PLAYER = "kortavyj";

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

function PlayerPortrait({ player }) {
  const initial = player.nickname?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="team-profile__portrait" aria-hidden="true">
      <span>{initial}</span>
      {player.avatar ? (
        <img
          src={player.avatar}
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
  const role = String(player.role || "RIFLER").toUpperCase();
  const profile = ROLE_PROFILES[role] || DEFAULT_PROFILE;
  const flag = countryToFlag(player.country);
  const level = Number.isFinite(player.level) ? player.level : "?";
  const faceitUrl = player.faceitUrl || "https://www.faceit.com/ru";

  return (
    <article className="team-profile">
      <div className="team-profile__visual">
        <span className="team-profile__number" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <PlayerPortrait player={player} />
        <div className="team-profile__scanline" aria-hidden="true" />
      </div>

      <div className="team-profile__content">
        <div className="team-profile__heading">
          <div>
            <p className="team-profile__role">{role}</p>
            <h2>{player.nickname}</h2>
          </div>

          <div className="team-profile__meta">
            {flag ? <span title={player.country}>{flag}</span> : null}
            <span>FACEIT LVL {level}</span>
          </div>
        </div>

        <p className="team-profile__title">{profile.title}</p>
        <p className="team-profile__description">{profile.description}</p>

        <div className="team-profile__strengths" aria-label="Сильные стороны игрока">
          {profile.strengths.map((strength) => (
            <span key={strength}>{strength}</span>
          ))}
        </div>

        <a
          className="team-profile__faceit"
          href={faceitUrl}
          target="_blank"
          rel="noreferrer"
        >
          Открыть профиль FACEIT
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  );
}

function ProfilesSkeleton() {
  return (
    <div className="team-profiles" aria-label="Загрузка игроков команды">
      {Array.from({ length: 4 }, (_, index) => (
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
    ? stats.roster.filter(
        (player) => String(player.nickname || "").trim().toLowerCase() !== EXCLUDED_PLAYER,
      )
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
          <span>{players.length || 4}</span>
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
              key={player.playerId || player.nickname}
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
          <button type="button" onClick={reload}>Повторить загрузку</button>
        </div>
      ) : null}
    </section>
  );
}
