import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import "./MemberAwards.css";
import AwardSymbol from "./AwardSymbol.jsx";

const CATALOG = Object.freeze({
  verified: ["Верифікований профіль", "Офіційне підтвердження ISTe", "✓", "silver"],
  owner: ["Власник ISTe", "Засновник і власник платформи", "♛", "neutral"],
  admin: ["Адміністратор", "Управління спільнотою ISTe", "✦", "neutral"],
  member: ["Учасник ISTe", "Частина спільноти ISTe", "◇", "neutral"],
  early_member: ["Ранній учасник", "Особлива відзнака спільноти", "★", "red"],
  community_helper: ["Помічник спільноти", "Внесок у розвиток ISTe", "✚", "red"],
  tournament_winner: ["Переможець турніру", "Нагорода за перемогу", "♜", "red"],
  partner: ["Партнер ISTe", "Особливий статус партнера", "◆", "gold"],
  creator: ["Автор контенту", "Творчий внесок у ISTe", "✧", "gold"],
  month_member: ["30 днів разом", "Автоматично після 30 днів участі в ISTe", "30", "neutral"],
  year_member: ["Рік в ISTe", "Автоматично після 365 днів від дати реєстрації", "365", "neutral"],
  first_showcase: ["Перша вітрина", "За першу опубліковану вітрину", "▣", "neutral"],
  first_comment: ["Перший відгук", "За перший коментар у профілі іншого учасника", "✎", "neutral"],
  ten_comments: ["Голос спільноти", "За 10 коментарів у профілях інших учасників", "❞", "neutral"],
});
const MANUAL = ["early_member", "community_helper", "tournament_winner", "partner", "creator"];
const DISPLAY_ORDER = ["member", "verified", "month_member", "year_member", "first_showcase", "first_comment", "ten_comments", "early_member", "community_helper", "tournament_winner", "partner", "creator", "admin", "owner"];
const VISUAL_TONE = {
  member: "silver", month_member: "gold", year_member: "gold",
  first_showcase: "silver", first_comment: "silver", ten_comments: "silver",
  early_member: "gold", community_helper: "red", tournament_winner: "gold",
  partner: "red", creator: "silver", admin: "silver", owner: "gold",
};

function awardTone(code, verificationType) {
  if (code === "verified") return ["red", "silver", "gold"].includes(verificationType) ? verificationType : "silver";
  return VISUAL_TONE[code] || CATALOG[code]?.[3] || "silver";
}
function timestamp(value) {
  const date = value ? new Date(value).getTime() : 0;
  return Number.isFinite(date) ? date : 0;
}
function formattedDate(value) {
  if (!timestamp(value)) return "Дата невідома";
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
function awardType(code) {
  if (MANUAL.includes(code)) return "Особлива відзнака";
  if (["verified", "owner", "admin"].includes(code)) return "Статус профілю";
  return "Досягнення спільноти";
}

export default function MemberAwards({ accountNumber, canManage, verificationType = "silver" }) {
  const [awards, setAwards] = useState([]);
  const [history, setHistory] = useState([]);
  const [unread, setUnread] = useState([]);
  const [isSelf, setIsSelf] = useState(false);
  const [activeTab, setActiveTab] = useState("earned");
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("recent");
  const [viewMode, setViewMode] = useState("list");
  const [selectedCode, setSelectedCode] = useState("");
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [status, setStatus] = useState("loading");
  const [code, setCode] = useState(MANUAL[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const fieldId = useId();
  const dialogTitleId = useId();
  const dialogCloseRef = useRef(null);

  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "member-awards-get", accountNumber }),
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) throw new Error(result?.message || "LOOKUP_FAILED");
      setAwards((Array.isArray(result.awards) ? result.awards : []).filter(item => CATALOG[item.award_code]));
      setHistory((Array.isArray(result.history) ? result.history : []).filter(item => CATALOG[item.award_code]));
      setUnread((Array.isArray(result.unread) ? result.unread : []).filter(item => CATALOG[item.award_code]));
      setIsSelf(result.isSelf === true);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [accountNumber]);

  useEffect(() => { void refresh(); }, [refresh]);

  useEffect(() => {
    if (!selectedCode) return undefined;
    const closeOnEscape = event => {
      if (event.key === "Escape") setSelectedCode("");
    };
    document.addEventListener("keydown", closeOnEscape);
    dialogCloseRef.current?.focus();
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [selectedCode]);

  const earnedMap = useMemo(() => new Map(awards.map(item => [item.award_code, item])), [awards]);
  const earnedCount = DISPLAY_ORDER.filter(key => earnedMap.has(key)).length;
  const totalCount = DISPLAY_ORDER.length;
  const completion = Math.round(earnedCount / totalCount * 100);
  const latestAward = useMemo(() => [...awards].sort((a, b) => timestamp(b.granted_at) - timestamp(a.granted_at))[0] || null, [awards]);
  const query = search.trim().toLocaleLowerCase("uk-UA");

  const visibleAwards = useMemo(() => {
    const items = DISPLAY_ORDER
      .filter(key => activeTab === "earned" ? earnedMap.has(key) : activeTab === "locked" ? !earnedMap.has(key) : true)
      .filter(key => !query || [CATALOG[key][0], CATALOG[key][1], awardType(key)].join(" ").toLocaleLowerCase("uk-UA").includes(query));
    if (sortMode === "name") items.sort((a, b) => CATALOG[a][0].localeCompare(CATALOG[b][0], "uk-UA"));
    if (sortMode === "recent") items.sort((a, b) => timestamp(earnedMap.get(b)?.granted_at) - timestamp(earnedMap.get(a)?.granted_at) || DISPLAY_ORDER.indexOf(a) - DISPLAY_ORDER.indexOf(b));
    return items;
  }, [activeTab, earnedMap, query, sortMode]);

  const visibleHistory = useMemo(() => {
    const rows = history.filter(item => !query || [CATALOG[item.award_code][0], CATALOG[item.award_code][1]].join(" ").toLocaleLowerCase("uk-UA").includes(query));
    rows.sort((a, b) => sortMode === "name"
      ? CATALOG[a.award_code][0].localeCompare(CATALOG[b.award_code][0], "uk-UA")
      : timestamp(b.granted_at) - timestamp(a.granted_at));
    return rows;
  }, [history, query, sortMode]);

  const selected = selectedCode && CATALOG[selectedCode] ? CATALOG[selectedCode] : null;
  const selectedAward = selectedCode ? earnedMap.get(selectedCode) : null;
  const received = earnedMap.has(code);

  async function acknowledgeAwards() {
    if (notificationBusy || !isSelf || unread.length === 0) return;
    setNotificationBusy(true);
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "member-awards-mark-read" }),
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) throw new Error(result?.message || "READ_FAILED");
      setUnread([]);
    } catch {
      setMessage("Не вдалося позначити сповіщення як прочитані.");
    } finally {
      setNotificationBusy(false);
    }
  }

  async function manage() {
    if (busy || !canManage) return;
    if (!window.confirm(received ? "Відкликати нагороду?" : "Видати нагороду?")) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "member-awards-manage", accountNumber, awardCode: code, grant: !received }),
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) throw new Error(result?.message || "AWARD_UPDATE_FAILED");
      await refresh();
      setMessage(received ? "Нагороду відкликано." : "Нагороду видано.");
    } catch (error) {
      setMessage(error.message || "Не вдалося змінити нагороду.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="iste-awards steam-achievements" aria-label="Досягнення учасника ISTe">
      <header className="steam-achievements__head">
        <div className="steam-achievements__heading">
          <span className="steam-achievements__eyebrow">ISTe / PROFILE ACHIEVEMENTS</span>
          <h2><span aria-hidden="true">★</span> Досягнення</h2>
          <p>Колекція нагород за участь, активність та особливі заслуги в ISTe.</p>
        </div>
        <div className="steam-achievements__score" aria-label={"Отримано " + earnedCount + " із " + totalCount + " нагород"}>
          <strong>{earnedCount}<span> / {totalCount}</span></strong>
          <small>ВІДКРИТО НАГОРОД</small>
        </div>
      </header>

      <div className="steam-achievements__overview">
        <div className="steam-achievements__progress-section">
          <div className="steam-achievements__progress-label"><strong>Загальний прогрес</strong><span>{completion}%</span></div>
          <div className="steam-achievements__progress" role="progressbar" aria-label="Прогрес відкриття нагород" aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion}>
            <span style={{ width: completion + "%" }} />
          </div>
          <p>{earnedCount} отримано · {totalCount - earnedCount} ще можна відкрити</p>
        </div>
        <div className="steam-achievements__latest">
          <span className="steam-achievements__latest-label">ОСТАННЯ НАГОРОДА</span>
          {latestAward ? (
            <button type="button" className="steam-achievements__latest-content" onClick={() => setSelectedCode(latestAward.award_code)}>
              <span className={"steam-achievements__latest-medal steam-achievement--" + awardTone(latestAward.award_code, verificationType)}><AwardSymbol code={latestAward.award_code} /></span>
              <span><strong>{CATALOG[latestAward.award_code][0]}</strong><small>{formattedDate(latestAward.granted_at)}</small></span>
              <span aria-hidden="true">›</span>
            </button>
          ) : <span className="steam-achievements__latest-empty">Поки що немає отриманих нагород</span>}
        </div>
      </div>

      {isSelf && unread.length > 0 && (
        <div className="iste-awards-notice steam-achievements__notice" role="status">
          <div className="iste-awards-notice-symbol" aria-hidden="true">✦</div>
          <strong>Нове досягнення!</strong>
          <p>{unread.length === 1 ? CATALOG[unread[0].award_code][0] : "Відкрито " + unread.length + " нових нагород"}</p>
          <button type="button" onClick={acknowledgeAwards} disabled={notificationBusy}>{notificationBusy ? "Зберігаємо…" : "Переглянуто"}</button>
        </div>
      )}

      <div className="steam-achievements__toolbar">
        <div className="steam-achievements__tabs" role="group" aria-label="Каталог досягнень">
          <button type="button" aria-pressed={activeTab === "earned"} className={activeTab === "earned" ? "is-active" : ""} onClick={() => setActiveTab("earned")}>Отримані <span>{earnedCount}</span></button>
          <button type="button" aria-pressed={activeTab === "catalog"} className={activeTab === "catalog" ? "is-active" : ""} onClick={() => setActiveTab("catalog")}>Усі <span>{totalCount}</span></button>
          <button type="button" aria-pressed={activeTab === "locked"} className={activeTab === "locked" ? "is-active" : ""} onClick={() => setActiveTab("locked")}>Закриті <span>{totalCount - earnedCount}</span></button>
          <button type="button" aria-pressed={activeTab === "history"} className={activeTab === "history" ? "is-active" : ""} onClick={() => setActiveTab("history")}>Історія</button>
        </div>
        <div className="steam-achievements__tools">
          <label className="steam-achievements__search" htmlFor={fieldId}>
            <span aria-hidden="true">⌕</span>
            <input id={fieldId} type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Пошук досягнення" autoComplete="off" />
          </label>
          <label className="steam-achievements__sort"><span>Сортування</span>
            <select value={sortMode} onChange={event => setSortMode(event.target.value)}>
              <option value="recent">Нові спочатку</option>
              <option value="catalog">За каталогом</option>
              <option value="name">За назвою</option>
            </select>
          </label>
          {activeTab !== "history" && (
            <div className="steam-achievements__view" role="group" aria-label="Відображення нагород">
              <button type="button" aria-label="Список" aria-pressed={viewMode === "list"} onClick={() => setViewMode("list")}>☰</button>
              <button type="button" aria-label="Плитки" aria-pressed={viewMode === "grid"} onClick={() => setViewMode("grid")}>▦</button>
            </div>
          )}
        </div>
      </div>

      {status === "loading" && (
        <div className="steam-achievements__state" role="status"><span className="steam-achievements__spinner" aria-hidden="true" /> Завантажуємо нагороди…</div>
      )}
      {status === "error" && (
        <div className="steam-achievements__state" role="alert">Не вдалося отримати нагороди. <button type="button" onClick={refresh}>Спробувати ще раз</button></div>
      )}

      {status === "ready" && activeTab !== "history" && (
        <div className={"steam-achievements__items" + (viewMode === "grid" ? " steam-achievements__items--grid" : "")}>
          {visibleAwards.map(awardCode => {
            const details = CATALOG[awardCode];
            const earned = earnedMap.get(awardCode);
            const tone = awardTone(awardCode, verificationType);
            return (
              <button type="button" key={awardCode} onClick={() => setSelectedCode(awardCode)}
                className={"steam-achievement steam-achievement--" + tone + (earned ? " steam-achievement--unlocked" : " steam-achievement--locked")}
                aria-label={details[0] + ". " + (earned ? "Отримано." : "Не отримано.") + " Відкрити подробиці"}>
                <span className="steam-achievement__art" aria-hidden="true"><AwardSymbol code={awardCode} /></span>
                <span className="steam-achievement__text">
                  <strong>{details[0]}</strong>
                  <span className="steam-achievement__desc">{details[1]}</span>
                  <span className="steam-achievement__type">{awardType(awardCode)}</span>
                </span>
                <span className="steam-achievement__status">
                  <span className={earned ? "steam-achievement__unlocked" : "steam-achievement__pending"}>{earned ? "✓ ОТРИМАНО" : "🔒 ЗАКРИТО"}</span>
                  {earned && <small>{formattedDate(earned.granted_at)}</small>}
                  <span className="steam-achievement__chevron" aria-hidden="true">›</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {status === "ready" && activeTab === "history" && (
        <div className="steam-achievements__history">
          {visibleHistory.map((item, index) => (
            <button type="button" className="steam-achievements__history-entry" key={item.award_code + ":" + (item.granted_at || index)} onClick={() => setSelectedCode(item.award_code)}>
              <span className={"steam-achievements__history-icon steam-achievement--" + awardTone(item.award_code, verificationType)}><AwardSymbol code={item.award_code} /></span>
              <span className="steam-achievements__history-details"><strong>{CATALOG[item.award_code][0]}</strong><small>{formattedDate(item.granted_at)}</small></span>
              <span className={item.active ? "steam-achievements__history-active" : "steam-achievements__history-archived"}>{item.active ? "Активна" : "В архіві"}</span>
            </button>
          ))}
        </div>
      )}
      {status === "ready" && ((activeTab === "history" && visibleHistory.length === 0) || (activeTab !== "history" && visibleAwards.length === 0)) && (
        <div className="steam-achievements__state steam-achievements__empty">
          <span aria-hidden="true">◇</span>
          <strong>{search ? "Нічого не знайдено" : activeTab === "earned" ? "Нагороди ще не отримано" : activeTab === "locked" ? "Усі досягнення відкриті!" : activeTab === "history" ? "Історія ще порожня" : "Каталог порожній"}</strong>
          {search ? <button type="button" onClick={() => setSearch("")}>Очистити пошук</button> : <small>Перевірте інші вкладки, щоб переглянути каталог досягнень.</small>}
        </div>
      )}

      {canManage && (
        <div className="iste-awards-admin steam-achievements__admin">
          <h3>Керування нагородами</h3>
          <label htmlFor={fieldId + "-manage"}>Спеціальна нагорода</label>
          <select id={fieldId + "-manage"} value={code} onChange={event => setCode(event.target.value)}>
            {MANUAL.map(item => <option key={item} value={item}>{CATALOG[item][0]}</option>)}
          </select>
          <button type="button" disabled={busy || status !== "ready"} onClick={manage}>{busy ? "Зберігаємо…" : received ? "Відкликати нагороду" : "Видати нагороду"}</button>
        </div>
      )}
      {message && <p className="steam-achievements__message" role="status">{message}</p>}

      {selected && (
        <div className="steam-achievements__backdrop" onMouseDown={event => { if (event.target === event.currentTarget) setSelectedCode(""); }}>
          <div className="steam-achievements__dialog" role="dialog" aria-modal="true" aria-labelledby={dialogTitleId}>
            <button className="steam-achievements__dialog-close" type="button" ref={dialogCloseRef} onClick={() => setSelectedCode("")} aria-label="Закрити подробиці">×</button>
            <div className={"steam-achievements__dialog-art steam-achievement--" + awardTone(selectedCode, verificationType)}><AwardSymbol code={selectedCode} /></div>
            <div className="steam-achievements__dialog-info">
              <span className="steam-achievements__eyebrow">{awardType(selectedCode)}</span>
              <h3 id={dialogTitleId}>{selected[0]}</h3>
              <p>{selected[1]}</p>
              <div className="steam-achievements__dialog-result">
                {selectedAward ? <><strong>✓ Досягнення відкрито</strong><span>{formattedDate(selectedAward.granted_at)}</span></> : <><strong>Ще не отримано</strong><span>{MANUAL.includes(selectedCode) ? "Спеціальну відзнаку призначає адміністрація ISTe." : "Виконайте умову досягнення, щоб отримати нагороду."}</span></>}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
