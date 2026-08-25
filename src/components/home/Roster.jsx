import useFaceitStats from "../../hooks/useFaceitStats";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./Roster.css";

const EXCLUDED_PLAYER = "kortavyj";

const MAIN_ROSTER_ORDER = Object.freeze([
  "perinamara",
  "infuriat3",
  "lor9n",
  "silryd",
  "tokyok1ng",
]);

const ROLE_OVERRIDES = Object.freeze({
  infuriat3: "AWP",
  infuriat: "AWP",
  lor9n: "AWP",
  perinamara: "ENTRY",
  silryd: "RIFLER",
  tokyok1ng: "RIFLER",
  "-c1louse": "SUPPORT",
  c1louse: "SUPPORT",
});

const CAPTAIN_NICKNAME = "lor9n";

function normalizeNickname(nickname) {
  return String(nickname || "")
    .trim()
    .toLowerCase();
}

function isSubstitute(player) {
  const nickname = normalizeNickname(
    player?.nickname,
  );

  return (
    nickname === "-c1louse" ||
    nickname === "c1louse"
  );
}

function getRosterOrder(player) {
  const nickname = normalizeNickname(
    player?.nickname,
  );

  const index =
    MAIN_ROSTER_ORDER.indexOf(
      nickname,
    );

  return index === -1
    ? 999
    : index;
}

function countryToFlag(countryCode) {
  if (
    !countryCode ||
    countryCode.length !== 2
  ) {
    return "";
  }

  return countryCode
    .toUpperCase()
    .split("")
    .map((character) =>
      String.fromCodePoint(
        127397 +
          character.charCodeAt(0),
      ),
    )
    .join("");
}

function CrownIcon() {
  return (
    <svg
      className="player-crown"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M3 7.5 7.2 11 12 5l4.8 6L21 7.5l-1.6 9.2H4.6L3 7.5Z"
        fill="currentColor"
      />
      <path
        d="M5 19h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PlayerAvatar({ player }) {
  const initial =
    player.nickname
      ?.charAt(0)
      ?.toUpperCase() || "?";

  return (
    <div
      className="player-avatar"
      aria-hidden="true"
    >
      <span>{initial}</span>

      {player.avatar ? (
        <img
          src={player.avatar}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.hidden =
              true;
          }}
        />
      ) : null}
    </div>
  );
}

function PlayerCard({
  player,
  substitute = false,
}) {
  const { t, language } =
    useLanguage();

  const faceitUrl =
    player.faceitUrl ||
    "https://www.faceit.com";

  const flag =
    countryToFlag(
      player.country,
    );

  const level =
    Number.isFinite(player.level)
      ? player.level
      : "?";

  const nickname =
    normalizeNickname(
      player.nickname,
    );

  const isCaptain =
    nickname === CAPTAIN_NICKNAME;

  const roleLabel =
    ROLE_OVERRIDES[nickname] ||
    player.role ||
    "RIFLER";

  const roleDescription =
    player.reason ||
    t(
      "home.roster.roleFallback",
    );

  const captainTitle =
    language === "uk"
      ? "Капітан команди"
      : language === "en"
        ? "Team captain"
        : "Капитан команды";

  return (
    <a
      className={[
        "player-card",
        isCaptain
          ? "player-card--captain"
          : "",
        substitute
          ? "player-card--substitute"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      href={faceitUrl}
      target="_blank"
      rel="noreferrer"
      aria-label={t(
        "home.roster.openProfile",
        {
          nickname:
            player.nickname,
        },
      )}
    >
      <span
        className="player-card__external"
        aria-hidden="true"
      >
        ↗
      </span>

      {isCaptain ? (
        <span
          className="player-card__captain-mark"
          title={captainTitle}
          aria-label={captainTitle}
        >
          <CrownIcon />
        </span>
      ) : null}

      <PlayerAvatar
        player={player}
      />

      <div className="player-card__identity">
        <h3>
          {player.nickname}
        </h3>

        {isCaptain ? (
          <span
            className="player-card__inline-crown"
            title={captainTitle}
            aria-label={captainTitle}
          >
            <CrownIcon />
          </span>
        ) : null}

        {flag ? (
          <span
            className="player-country"
            title={player.country}
          >
            {flag}
          </span>
        ) : null}
      </div>

      <p
        className="player-role"
        title={roleDescription}
      >
        {roleLabel}
      </p>

      <div className="player-card__badges">
        <span className="player-level">
          FACEIT LVL {level}
        </span>
      </div>

      <span className="player-role-note">
        {substitute
          ? language === "uk"
            ? "ГРАВЕЦЬ ЗАМІНИ"
            : language === "en"
              ? "SUBSTITUTE PLAYER"
              : "ИГРОК ЗАМЕНЫ"
          : t(
              "home.roster.roleNote",
            )}
      </span>
    </a>
  );
}

function RosterSkeleton() {
  const { t } = useLanguage();

  return (
    <div
      className="roster-grid"
      aria-label={t(
        "home.roster.loading",
      )}
    >
      {Array.from(
        {
          length: 5,
        },
        (_, index) => (
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
        ),
      )}
    </div>
  );
}

export default function Roster() {
  const { t, language } =
    useLanguage();

  const {
    stats,
    loading,
    error,
    reload,
  } = useFaceitStats();

  const roster =
    Array.isArray(stats.roster)
      ? stats.roster.filter(
          (player) =>
            normalizeNickname(
              player.nickname,
            ) !==
            EXCLUDED_PLAYER,
        )
      : [];

  const mainRoster = roster
    .filter(
      (player) =>
        !isSubstitute(player),
    )
    .sort(
      (left, right) =>
        getRosterOrder(left) -
        getRosterOrder(right),
    );

  const substitutes = roster.filter(
    isSubstitute,
  );

  const substituteTitle =
    language === "uk"
      ? "ЗАМІНА"
      : language === "en"
        ? "SUBSTITUTE"
        : "ЗАМЕНА";

  return (
    <section
      className="section roster-section"
      id="roster"
    >
      <header className="section-header">
        <p className="section-tag">
          {t("home.roster.tag")}
        </p>

        <h2 className="section-title">
          {t("home.roster.title")}
        </h2>
      </header>

      {loading &&
      mainRoster.length === 0 ? (
        <RosterSkeleton />
      ) : null}

      {!loading &&
      mainRoster.length > 0 ? (
        <div className="roster-grid">
          {mainRoster.map(
            (player) => (
              <PlayerCard
                player={player}
                key={
                  player.playerId ||
                  player.nickname
                }
              />
            ),
          )}
        </div>
      ) : null}

      {!loading &&
      substitutes.length > 0 ? (
        <div className="roster-substitutes">
          <div className="roster-substitutes__title">
            <span />
            <strong>
              {substituteTitle}
            </strong>
            <span />
          </div>

          <div className="roster-substitutes__grid">
            {substitutes.map(
              (player) => (
                <PlayerCard
                  player={player}
                  substitute
                  key={
                    player.playerId ||
                    player.nickname
                  }
                />
              ),
            )}
          </div>
        </div>
      ) : null}

      {!loading &&
      roster.length === 0 ? (
        <div className="roster-empty">
          <p>
            {error
              ? t(
                  "home.roster.loadError",
                )
              : t(
                  "home.roster.noData",
                )}
          </p>

          <div className="roster-empty__actions">
            <button
              type="button"
              onClick={reload}
            >
              {t(
                "common.retryLoading",
              )}
            </button>

            <a
              href={stats.sourceUrl}
              target="_blank"
              rel="noreferrer"
            >
              {t(
                "home.roster.openTeam",
              )}
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
