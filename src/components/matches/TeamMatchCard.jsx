import logo from "../../assets/logos/iste-logo.png";

import "./TeamMatchCard.css";

const STATUS_LABELS = Object.freeze({
  ongoing: "ИДЁТ СЕЙЧАС",
  upcoming: "ПРЕДСТОИТ",
  finished: "ЗАВЕРШЁН",
  cancelled: "ОТМЕНЁН",
});

const RESULT_LABELS = Object.freeze({
  win: "ПОБЕДА",
  loss: "ПОРАЖЕНИЕ",
  draw: "НИЧЬЯ",
});

function formatDate(value) {
  if (!value) {
    return "Время не назначено";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Время не назначено";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function TeamLogo({ image, name, own }) {
  const initial = String(name || "?").trim().charAt(0).toUpperCase() || "?";

  return (
    <div className={`team-match-card__logo${own ? " team-match-card__logo--own" : ""}`}>
      <span>{initial}</span>
      <img
        src={own ? logo : image}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(event) => {
          event.currentTarget.hidden = true;
        }}
      />
    </div>
  );
}

function MatchScore({ match }) {
  const ownScore = match?.ownTeam?.score;
  const opponentScore = match?.opponent?.score;
  const hasScore = Number.isFinite(ownScore) && Number.isFinite(opponentScore);

  if (hasScore) {
    return (
      <div className="team-match-card__score" aria-label={`Счёт ${ownScore} ${opponentScore}`}>
        <strong>{ownScore}</strong>
        <span>:</span>
        <strong>{opponentScore}</strong>
      </div>
    );
  }

  return <div className="team-match-card__versus">VS</div>;
}

export default function TeamMatchCard({ match, compact = false }) {
  const status = match?.status || "upcoming";
  const result = match?.result;
  const resultLabel = RESULT_LABELS[result];
  const url = match?.faceitUrl || "https://www.faceit.com/ru";
  const className = [
    "team-match-card",
    compact ? "team-match-card--compact" : "",
    result ? `team-match-card--${result}` : "",
    status === "ongoing" ? "team-match-card--live" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <a className={className} href={url} target="_blank" rel="noreferrer">
      <div className="team-match-card__topline">
        <span className={`team-match-card__status team-match-card__status--${status}`}>
          {STATUS_LABELS[status] || "FACEIT"}
        </span>
        {resultLabel ? (
          <span className={`team-match-card__result team-match-card__result--${result}`}>
            {resultLabel}
          </span>
        ) : null}
      </div>

      <div className="team-match-card__competition">
        <p>{match?.competitionName || "FACEIT"}</p>
        <span>
          {Number.isFinite(match?.bestOf) && match.bestOf > 0 ? `BO${match.bestOf}` : "CS2"}
        </span>
      </div>

      <div className="team-match-card__versus-row">
        <div className="team-match-card__team team-match-card__team--own">
          <TeamLogo image={match?.ownTeam?.avatar} name={match?.ownTeam?.name} own />
          <strong>{match?.ownTeam?.name || "ISTe"}</strong>
        </div>

        <MatchScore match={match} />

        <div className="team-match-card__team">
          <TeamLogo image={match?.opponent?.avatar} name={match?.opponent?.name} />
          <strong>{match?.opponent?.name || "Соперник"}</strong>
        </div>
      </div>

      <div className="team-match-card__footer">
        <time dateTime={match?.scheduledAt || undefined}>{formatDate(match?.scheduledAt)}</time>
        <span>
          Открыть матч FACEIT
          <b aria-hidden="true">↗</b>
        </span>
      </div>
    </a>
  );
}
