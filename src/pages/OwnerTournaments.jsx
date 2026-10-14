import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TournamentOwnerActions from "../components/tournaments/TournamentOwnerActions.jsx";
import "./OwnerTournaments.css";

const statusLabels = {
  draft: "Черновик", registration: "Регистрация", checkin: "Чекин",
  live: "В эфире", finished: "Завершён", cancelled: "Отменён",
};
const shortcuts = [
  { to: "/owner/tournaments-team-applications", number: "01", name: "Заявки команд", hint: "Проверка составов и допуск к турниру", tag: "Управление" },
  { to: "/owner/tournaments-bracket", number: "02", name: "Турнирная сетка", hint: "Матчи, результаты и продвижение команд", tag: "Управление" },
  { to: "/owner/tournaments-preview", number: "03", name: "Демо-сетка", hint: "Предпросмотр сетки без записи в базу", tag: "Демо" },
  { to: "/owner/tournaments-match-lab", number: "04", name: "Тест матчей", hint: "Проверка сценариев и ручного подсчёта", tag: "Демо" },
  { to: "/owner/tournaments-teams", number: "05", name: "Тест заявок", hint: "Демонстрация модерации команд", tag: "Демо" },
];

export default function OwnerTournaments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");

  const refresh = useCallback(async ({ signal } = {}) => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/tournaments-owner", {
        method: "GET", credentials: "include", cache: "no-store", signal,
        headers: { Accept: "application/json" },
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) {
        const message = result?.error === "TOURNAMENT_OWNER_LIST_RPC_NOT_INSTALLED"
          ? "Список турниров пока не подключён к базе."
          : result?.message || "Не удалось загрузить турниры. Проверьте сессию владельца и MFA.";
        throw new Error(message);
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

  const counts = useMemo(() => ({
    all: tournaments.length,
    active: tournaments.filter(t => ["registration", "checkin", "live"].includes(t.status)).length,
    drafts: tournaments.filter(t => t.status === "draft").length,
    finished: tournaments.filter(t => t.status === "finished").length,
  }), [tournaments]);

  const visible = useMemo(() => tournaments.filter(t => {
    const searchable = [t.title, t.slug, t.game].filter(Boolean).join(" ").toLowerCase();
    const matchesQuery = searchable.includes(query.trim().toLowerCase());
    const matchesFilter = filter === "all" ||
      (filter === "active" && ["registration", "checkin", "live"].includes(t.status)) ||
      (filter === "drafts" && t.status === "draft") ||
      (filter === "finished" && t.status === "finished");
    return matchesQuery && matchesFilter;
  }), [tournaments, query, filter]);

  return (
    <main className="ot-page">
      <div className="ot-crumbs"><Link to="/founder">Панель владельца</Link><span>/</span><span>Турниры</span></div>

      <header className="ot-hero">
        <div className="ot-hero-copy">
          <div className="ot-kicker"><span className="ot-pulse" /> ISTe ESPORTS <span className="ot-kicker-sep">/</span> CONTROL CENTER</div>
          <h1>Управление <span>турнирами</span></h1>
          <p>Единая панель организации CS2-турниров: заявки, команды, сетка и результаты.</p>
          <div className="ot-hero-actions">
            <Link className="ot-primary-link" to="/owner/tournaments-team-applications">Управление командами <span aria-hidden="true">↗</span></Link>
            <Link className="ot-secondary-link" to="/owner/tournaments-bracket">Открыть сетку <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="ot-hero-side">
          <div className="ot-system"><span className="ot-system-dot" /> СИСТЕМА ПОДКЛЮЧЕНА</div>
          <div className="ot-lock-icon" aria-hidden="true">▦</div>
          <div className="ot-read-label">РЕЖИМ ПРОСМОТРА</div>
          <div className="ot-read-desc">Создание и изменение временно отключены до завершения проверки.</div>
        </div>
      </header>

      <div className="ot-stats" aria-label="Статистика турниров">
        {[
          ["Всего турниров", counts.all, "all"],
          ["Активные", counts.active, "active"],
          ["Черновики", counts.drafts, "drafts"],
          ["Завершённые", counts.finished, "finished"],
        ].map(([label, value, id]) => (
          <button type="button" key={id} className={`ot-stat ${filter === id ? "is-selected" : ""}`}
            onClick={() => setFilter(id)} aria-pressed={filter === id}>
            <span className="ot-stat-label">{label}</span><span className="ot-stat-value">{value}</span>
            <span className="ot-stat-footer">{id === "all" ? "ВСЕ СОБЫТИЯ" : "ПОСМОТРЕТЬ →"}</span>
          </button>
        ))}
      </div>

      <section className="ot-workspace" aria-labelledby="ot-list-heading">
        <div className="ot-section-title">
          <div><span className="ot-section-index">01 / ТУРНИРЫ</span><h2 id="ot-list-heading">Мои турниры</h2><p>Турниры владельца, включая неопубликованные черновики.</p></div>
          <button type="button" className="ot-refresh" onClick={() => void refresh()} disabled={loading}>
            <span aria-hidden="true">↻</span> {loading ? "Обновляем…" : "Обновить данные"}
          </button>
        </div>
        <div className="ot-filterbar">
          <label className="ot-search"><span aria-hidden="true">⌕</span><span className="ot-sr-only">Поиск турниров</span>
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Найти турнир по названию или игре…" />
          </label>
          <div className="ot-tabs" aria-label="Фильтр турниров">
            {[["all","Все"],["active","Активные"],["drafts","Черновики"],["finished","Завершённые"]].map(([id,label]) => (
              <button key={id} type="button" className={filter === id ? "is-active" : ""} onClick={() => setFilter(id)} aria-pressed={filter === id}>{label}</button>
            ))}
          </div>
        </div>
        {loading && <div className="ot-empty" role="status"><span className="ot-empty-mark">◌</span><h3>Загружаем турниры</h3><p>Получаем актуальные данные с защищённого сервера.</p></div>}
        {!loading && error && <div className="ot-empty ot-error" role="alert"><span className="ot-empty-mark">!</span><h3>Не удалось загрузить данные</h3><p>{error}</p><button type="button" onClick={() => void refresh()}>Повторить запрос →</button></div>}
        {!loading && !error && !visible.length && <div className="ot-empty"><span className="ot-empty-mark">◇</span>
          <h3>{tournaments.length ? "Ничего не найдено" : "Первый турнир ещё впереди"}</h3>
          <p>{tournaments.length ? "Попробуйте изменить поиск или фильтр." : "Здесь появятся ваши турниры после их создания. Сейчас доступен безопасный просмотр и тестовые инструменты."}</p>
          {tournaments.length ? <button type="button" onClick={() => { setQuery(""); setFilter("all"); }}>Сбросить фильтры →</button> :
            <Link to="/owner/tournaments-preview">Посмотреть демонстрационную сетку →</Link>}
        </div>}
        {!loading && !error && visible.length > 0 && <div className="ot-list">{visible.map(t => (
          <article className="ot-item" key={t.id}>
            <div className="ot-item-main"><div className="ot-item-meta">{t.game || "CS2"} <span>•</span> {t.format === "single_elimination" ? "Single Elimination" : t.format || "Турнир"}</div>
              <h3>{t.title}</h3><div className="ot-item-detail"><span>{t.capacity} команд</span><span>BO{t.best_of}</span><span>{t.slug}</span></div>
              <TournamentOwnerActions tournament={t} onUpdated={refresh} />
            </div>
            <div className={`ot-status ot-status--${t.status || "draft"}`}>{statusLabels[t.status] || t.status || "Неизвестно"}</div>
          </article>
        ))}</div>}
      </section>

      <section className="ot-tools" aria-labelledby="ot-tools-heading">
        <div className="ot-section-title"><div><span className="ot-section-index">02 / ИНСТРУМЕНТЫ</span><h2 id="ot-tools-heading">Рабочее пространство</h2><p>Управление участниками, матчами и тестовыми сценариями.</p></div></div>
        <div className="ot-tools-grid">{shortcuts.map(item => <Link className="ot-tool" to={item.to} key={item.number}>
          <div className="ot-tool-top"><span>{item.number} / ISTe</span><span className={item.tag === "Демо" ? "ot-tool-tag ot-tool-tag--demo" : "ot-tool-tag"}>{item.tag}</span></div>
          <div><h3>{item.name}</h3><p>{item.hint}</p></div><span className="ot-tool-arrow" aria-hidden="true">↗</span>
        </Link>)}</div>
      </section>
      <footer className="ot-footer"><span>ISTe / TOURNAMENT OPERATIONS V2</span><Link to="/founder">← К панели владельца</Link></footer>
    </main>
  );
}
