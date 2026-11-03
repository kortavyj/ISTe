import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import TournamentOwnerActions from "../components/tournaments/TournamentOwnerActions.jsx";
import "./OwnerTournaments.css";
import "./TournamentPremiumTheme.css";

const statusLabels = {
  draft: "Черновик", registration: "Регистрация", checkin: "Чекин",
  live: "В эфире", finished: "Завершён", cancelled: "Отменён",
};
const NEW_TOURNAMENT = {
  title: "", slug: "", capacity: 8, best_of: 3,
  registration_start: "", registration_end: "", starts_at: "",
};

function toSlug(value) {
  return String(value || "").normalize("NFKD").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

function dateToIso(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) throw new Error("Некорректная дата.");
  return parsed.toISOString();
}

const shortcuts = [
  { to: "/owner/tournaments-team-applications", number: "01", name: "Заявки команд", hint: "Реальные заявки, проверка составов и одобрение", tag: "Управление", icon: "users" },
  { to: "/owner/tournaments-bracket?mode=server", number: "02", name: "Турнирная сетка", hint: "Сетка реального турнира и продвижение команд", tag: "Управление", icon: "bracket" },
  { action: "create", number: "03", name: "Создать турнир", hint: "Создание черновика с настройками CS2", tag: "Создание", icon: "plus" },
  { to: "/owner/tournaments-bracket?mode=server", number: "04", name: "Результаты матчей", hint: "Ввод счетов BO1, BO3, BO5 с записью в базу", tag: "Управление", icon: "score" },
  { action: "schedule", number: "05", name: "Календарь турниров", hint: "Даты регистрации, старты и текущие статусы", tag: "Расписание", icon: "calendar" },
];

export default function OwnerTournaments() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tournaments, setTournaments] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [writesEnabled, setWritesEnabled] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState(NEW_TOURNAMENT);
  const [slugEdited, setSlugEdited] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createNotice, setCreateNotice] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);

  const schedule = useMemo(() => [...tournaments]
    .filter(item => item.starts_at || item.registration_start || item.registration_end)
    .sort((a, b) => new Date(a.starts_at || a.registration_start || a.registration_end) - new Date(b.starts_at || b.registration_start || b.registration_end)),
    [tournaments]);

  function openCreate() {
    if (!writesEnabled) {
      setCreateNotice("Создание пока недоступно. Проверьте права владельца, MFA и серверную настройку.");
      document.getElementById("ot-list-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setShowCreate(true);
    setCreateError("");
    setCreateNotice("");
    requestAnimationFrame(() => document.getElementById("ot-create-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function openCalendar() {
    setShowCalendar(value => !value);
    requestAnimationFrame(() => document.getElementById("ot-calendar-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }


  function editDraft(field, value) {
    setDraft(current => {
      const next = { ...current, [field]: value };
      if (field === "title" && !slugEdited) next.slug = toSlug(value);
      return next;
    });
  }

  async function createTournament(event) {
    event.preventDefault();
    if (creating || !writesEnabled) return;
    setCreating(true);
    setCreateError("");
    setCreateNotice("");
    try {
      const registration_start = dateToIso(draft.registration_start);
      const registration_end = dateToIso(draft.registration_end);
      const starts_at = dateToIso(draft.starts_at);
      if (!registration_start || !registration_end || !starts_at ||
          registration_start >= registration_end || registration_end >= starts_at) {
        throw new Error("Укажите даты по порядку: открытие регистрации, закрытие и начало турнира.");
      }
      if (new Date(starts_at).getTime() <= Date.now()) {
        throw new Error("Дата начала турнира должна быть в будущем.");
      }
      const payload = {
        slug: draft.slug.trim(), title: draft.title.trim(), game: "CS2",
        format: "single_elimination", timezone: "Europe/Kyiv",
        best_of: Number(draft.best_of), capacity: Number(draft.capacity),
        registration_start, registration_end, starts_at,
      };
      const response = await fetch("/api/tournaments-owner", {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) {
        if (result?.error === "TOURNAMENT_WRITES_DISABLED") throw new Error("Сервер не разрешает создание турниров.");
        if (result?.error === "TOURNAMENT_CREATE_FAILED") throw new Error("Не удалось создать черновик. Проверьте уникальность адреса турнира и параметры.");
        throw new Error(result?.message || "Не удалось создать турнир.");
      }
      setShowCreate(false);
      setDraft(NEW_TOURNAMENT);
      setSlugEdited(false);
      setCreateNotice("Черновик турнира создан. Он не опубликован и не доступен участникам.");
      await refresh();
      setFilter("drafts");
    } catch (cause) {
      setCreateError(cause?.message || "Ошибка создания турнира.");
    } finally {
      setCreating(false);
    }
  }


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
      setWritesEnabled(result.writesEnabled === true);
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
            {writesEnabled && <button type="button" className="ot-primary-link ot-create-trigger" onClick={() => { setShowCreate(value => !value); setCreateError(""); }}>{showCreate ? "Закрыть форму" : "+ Создать турнир"}</button>}
            <Link className={writesEnabled ? "ot-secondary-link" : "ot-primary-link"} to="/owner/tournaments-team-applications">Управление командами <span aria-hidden="true">↗</span></Link>
            <Link className="ot-secondary-link" to="/owner/tournaments-bracket">Открыть сетку <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <div className="ot-hero-side">
          <div className="ot-system"><span className="ot-system-dot" /> СИСТЕМА ПОДКЛЮЧЕНА</div>
          <div className="ot-lock-icon" aria-hidden="true">▦</div>
          <div className="ot-read-label">{writesEnabled ? "УПРАВЛЕНИЕ ВКЛЮЧЕНО" : "РЕЖИМ ПРОСМОТРА"}</div>
          <div className="ot-read-desc">{writesEnabled ? "Создание черновиков и изменение статусов доступны владельцу с подтверждённой MFA." : "Создание и изменение временно отключены до завершения проверки."}</div>
        </div>
      </header>

      {createNotice && <p className="ot-create-notice" role="status">{createNotice}</p>}
      {showCreate && writesEnabled && (
        <section className="ot-create-panel" aria-labelledby="ot-create-heading">
          <div className="ot-section-title">
            <div><span className="ot-section-index">НОВЫЙ ТУРНИР / ЧЕРНОВИК</span><h2 id="ot-create-heading">Создать турнир CS2</h2><p>Создание не публикует турнир. Для запуска регистрации потребуется отдельное подтверждение.</p></div>
          </div>
          <form onSubmit={createTournament} className="ot-create-form">
            <label>Название турнира
              <input required minLength={3} maxLength={160} value={draft.title} onChange={event => editDraft("title", event.target.value)} placeholder="ISTe Open Cup" />
            </label>
            <label>Адрес турнира (латиница)
              <input required maxLength={100} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={draft.slug} onChange={event => { setSlugEdited(true); editDraft("slug", event.target.value); }} placeholder="iste-open-cup" />
            </label>
            <label>Количество команд
              <select value={draft.capacity} onChange={event => editDraft("capacity", Number(event.target.value))}>
                {[2,4,8,16,32,64,128].map(value => <option key={value} value={value}>{value} команд</option>)}
              </select>
            </label>
            <label>Формат матчей
              <select value={draft.best_of} onChange={event => editDraft("best_of", Number(event.target.value))}>
                {[1,3,5].map(value => <option key={value} value={value}>BO{value}</option>)}
              </select>
            </label>
            <label>Открытие регистрации
              <input required type="datetime-local" value={draft.registration_start} onChange={event => editDraft("registration_start", event.target.value)} />
            </label>
            <label>Закрытие регистрации
              <input required type="datetime-local" value={draft.registration_end} onChange={event => editDraft("registration_end", event.target.value)} />
            </label>
            <label>Начало турнира
              <input required type="datetime-local" value={draft.starts_at} onChange={event => editDraft("starts_at", event.target.value)} />
            </label>
            <div className="ot-create-tip">Формат сетки Single Elimination. Время вводится в часовом поясе вашего устройства, в базе сохраняется UTC. После создания турнир остаётся черновиком.</div>
            {createError && <p className="ot-create-error" role="alert">{createError}</p>}
            <div className="ot-create-buttons">
              <button type="submit" disabled={creating}>{creating ? "Создаём черновик…" : "Создать черновик"}</button>
              <button type="button" onClick={() => setShowCreate(false)} disabled={creating}>Отмена</button>
            </div>
          </form>
        </section>
      )}

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
          <p>{tournaments.length ? "Попробуйте изменить поиск или фильтр." : writesEnabled ? "Здесь появятся ваши турниры после создания. Нажмите «Создать турнир», чтобы подготовить первый черновик." : "Здесь появятся ваши турниры после их создания. Сейчас доступен безопасный просмотр и тестовые инструменты."}</p>
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

      {showCalendar && <section className="ot-calendar" aria-labelledby="ot-calendar-heading">
        <div className="ot-section-title">
          <div>
            <span className="ot-section-index">КАЛЕНДАРЬ / РЕАЛЬНЫЕ ТУРНИРЫ</span>
            <h2 id="ot-calendar-heading">Расписание турниров</h2>
            <p>Даты и статусы берутся из защищённого списка турниров ISTe. Черновики видны только владельцу.</p>
          </div>
          <button className="ot-refresh" type="button" onClick={() => void refresh()} disabled={loading}>{loading ? "Загрузка…" : "Обновить"}</button>
        </div>
        {error ? <p className="ot-calendar-empty" role="alert">{error}</p> : !schedule.length ? <div className="ot-calendar-empty" role="status">Пока нет турниров с назначенными датами. Создайте первый черновик, чтобы добавить его в календарь.</div> :
          <div className="ot-calendar-list">{schedule.map(item => (
            <article className="ot-calendar-event" key={item.id}>
              <div className="ot-calendar-date">
                <span>{item.starts_at ? "НАЧАЛО ТУРНИРА" : "РЕГИСТРАЦИЯ"}</span>
                <strong>{new Date(item.starts_at || item.registration_start || item.registration_end).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric", timeZone: "Europe/Kyiv" })}</strong>
                <small>{new Date(item.starts_at || item.registration_start || item.registration_end).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv" })} · Киев</small>
              </div>
              <div className="ot-calendar-details">
                <span className={`ot-status ot-status--${item.status || "draft"}`}>{statusLabels[item.status] || item.status}</span>
                <h3>{item.title}</h3>
                <p>{item.capacity} команд · BO{item.best_of} · {item.slug}</p>
                {item.registration_start && <p>Открытие регистрации: {new Date(item.registration_start).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Kyiv" })}</p>}
                {item.registration_end && <p>Закрытие регистрации: {new Date(item.registration_end).toLocaleString("ru-RU", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Kyiv" })}</p>}
                <div className="ot-calendar-links">
                  <Link to={`/owner/tournaments-team-applications?tournamentId=${encodeURIComponent(item.id)}`}>Заявки команд</Link>
                  <Link to={`/owner/tournaments-bracket?mode=server&tournamentId=${encodeURIComponent(item.id)}`}>Сетка и результаты</Link>
                  <button type="button" onClick={() => {setQuery(item.slug);setFilter("all"); document.getElementById("ot-list-heading")?.scrollIntoView({ behavior: "smooth", block: "start" });}}>Управление статусом</button>
                </div>
              </div>
            </article>
          ))}</div>}
      </section>}

      <section className="ot-tools" aria-labelledby="ot-tools-heading">
        <div className="ot-section-title"><div><span className="ot-section-index">02 / ИНСТРУМЕНТЫ</span><h2 id="ot-tools-heading">Рабочее пространство</h2><p>Управление участниками, матчами и тестовыми сценариями.</p></div></div>
        <div className="ot-tools-grid">
          {shortcuts.map(item => {
            const inner = <>
              <div className="ot-tool-top"><span>{item.number} / ISTe</span><span className="ot-tool-tag">{item.tag}</span></div>
              <div><h3>{item.name}</h3><p>{item.hint}</p></div>
              <span className="ot-tool-arrow" aria-hidden="true">↗</span>
            </>;
            if (item.action === "create") return <button type="button" className="ot-tool ot-tool-button" key={item.number} onClick={openCreate}>{inner}</button>;
            if (item.action === "schedule") return <button type="button" className="ot-tool ot-tool-button" key={item.number} onClick={openCalendar} aria-expanded={showCalendar}>{inner}</button>;
            return <Link className="ot-tool" to={item.to} key={item.number}>{inner}</Link>;
          })}
        </div>
      </section>
      <footer className="ot-footer"><span>ISTe / TOURNAMENT OPERATIONS V2</span><Link to="/founder">← К панели владельца</Link></footer>
    </main>
  );
}
