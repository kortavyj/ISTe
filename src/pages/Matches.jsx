import { useMemo, useState } from "react";

import TeamMatchCard from "../components/matches/TeamMatchCard.jsx";
import useFaceitStats from "../hooks/useFaceitStats.js";

import "./Matches.css";

const FILTERS = Object.freeze([
  { id: "all", label: "Все" },
  { id: "upcoming", label: "Предстоящие" },
  { id: "finished", label: "Завершённые" },
]);

const INITIAL_VISIBLE = 12;

function matchTime(match) {
  return new Date(match?.scheduledAt ?? match?.finishedAt ?? 0).getTime() || 0;
}

function sortMatches(matches) {
  const ongoing = matches
    .filter((match) => match?.status === "ongoing")
    .sort((left, right) => matchTime(left) - matchTime(right));
  const upcoming = matches
    .filter((match) => match?.status === "upcoming")
    .sort((left, right) => matchTime(left) - matchTime(right));
  const finished = matches
    .filter((match) => match?.status === "finished")
    .sort((left, right) => matchTime(right) - matchTime(left));
  const other = matches
    .filter(
      (match) => !["ongoing", "upcoming", "finished"].includes(match?.status),
    )
    .sort((left, right) => matchTime(right) - matchTime(left));

  return [...ongoing, ...upcoming, ...finished, ...other];
}

function formatUpdatedAt(value) {
  if (!value) {
    return "Синхронизация ещё не выполнялась";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Время синхронизации неизвестно";
  }

  return `FACEIT обновлён ${new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

export default function Matches() {
  const { stats, loading, error, reload } = useFaceitStats();
  const [filter, setFilter] = useState("all");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);
  const matches = useMemo(
    () => sortMatches(Array.isArray(stats.teamMatches) ? stats.teamMatches : []),
    [stats.teamMatches],
  );
  const filteredMatches = useMemo(() => {
    if (filter === "upcoming") {
      return matches.filter((match) => ["upcoming", "ongoing"].includes(match?.status));
    }

    if (filter === "finished") {
      return matches.filter((match) => match?.status === "finished");
    }

    return matches;
  }, [filter, matches]);
  const visibleMatches = filteredMatches.slice(0, visibleCount);
  const upcomingCount = matches.filter((match) =>
    ["upcoming", "ongoing"].includes(match?.status),
  ).length;
  const finishedCount = matches.filter((match) => match?.status === "finished").length;

  const changeFilter = (nextFilter) => {
    setFilter(nextFilter);
    setVisibleCount(INITIAL_VISIBLE);
  };

  return (
    <section className="matches-page">
      <div className="matches-page__glow" aria-hidden="true" />

      <header className="matches-page__header">
        <p className="page-eyebrow">ISTE MATCH CENTER</p>
        <h1>Матчи команды</h1>
        <p>
          Здесь собраны матчи именно командного состава ISTe в турнирах FACEIT.
          Персональная история матчей отдельных игроков не используется.
        </p>

        <div className="matches-page__summary" aria-label="Сводка по матчам">
          <div>
            <strong>{matches.length}</strong>
            <span>Всего найдено</span>
          </div>
          <div>
            <strong>{upcomingCount}</strong>
            <span>Предстоит</span>
          </div>
          <div>
            <strong>{finishedCount}</strong>
            <span>Завершено</span>
          </div>
        </div>

        <div className="matches-page__sync" aria-live="polite">
          <span className={error ? "matches-page__dot matches-page__dot--error" : "matches-page__dot"} />
          <span>{loading ? "Загрузка матчей FACEIT" : formatUpdatedAt(stats.updatedAt)}</span>
          {error ? (
            <button type="button" onClick={reload}>Повторить</button>
          ) : null}
        </div>
      </header>

      <div className="matches-page__filters" role="group" aria-label="Фильтр матчей">
        {FILTERS.map((item) => (
          <button
            className={filter === item.id ? "matches-page__filter matches-page__filter--active" : "matches-page__filter"}
            key={item.id}
            type="button"
            onClick={() => changeFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading && matches.length === 0 ? (
        <div className="matches-page__grid" aria-label="Загрузка матчей">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="matches-page__skeleton" key={index} aria-hidden="true" />
          ))}
        </div>
      ) : null}

      {!loading && visibleMatches.length > 0 ? (
        <div className="matches-page__grid">
          {visibleMatches.map((match) => (
            <TeamMatchCard match={match} key={match.matchId || `${match.tournamentId}:${match.scheduledAt}`} />
          ))}
        </div>
      ) : null}

      {!loading && filteredMatches.length === 0 ? (
        <div className="matches-page__empty">
          <h2>Матчей пока нет</h2>
          <p>
            {error
              ? "Не удалось загрузить данные. Проверь секрет FACEIT_API_KEY и запуск GitHub Actions."
              : "FACEIT пока не вернул командные турнирные матчи для выбранного раздела. Запусти полную синхронизацию вручную во вкладке Actions."}
          </p>
          <div className="matches-page__empty-actions">
            <button type="button" onClick={reload}>Обновить данные</button>
            <a href={stats.sourceUrl} target="_blank" rel="noreferrer">Открыть команду FACEIT</a>
          </div>
        </div>
      ) : null}

      {visibleCount < filteredMatches.length ? (
        <button
          className="matches-page__more"
          type="button"
          onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE)}
        >
          Показать ещё матчи
        </button>
      ) : null}
    </section>
  );
}
