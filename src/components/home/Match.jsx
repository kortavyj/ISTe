import { Link } from "react-router-dom";

import useFaceitStats from "../../hooks/useFaceitStats.js";
import { useLanguage } from "../../i18n/LanguageContext.jsx";
import TeamMatchCard from "../matches/TeamMatchCard.jsx";

import "./Match.css";

function matchTime(match) {
  return (
    new Date(
      match?.scheduledAt ??
        match?.finishedAt ??
        0,
    ).getTime() || 0
  );
}

function selectFeaturedMatch(
  matches,
) {
  const ongoing = matches.find(
    (match) =>
      match?.status === "ongoing",
  );

  if (ongoing) {
    return {
      match: ongoing,
      tagKey:
        "home.matches.tagLive",
      titleKey:
        "home.matches.titleLive",
    };
  }

  const upcoming = matches
    .filter(
      (match) =>
        match?.status ===
        "upcoming",
    )
    .sort(
      (left, right) =>
        matchTime(left) -
        matchTime(right),
    )[0];

  if (upcoming) {
    return {
      match: upcoming,
      tagKey:
        "home.matches.tagNext",
      titleKey:
        "home.matches.titleNext",
    };
  }

  const finished = matches
    .filter(
      (match) =>
        match?.status ===
        "finished",
    )
    .sort(
      (left, right) =>
        matchTime(right) -
        matchTime(left),
    )[0];

  if (finished) {
    return {
      match: finished,
      tagKey:
        "home.matches.tagLast",
      titleKey:
        "home.matches.titleLast",
    };
  }

  return null;
}

export default function Match() {
  const { t } = useLanguage();

  const {
    stats,
    loading,
    error,
    reload,
  } = useFaceitStats();

  const matches =
    Array.isArray(
      stats.teamMatches,
    )
      ? stats.teamMatches
      : [];

  const featured =
    selectFeaturedMatch(matches);

  return (
    <section
      className="section match-section"
      id="matches"
    >
      <header className="section-header">
        <p className="section-tag">
          {featured
            ? t(featured.tagKey)
            : t(
                "home.matches.tagDefault",
              )}
        </p>

        <h2 className="section-title">
          {featured
            ? t(featured.titleKey)
            : t(
                "home.matches.titleDefault",
              )}
        </h2>
      </header>

      {featured ? (
        <TeamMatchCard
          match={featured.match}
          compact
        />
      ) : null}

      {!featured && !loading ? (
        <div className="match-section__empty">
          <p>
            {error
              ? t(
                  "home.matches.loadError",
                )
              : t(
                  "home.matches.noData",
                )}
          </p>

          {error ? (
            <button
              type="button"
              onClick={reload}
            >
              {t(
                "common.retryLoading",
              )}
            </button>
          ) : null}
        </div>
      ) : null}

      {loading && !featured ? (
        <div
          className="match-section__loading"
          aria-label={t(
            "home.matches.loading",
          )}
        />
      ) : null}

      <Link
        className="match-section__all"
        to="/matches"
      >
        {t(
          "home.matches.viewAll",
        )}

        <span aria-hidden="true">
          →
        </span>
      </Link>
    </section>
  );
}
