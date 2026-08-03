import useFaceitStats from "../../hooks/useFaceitStats";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./Roster.css";

const EXCLUDED_PLAYER = "kortavyj";

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

function PlayerCard({ player }) {
  const { t } = useLanguage();

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

  const roleLabel =
    player.role || "RIFLER";

  const roleDescription =
    player.reason ||
    t(
      "home.roster.roleFallback",
    );

  return (
    <a
      className="player-card"
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

      <PlayerAvatar
        player={player}
      />

      <div className="player-card__identity">
        <h3>
          {player.nickname}
        </h3>

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

        {player.captain ? (
          <span className="player-captain">
            {t(
              "home.roster.captain",
            )}
          </span>
        ) : null}
      </div>

      <span className="player-role-note">
        {t(
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
  const { t } = useLanguage();

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
            String(
              player.nickname || "",
            )
              .trim()
              .toLowerCase() !==
            EXCLUDED_PLAYER,
        )
      : [];

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
      roster.length === 0 ? (
        <RosterSkeleton />
      ) : null}

      {!loading &&
      roster.length > 0 ? (
        <div className="roster-grid">
          {roster.map(
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
