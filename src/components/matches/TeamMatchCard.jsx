import logo from "../../assets/logos/iste-logo.png";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./TeamMatchCard.css";

const locales = {
  uk: "uk-UA",
  ru: "ru-RU",
  en: "en-US",
};

function formatDate(
  value,
  locale,
  t,
) {
  if (!value) {
    return t(
      "home.matchCard.timeNotSet",
    );
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return t(
      "home.matchCard.timeNotSet",
    );
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(date);
}

function TeamLogo({
  image,
  name,
  own,
}) {
  const initial =
    String(name || "?")
      .trim()
      .charAt(0)
      .toUpperCase() || "?";

  return (
    <div
      className={`team-match-card__logo${
        own
          ? " team-match-card__logo--own"
          : ""
      }`}
    >
      <span>{initial}</span>

      <img
        src={own ? logo : image}
        alt=""
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={(event) => {
          event.currentTarget.hidden =
            true;
        }}
      />
    </div>
  );
}

function MatchScore({ match }) {
  const { t } = useLanguage();

  const ownScore =
    match?.ownTeam?.score;

  const opponentScore =
    match?.opponent?.score;

  const hasScore =
    Number.isFinite(ownScore) &&
    Number.isFinite(
      opponentScore,
    );

  if (hasScore) {
    return (
      <div
        className="team-match-card__score"
        aria-label={t(
          "home.matchCard.scoreAria",
          {
            own: ownScore,
            opponent:
              opponentScore,
          },
        )}
      >
        <strong>
          {ownScore}
        </strong>

        <span>:</span>

        <strong>
          {opponentScore}
        </strong>
      </div>
    );
  }

  return (
    <div className="team-match-card__versus">
      VS
    </div>
  );
}

export default function TeamMatchCard({
  match,
  compact = false,
}) {
  const {
    language,
    t,
  } = useLanguage();

  const status =
    match?.status ||
    "upcoming";

  const result =
    match?.result;

  const statusLabels = {
    ongoing: t(
      "home.matchCard.statusOngoing",
    ),
    upcoming: t(
      "home.matchCard.statusUpcoming",
    ),
    finished: t(
      "home.matchCard.statusFinished",
    ),
    cancelled: t(
      "home.matchCard.statusCancelled",
    ),
  };

  const resultLabels = {
    win: t(
      "home.matchCard.resultWin",
    ),
    loss: t(
      "home.matchCard.resultLoss",
    ),
    draw: t(
      "home.matchCard.resultDraw",
    ),
  };

  const resultLabel =
    resultLabels[result];

  const className = [
    "team-match-card",
    compact
      ? "team-match-card--compact"
      : "",
    result
      ? `team-match-card--${result}`
      : "",
    status === "ongoing"
      ? "team-match-card--live"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  const locale =
    locales[language] ||
    locales.uk;

  return (
    <article className={className}>
      <div className="team-match-card__topline">
        <span
          className={`team-match-card__status team-match-card__status--${status}`}
        >
          {statusLabels[status] ||
            "FACEIT"}
        </span>

        {resultLabel ? (
          <span
            className={`team-match-card__result team-match-card__result--${result}`}
          >
            {resultLabel}
          </span>
        ) : null}
      </div>

      <div className="team-match-card__competition">
        <p>
          {match?.competitionName ||
            "FACEIT"}
        </p>

        <span>
          {Number.isFinite(
            match?.bestOf,
          ) &&
          match.bestOf > 0
            ? `BO${match.bestOf}`
            : "CS2"}
        </span>
      </div>

      <div className="team-match-card__versus-row">
        <div className="team-match-card__team team-match-card__team--own">
          <TeamLogo
            image={
              match?.ownTeam?.avatar
            }
            name={
              match?.ownTeam?.name
            }
            own
          />

          <strong>
            {match?.ownTeam?.name ||
              "ISTe"}
          </strong>
        </div>

        <MatchScore
          match={match}
        />

        <div className="team-match-card__team">
          <TeamLogo
            image={
              match?.opponent?.avatar
            }
            name={
              match?.opponent?.name
            }
          />

          <strong>
            {match?.opponent?.name ||
              t(
                "home.matchCard.opponent",
              )}
          </strong>
        </div>
      </div>

      <div className="team-match-card__footer">
        <time
          dateTime={
            match?.scheduledAt ||
            undefined
          }
        >
          {formatDate(
            match?.scheduledAt,
            locale,
            t,
          )}
        </time>
      </div>
    </article>
  );
}
