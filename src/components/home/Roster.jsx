import useFaceitStats from "../../hooks/useFaceitStats";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import sharedPlayerPortrait from "../../assets/players/team-player.webp";

import "./Roster.css";

const EXCLUDED_PLAYERS = new Set([
  "kortavyj",
  "infuriat3",
  "tokyok1ng",
  "hunter",
  "bandai",
  "ysgramora",
  "perinamara",
  "hak3p",
]);

const MAIN_ROSTER_ORDER = Object.freeze([
  "valaf",
  "1sagi",
  "anubis",
  "hagg1nho",
  "tw3ntyq",
]);

const CAPTAIN_NICKNAME = "anubis";

const SUBSTITUTE_PLAYERS = new Set([
  "sssoo",
  "fatalexcept",
]);

const ROLE_OVERRIDES = Object.freeze({
  valaf: "AWP",
  "1sagi": "RIFLER",
  hagg1nho: {
    uk: "SUPPORT",
    en: "SUPPORT",
  },
  tw3ntyq: "RIFLER",
  anubis: "IGL",
  lor9n: "AWP",
  silryd: "RIFLER",
});

const DISPLAY_NAME_OVERRIDES = Object.freeze({
  hagg1nho: "Hagg1CH",
});

function normalizeNickname(nickname) {
  return String(nickname || "")
    .trim()
    .toLowerCase();
}

function normalizeRosterKey(nickname) {
  return normalizeNickname(nickname).replace(/[^a-z0-9]/g, "");
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

      <img
          src={sharedPlayerPortrait}
          alt=""
          loading="lazy"
        />
    </div>
  );
}

function PlayerCard({ player, rosterStatus = "main" }) {
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

  const roleOverride = ROLE_OVERRIDES[nickname];

  const roleLabel =
    rosterStatus === "substitute"
      ? language === "en"
        ? "SUBSTITUTE"
        : "ЗАМЕНА"
      : typeof roleOverride === "object"
        ? roleOverride[language] || roleOverride.uk || player.role || "RIFLER"
        : roleOverride || player.role || "RIFLER";

  const displayName =
    DISPLAY_NAME_OVERRIDES[nickname] ||
    player.nickname;

  const roleDescription =
    rosterStatus === "substitute"
      ? language === "en"
        ? "ISTe substitute player"
        : "Игрок замены ISTe"
      : player.reason ||
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
        rosterStatus === "substitute"
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
            displayName,
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
          {displayName}
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
        {rosterStatus === "substitute"
          ? language === "en"
            ? "ISTe substitute"
            : "ИГРОК ЗАМЕНЫ ISTe"
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
          length: 3,
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
            !EXCLUDED_PLAYERS.has(
              normalizeNickname(
                player.nickname,
              ),
            ),
        )
      : [];

  const sortedRoster = [...roster].sort(
    (left, right) =>
      getRosterOrder(left) -
      getRosterOrder(right),
  );

  const mainRoster = sortedRoster.filter(
    (player) =>
      !SUBSTITUTE_PLAYERS.has(normalizeNickname(player.nickname)) &&
      !SUBSTITUTE_PLAYERS.has(normalizeRosterKey(player.nickname)),
  );

  const substituteRoster = sortedRoster.filter(
    (player) =>
      SUBSTITUTE_PLAYERS.has(normalizeNickname(player.nickname)) ||
      SUBSTITUTE_PLAYERS.has(normalizeRosterKey(player.nickname)),
  );

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
      substituteRoster.length > 0 ? (
        <div className="roster-substitutes">
          <div className="roster-substitutes__title">
            <span aria-hidden="true" />
            <strong>
              {language === "en" ? "SUBSTITUTE" : "ЗАМЕНА"}
            </strong>
            <span aria-hidden="true" />
          </div>

          <div className="roster-substitutes__grid">
            {substituteRoster.map(
              (player) => (
                <PlayerCard
                  player={player}
                  rosterStatus="substitute"
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
              FACEIT
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
