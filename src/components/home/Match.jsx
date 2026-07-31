import { Link } from "react-router-dom";

import useFaceitStats from "../../hooks/useFaceitStats.js";
import TeamMatchCard from "../matches/TeamMatchCard.jsx";

import "./Match.css";

function matchTime(match) {
  return new Date(match?.scheduledAt ?? match?.finishedAt ?? 0).getTime() || 0;
}

function selectFeaturedMatch(matches) {
  const ongoing = matches.find((match) => match?.status === "ongoing");
  if (ongoing) {
    return { match: ongoing, tag: "LIVE MATCH", title: "МАТЧ ИДЁТ СЕЙЧАС" };
  }

  const upcoming = matches
    .filter((match) => match?.status === "upcoming")
    .sort((left, right) => matchTime(left) - matchTime(right))[0];
  if (upcoming) {
    return { match: upcoming, tag: "NEXT MATCH", title: "БЛИЖАЙШИЙ МАТЧ" };
  }

  const finished = matches
    .filter((match) => match?.status === "finished")
    .sort((left, right) => matchTime(right) - matchTime(left))[0];
  if (finished) {
    return { match: finished, tag: "LAST MATCH", title: "ПОСЛЕДНИЙ МАТЧ" };
  }

  return null;
}

export default function Match() {
  const { stats, loading, error, reload } = useFaceitStats();
  const matches = Array.isArray(stats.teamMatches) ? stats.teamMatches : [];
  const featured = selectFeaturedMatch(matches);

  return (
    <section className="section match-section" id="matches">
      <header className="section-header">
        <p className="section-tag">{featured?.tag || "ISTE MATCHES"}</p>
        <h2 className="section-title">{featured?.title || "МАТЧИ КОМАНДЫ"}</h2>
        <p className="match-section__subtitle">
          Только матчи командного состава ISTe в турнирах FACEIT. История отдельных игроков сюда не попадает.
        </p>
      </header>

      {featured ? <TeamMatchCard match={featured.match} compact /> : null}

      {!featured && !loading ? (
        <div className="match-section__empty">
          <p>
            {error
              ? "Не удалось получить командные матчи из FACEIT."
              : "Командные матчи ещё не синхронизированы. Запусти полное обновление во вкладке GitHub Actions."}
          </p>
          {error ? <button type="button" onClick={reload}>Повторить загрузку</button> : null}
        </div>
      ) : null}

      {loading && !featured ? <div className="match-section__loading" aria-label="Загрузка матчей" /> : null}

      <Link className="match-section__all" to="/matches">
        Смотреть все матчи
        <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
