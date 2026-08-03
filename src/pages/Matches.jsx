import {
  useMemo,
  useState,
} from "react";

import TeamMatchCard from "../components/matches/TeamMatchCard.jsx";
import useFaceitStats from "../hooks/useFaceitStats.js";
import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Matches.css";

const FILTERS = Object.freeze([
  {
    id: "all",
    labelKey:
      "matchesPage.filterAll",
  },
  {
    id: "upcoming",
    labelKey:
      "matchesPage.filterUpcoming",
  },
  {
    id: "finished",
    labelKey:
      "matchesPage.filterFinished",
  },
]);

const INITIAL_VISIBLE = 12;

const locales = {
  uk: "uk-UA",
  ru: "ru-RU",
  en: "en-US",
};

function matchTime(match) {
  return (
    new Date(
      match?.scheduledAt ??
        match?.finishedAt ??
        0,
    ).getTime() || 0
  );
}

function sortMatches(matches) {
  const byTimeAsc =
    (left, right) =>
      matchTime(left) -
      matchTime(right);

  const byTimeDesc =
    (left, right) =>
      matchTime(right) -
      matchTime(left);

  return [
    ...matches
      .filter(
        (match) =>
          match?.status ===
          "ongoing",
      )
      .sort(byTimeAsc),

    ...matches
      .filter(
        (match) =>
          match?.status ===
          "upcoming",
      )
      .sort(byTimeAsc),

    ...matches
      .filter(
        (match) =>
          match?.status ===
          "finished",
      )
      .sort(byTimeDesc),

    ...matches
      .filter(
        (match) =>
          ![
            "ongoing",
            "upcoming",
            "finished",
          ].includes(
            match?.status,
          ),
      )
      .sort(byTimeDesc),
  ];
}

function formatUpdatedAt(
  value,
  locale,
  t,
) {
  if (!value) {
    return t(
      "matchesPage.neverSynced",
    );
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return t(
      "matchesPage.unknownSyncTime",
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
    "matchesPage.updated",
    {
      date: formattedDate,
    },
  );
}

function getEmptyState(
  filter,
  error,
  t,
) {
  if (error) {
    return {
      title: t(
        "matchesPage.errorTitle",
      ),
      text: t(
        "matchesPage.errorText",
      ),
      action: "reload",
      label: t("common.retry"),
    };
  }

  if (filter === "upcoming") {
    return {
      title: t(
        "matchesPage.noUpcomingTitle",
      ),
      text: t(
        "matchesPage.noUpcomingText",
      ),
      action: "finished",
      label: t(
        "matchesPage.showFinished",
      ),
    };
  }

  if (filter === "finished") {
    return {
      title: t(
        "matchesPage.noFinishedTitle",
      ),
      text: t(
        "matchesPage.noFinishedText",
      ),
      action: "all",
      label: t(
        "matchesPage.showAll",
      ),
    };
  }

  return {
    title: t(
      "matchesPage.noMatchesTitle",
    ),
    text: t(
      "matchesPage.noMatchesText",
    ),
    action: "reload",
    label: t(
      "matchesPage.updateData",
    ),
  };
}

export default function Matches() {
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

  const [filter, setFilter] =
    useState("all");

  const [
    visibleCount,
    setVisibleCount,
  ] = useState(INITIAL_VISIBLE);

  const locale =
    locales[language] ||
    locales.uk;

  const matches = useMemo(
    () =>
      sortMatches(
        Array.isArray(
          stats.teamMatches,
        )
          ? stats.teamMatches
          : [],
      ),
    [stats.teamMatches],
  );

  const filteredMatches =
    useMemo(() => {
      if (
        filter === "upcoming"
      ) {
        return matches.filter(
          (match) =>
            [
              "upcoming",
              "ongoing",
            ].includes(
              match?.status,
            ),
        );
      }

      if (
        filter === "finished"
      ) {
        return matches.filter(
          (match) =>
            match?.status ===
            "finished",
        );
      }

      return matches;
    }, [filter, matches]);

  const upcomingCount =
    matches.filter((match) =>
      [
        "upcoming",
        "ongoing",
      ].includes(match?.status),
    ).length;

  const finishedCount =
    matches.filter(
      (match) =>
        match?.status ===
        "finished",
    ).length;

  const visibleMatches =
    filteredMatches.slice(
      0,
      visibleCount,
    );

  const emptyState =
    getEmptyState(
      filter,
      error,
      t,
    );

  function changeFilter(
    nextFilter,
  ) {
    setFilter(nextFilter);
    setVisibleCount(
      INITIAL_VISIBLE,
    );
  }

  function handleEmptyAction() {
    if (
      emptyState.action ===
      "reload"
    ) {
      reload();
      return;
    }

    changeFilter(
      emptyState.action,
    );
  }

  return (
    <section className="matches-page">
      <div
        className="matches-page__glow"
        aria-hidden="true"
      />

      <header className="matches-page__header">
        <p className="page-eyebrow">
          {t(
            "matchesPage.eyebrow",
          )}
        </p>

        <h1>
          {t(
            "matchesPage.title",
          )}
        </h1>

        <div
          className="matches-page__summary"
          aria-label={t(
            "matchesPage.summaryAria",
          )}
        >
          <div>
            <strong>
              {matches.length}
            </strong>
            <span>
              {t(
                "matchesPage.total",
              )}
            </span>
          </div>

          <div>
            <strong>
              {upcomingCount}
            </strong>
            <span>
              {t(
                "matchesPage.upcoming",
              )}
            </span>
          </div>

          <div>
            <strong>
              {finishedCount}
            </strong>
            <span>
              {t(
                "matchesPage.finished",
              )}
            </span>
          </div>
        </div>

        <div
          className="matches-page__sync"
          aria-live="polite"
        >
          <span
            className={
              error
                ? "matches-page__dot matches-page__dot--error"
                : "matches-page__dot"
            }
          />

          <span>
            {loading
              ? t(
                  "matchesPage.loadingFaceit",
                )
              : formatUpdatedAt(
                  stats.updatedAt,
                  locale,
                  t,
                )}
          </span>

          {error ? (
            <button
              type="button"
              onClick={reload}
            >
              {t("common.retry")}
            </button>
          ) : null}
        </div>
      </header>

      <div
        className="matches-page__filters"
        role="group"
        aria-label={t(
          "matchesPage.filterAria",
        )}
      >
        {FILTERS.map(
          (item) => (
            <button
              className={
                filter === item.id
                  ? "matches-page__filter matches-page__filter--active"
                  : "matches-page__filter"
              }
              key={item.id}
              type="button"
              onClick={() =>
                changeFilter(
                  item.id,
                )
              }
            >
              {t(item.labelKey)}
            </button>
          ),
        )}
      </div>

      {loading &&
      matches.length === 0 ? (
        <div
          className="matches-page__grid"
          aria-label={t(
            "matchesPage.loading",
          )}
        >
          {Array.from(
            {
              length: 6,
            },
            (_, index) => (
              <div
                className="matches-page__skeleton"
                key={index}
                aria-hidden="true"
              />
            ),
          )}
        </div>
      ) : null}

      {!loading &&
      visibleMatches.length > 0 ? (
        <div className="matches-page__grid">
          {visibleMatches.map(
            (match) => (
              <TeamMatchCard
                match={match}
                key={
                  match.matchId ||
                  `${match.tournamentId}:${match.scheduledAt}`
                }
              />
            ),
          )}
        </div>
      ) : null}

      {!loading &&
      filteredMatches.length === 0 ? (
        <div className="matches-page__empty">
          <h2>
            {emptyState.title}
          </h2>

          <p>
            {emptyState.text}
          </p>

          <div className="matches-page__empty-actions">
            <button
              type="button"
              onClick={
                handleEmptyAction
              }
            >
              {emptyState.label}
            </button>
          </div>
        </div>
      ) : null}

      {visibleCount <
      filteredMatches.length ? (
        <button
          className="matches-page__more"
          type="button"
          onClick={() =>
            setVisibleCount(
              (current) =>
                current +
                INITIAL_VISIBLE,
            )
          }
        >
          {t(
            "matchesPage.showMore",
          )}
        </button>
      ) : null}
    </section>
  );
}
