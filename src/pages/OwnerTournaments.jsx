import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./OwnerTournaments.css";
import TournamentOwnerActions from "../components/tournaments/TournamentOwnerActions.jsx";

export default function OwnerTournaments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tournaments, setTournaments] = useState([]);

  const refresh = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tournaments-owner", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
        signal,
        headers: { Accept: "application/json" },
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) {
        if (result?.error === "TOURNAMENT_SCHEMA_NOT_INSTALLED") {
          throw new Error("База турниров ещё не подключена. Это ожидаемо: миграции пока не применялись.");
        }
        throw new Error(result?.message || "Не удалось загрузить турниры.");
      }
      setTournaments(Array.isArray(result.tournaments) ? result.tournaments : []);
    } catch (cause) {
      if (cause?.name !== "AbortError") setError(cause?.message || "Сервер временно недоступен.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void refresh({ signal: controller.signal });
    return () => controller.abort();
  }, [refresh]);

  return (
    <section className="ot-page">
      <div className="ot-head">
        <div>
          <p className="ot-eyebrow">ISTe / OWNER CONTROL</p>
          <h1>TOURNAMENTS <em>V2</em></h1>
          <p className="ot-subtitle">Панель организатора · безопасный просмотр данных</p>
        </div>
        <span className="ot-mode">READ ONLY</span>
      </div>

      <div className="ot-notice" role="status">
        Создание и изменение турниров пока отключены. Тестовая сетка доступна отдельно,
        а этот раздел получает данные только с защищённого сервера.
      </div>

      <div className="ot-toolbar">
        <div>
          <h2>Мои турниры</h2>
          <p>Отображаются только опубликованные турниры. Черновики станут доступны после проверки серверных прав.</p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading}>
          {loading ? "Загрузка…" : "Обновить"}
        </button>
      </div>

      {loading ? <div className="ot-state" role="status">Загружаем турниры…</div> : null}
      {!loading && error ? <div className="ot-state ot-error" role="alert">
        <strong>Данные пока недоступны</strong><p>{error}</p>
      </div> : null}
      {!loading && !error && !tournaments.length ? <div className="ot-state">
        <strong>Опубликованных турниров пока нет</strong>
        <p>После подключения базы здесь появятся реальные турниры ISTe.</p>
      </div> : null}

      {!loading && !error && tournaments.length > 0 ? (
        <div className="ot-list">
          {tournaments.map((t) => (
            <article className="ot-item" key={t.id}>
              <div><p className="ot-eyebrow">{t.game || "CS2"} · {t.format || "single_elimination"}</p>
                <h3>{t.title}</h3>
                <p>{t.capacity} команд · BO{t.best_of} · {t.slug}</p>
                <TournamentOwnerActions tournament={t} onUpdated={refresh} /></div>
              <span>{t.status}</span>
            </article>
          ))}
        </div>
      ) : null}

      <div className="ot-links">
        <Link to="/owner/tournaments-preview">Открыть демонстрационную сетку →</Link>
        <Link to="/owner/tournaments-match-lab">Ручное управление матчами (демо) →</Link>
        <Link to="/owner/tournaments-teams">Рассмотрение заявок команд (демо) →</Link>
        <Link to="/owner/tournaments-team-applications">Реальные заявки (только просмотр) →</Link>
        <Link to="/owner/tournaments-bracket">Реальная турнирная сетка (только просмотр) →</Link>
        <Link to="/founder">← Вернуться в панель владельца</Link>
      </div>
    </section>
  );
}
