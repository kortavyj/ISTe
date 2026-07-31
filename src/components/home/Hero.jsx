import { Link } from "react-router-dom";

import logo from "../../assets/logos/iste-logo.png";
import useFaceitStats from "../../hooks/useFaceitStats.js";

import "./Hero.css";

function formatNumber(value, suffix = "") {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "…";
  }

  return `${new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 1,
  }).format(value)}${suffix}`;
}

function formatUpdatedAt(value) {
  if (!value) {
    return "Ожидание первой синхронизации";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Время обновления неизвестно";
  }

  return `Обновлено ${new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

export default function Hero() {
  const { stats, loading, error, reload } = useFaceitStats();
  const liveStats = [
    { value: formatNumber(stats.tournaments), label: "Турниров" },
    { value: formatNumber(stats.wins), label: "Побед" },
    { value: formatNumber(stats.winRate, "%"), label: "Винрейт" },
    { value: formatNumber(stats.players), label: "Игроков" },
  ];

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-content">
        <h1 className="visually-hidden" id="hero-title">
          Киберспортивная команда ISTe
        </h1>

        <img className="hero-logo" src={logo} alt="ISTe" />

        <p className="hero-slogan">PLAY • COMPETE • WIN</p>

        <div className="hero-buttons">
          <Link className="hero-button hero-button-primary" to="/team">
            СОСТАВ
          </Link>
          <Link className="hero-button hero-button-secondary" to="/matches">
            МАТЧИ
          </Link>
        </div>

        <div className="hero-live-status" aria-live="polite">
          <span
            className={`hero-live-dot${error ? " hero-live-dot-error" : ""}`}
            aria-hidden="true"
          />
          <a href={stats.sourceUrl} target="_blank" rel="noreferrer">
            FACEIT
          </a>
          <span>{loading ? "Загрузка статистики" : formatUpdatedAt(stats.updatedAt)}</span>
          {error && (
            <button type="button" onClick={reload}>
              Повторить
            </button>
          )}
        </div>

        <div className="hero-stats" aria-label="Статистика команды FACEIT">
          {liveStats.map((stat) => (
            <div className="stat-card" key={stat.label}>
              <span className="stat-number">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
