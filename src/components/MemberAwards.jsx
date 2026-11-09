import { useCallback, useEffect, useState } from "react";

import "./MemberAwards.css";
import AwardSymbol from "./AwardSymbol.jsx";

const CATALOG = {
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
};
const MANUAL = ["early_member","community_helper","tournament_winner","partner","creator"];
const DISPLAY_ORDER = ["member","verified","month_member","year_member","first_showcase","first_comment","ten_comments","early_member","community_helper","tournament_winner","partner","creator","admin","owner"];
const AUTOMATIC = new Set(["member","verified","month_member","year_member","first_showcase","first_comment","ten_comments","admin","owner"]);
function formattedDate(value) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "Дата невідома";
  return new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function MemberAwards({ accountNumber, canManage, verificationType = "silver" }) {
  const [awards, setAwards] = useState([]);
  const [history, setHistory] = useState([]);
  const [unread, setUnread] = useState([]);
  const [isSelf, setIsSelf] = useState(false);
  const [activeTab, setActiveTab] = useState("earned");
  const [notificationBusy, setNotificationBusy] = useState(false);
  const [status, setStatus] = useState("loading");
  const [code, setCode] = useState(MANUAL[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "member-awards-get", accountNumber }),
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) throw new Error(result?.message || "LOOKUP_FAILED");
      setAwards((result.awards || []).filter(item => CATALOG[item.award_code]));
      setHistory((result.history || []).filter(item => CATALOG[item.award_code]));
      setUnread((result.unread || []).filter(item => CATALOG[item.award_code]));
      setIsSelf(result.isSelf === true);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, [accountNumber]);

  useEffect(() => { refresh(); }, [refresh]);

  const received = awards.some(item => item.award_code === code);
  const earnedCodes = new Set(awards.map(item => item.award_code));

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
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "member-awards-manage", accountNumber, awardCode: code, grant: !received,
        }),
      });
      const result = await response.json();
      if (!response.ok || result?.ok !== true) throw new Error(result?.message || "AWARD_UPDATE_FAILED");
      await refresh();
      setMessage(received ? "Нагороду відкликано." : "Нагороду видано.");
    } catch (error) {
      setMessage(error.message || "Не вдалося змінити нагороду.");
    }
    setBusy(false);
  }

  return <section className="iste-awards">
    <header className="iste-awards-head">
      <h2><span className="iste-awards-head-crown" aria-hidden="true">♛</span> Досягнення</h2>
      <span className="iste-awards-count"><span aria-hidden="true">❧</span> {awards.length} нагород</span>
    </header>
    <p className="iste-awards-caption">Відкривайте нагороди за активність і досягнення в ISTe.</p>
    {isSelf && unread.length > 0 && <div className="iste-awards-notice" role="status">
      <div className="iste-awards-notice-symbol" aria-hidden="true"><span>❧</span>✦<span>❧</span></div>
      <strong>Нове досягнення!</strong>
      <p>{unread.length === 1 ? CATALOG[unread[0].award_code][0] : `Відкрито ${unread.length} нових нагород`}</p>
      <button type="button" onClick={acknowledgeAwards} disabled={notificationBusy}>
        {notificationBusy ? "Зберігаємо…" : "Чудово, дякую!"}
      </button>
    </div>}
    <div className="iste-awards-tabs" role="group" aria-label="Каталог досягнень">
      <button type="button" className={activeTab === "earned" ? "is-active" : ""} aria-pressed={activeTab === "earned"} onClick={() => setActiveTab("earned")}><span className="iste-awards-tab-icon" aria-hidden="true">♙</span> Отримані</button>
      <button type="button" className={activeTab === "catalog" ? "is-active" : ""} aria-pressed={activeTab === "catalog"} onClick={() => setActiveTab("catalog")}><span className="iste-awards-tab-icon" aria-hidden="true">▦</span> Усі нагороди</button>
      <button type="button" className={activeTab === "history" ? "is-active" : ""} aria-pressed={activeTab === "history"} onClick={() => setActiveTab("history")}><span className="iste-awards-tab-icon" aria-hidden="true">◷</span> Історія</button>
    </div>
    {status === "loading" && <p className="iste-awards-muted">Завантажуємо нагороди…</p>}
    {status === "error" && <p className="iste-awards-muted" role="alert">Не вдалося отримати нагороди.</p>}
    {status === "ready" && activeTab !== "history" && <div className="iste-awards-grid">
      {(activeTab === "catalog" ? DISPLAY_ORDER.map(award_code => ({ award_code })) : awards).map(item => {
        const [title, description, , categoryTone] = CATALOG[item.award_code];
        const tone = item.award_code === "verified" && ["red", "silver", "gold"].includes(verificationType) ? verificationType : categoryTone;
        const earned = earnedCodes.has(item.award_code);
        const achieved = awards.find(entry => entry.award_code === item.award_code);
        return <div key={item.award_code}
          className={`iste-award iste-award--${tone}${!earned ? " iste-award--locked" : ""}`}
          title={`${title}. ${description}${earned && achieved?.granted_at ? `. Отримано: ${formattedDate(achieved.granted_at)}` : ""}`}>
          <span className="iste-award-icon" aria-hidden="true"><AwardSymbol code={item.award_code} /></span>
          <strong>{title}</strong>
          {earned && <span className="iste-award-earned-mark" aria-label="Отримано">✓</span>}
          {activeTab === "catalog" && <small>{earned ? "Отримано" : AUTOMATIC.has(item.award_code) ? "Ще не відкрито" : "Відзнака власника"}</small>}
        </div>;
      })}
    </div>}
    {status === "ready" && activeTab === "earned" && awards.length === 0 && <p className="iste-awards-muted">Нагороди ще не отримано.</p>}
    {status === "ready" && activeTab === "history" && <div className="iste-awards-history">
      {history.map(item => <div className="iste-awards-history-item" data-tone={item.award_code === "verified" && ["red", "silver", "gold"].includes(verificationType) ? verificationType : CATALOG[item.award_code][3]} key={item.award_code}>
        <span className="iste-awards-history-symbol"><AwardSymbol code={item.award_code} /></span>
        <span><strong>{CATALOG[item.award_code][0]}</strong><small>{formattedDate(item.granted_at)}</small></span>
        <span className={item.active ? "iste-awards-history-active" : "iste-awards-history-archived"}>{item.active ? "Активна" : "В архіві"}</span>
      </div>)}
      {history.length === 0 && <p className="iste-awards-muted">Історія нагород ще порожня.</p>}
    </div>}
    {canManage && <div className="iste-awards-admin">
      <h3>Керування нагородами</h3>
      <label htmlFor="iste-award-pick">Спеціальна нагорода</label>
      <select id="iste-award-pick" value={code} onChange={event => setCode(event.target.value)}>
        {MANUAL.map(item => <option key={item} value={item}>{CATALOG[item][0]}</option>)}
      </select>
      <button type="button" disabled={busy || status !== "ready"} onClick={manage}>
        {busy ? "Зберігаємо…" : received ? "Відкликати нагороду" : "Видати нагороду"}
      </button>
      {message && <p role="status">{message}</p>}
    </div>}
  </section>;
}
