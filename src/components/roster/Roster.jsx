import useFaceitStats from "../../hooks/useFaceitStats";
import "./Roster.css";

const EXCLUDED_PLAYER = "kortavyj";

const OFFICIAL_ROLES = Object.freeze({
  infuriat3: "AWP",
  perinamara: "ENTRY",
  silryd: "RIFLER",
  tokyo1ng: "RIFLER",
  lor9n: "SUPPORT",
});

function normalizeNickname(value) {
  return String(value || "").trim().toLowerCase();
}

function countryToFlag(countryCode) {
  if (!countryCode || countryCode.length !== 2) {
    return "";
  }

  return countryCode
    .toUpperCase()
    .split("")
    .map((character) =>
      String.fromCodePoint(127397 + character.charCodeAt(0)),
    )
    .join("");
}

function PlayerAvatar({ player }) {
  const initial = player.nickname?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="player-avatar" aria-hidden="true">
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

function PlayerCard({ player }) {
  const faceitUrl = player.faceitUrl || "https://www.faceit.com/ru";
  const flag = countryToFlag(player.country);
  const level = Number.isFinite(player.level) ? player.level : "?";
  const nicknameKey = normalizeNickname(player.nickname);
  const officialRole = OFFICIAL_ROLES[nicknameKey];
  const roleLabel = officialRole || player.role || "RIFLER";
  const roleDescription = officialRole
    ? "Официальная роль игрока в составе ISTe"
    : player.reason || "Игровая роль участника команды ISTe";

  return (
    <a
      className="player-card"
      href={faceitUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={`Открыть FACEIT профиль игрока ${player.nickname}`}
    >
      <span className="player-card__external" aria-hidden="true">
        ↗
      </span>

      <PlayerAvatar player={player} />

      <div className="player-card__identity">
        <h3>{player.nickname}</h3>

        {flag ? (
          <span className="player-country" title={player.country}>
            {flag}
          </span>
        ) : null}
      </div>

      <p className="player-role" title={roleDescription}>
        {roleLabel}
      </p>

      <div className="player-card__badges">
        <span className="player-level">FACEIT LVL {level}</span>

        {player.captain ? (
          <span className="player-captain">CAPTAIN</span>
        ) : null}
      </div>

      <span className="player-role-note">
        официальная роль в составе
      </span>
    </a>
  );
}

function RosterSkeleton() {
  return (
    <div
      className="roster-grid"
      aria-label="Загрузка состава команды"
    >
      {Array.from({ length: 5 }, (_, index) => (
        <div
          className="player-card player-card--skeleton"
          key={index}
          aria-hidden="true"
        >
          <span className="skeleton skeleton--avatar" />
          <span className="skeleton skeleton--name" />
          <span className="skeleton skeleton--role" />
          <span className="skeleton skeleton--level" />
        </div>
      ))}
    </div>
  );
}

export default function Roster() {
  const { stats, loading, error, reload } = useFaceitStats();

  const roster = Array.isArray(stats.roster)
    ? stats.roster.filter(
        (player) =>
          normalizeNickname(player.nickname) !== EXCLUDED_PLAYER,
      )
    : [];

  return (
    <section className="section roster-section" id="roster">
      <header className="section-header">
        <p className="section-tag">ISTE ROSTER</p>
        <h2 className="section-title">СОСТАВ КОМАНДЫ</h2>

        <p className="roster-subtitle">
          Никнеймы, аватары и уровни загружаются напрямую
          из FACEIT. Игровые роли закреплены официальным
          составом ISTe.
        </p>
      </header>

      {loading && roster.length === 0 ? (
        <RosterSkeleton />
      ) : null}

      {!loading && roster.length > 0 ? (
        <div className="roster-grid">
          {roster.map((player) => (
            <PlayerCard
              player={player}
              key={player.playerId || player.nickname}
            />
          ))}
        </div>
      ) : null}

      {!loading && roster.length === 0 ? (
        <div className="roster-empty">
          <p>
            {error
              ? "Не удалось загрузить состав из FACEIT. Проверь запуск GitHub Actions и секрет FACEIT_API_KEY."
              : "FACEIT ещё не передал данные состава. Запусти обновление статистики в GitHub Actions."}
          </p>

          <div className="roster-empty__actions">
            <button type="button" onClick={reload}>
              Повторить загрузку
            </button>

            <a
              href={stats.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              Открыть команду FACEIT
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
