import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase.js";
import "./MemberAwards.css";

const CATALOG = {
  verified: ["Верифікований профіль", "Офіційне підтвердження ISTe", "✓", "red"],
  owner: ["Власник ISTe", "Засновник і власник платформи", "♛", "gold"],
  admin: ["Адміністратор", "Управління спільнотою ISTe", "✦", "red"],
  member: ["Учасник ISTe", "Частина спільноти ISTe", "◇", "silver"],
  early_member: ["Ранній учасник", "Особлива відзнака спільноти", "★", "silver"],
  community_helper: ["Помічник спільноти", "Внесок у розвиток ISTe", "✚", "red"],
  tournament_winner: ["Переможець турніру", "Нагорода за перемогу", "♜", "gold"],
  partner: ["Партнер ISTe", "Особливий статус партнера", "◆", "silver"],
  creator: ["Автор контенту", "Творчий внесок у ISTe", "✧", "red"],
};
const MANUAL = ["early_member","community_helper","tournament_winner","partner","creator"];

export default function MemberAwards({ accountNumber, canManage }) {
  const [awards, setAwards] = useState([]);
  const [status, setStatus] = useState("loading");
  const [code, setCode] = useState(MANUAL[0]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const refresh = useCallback(async () => {
    const { data, error } = await supabase.rpc("member_awards_for_account", { p_account_number: accountNumber });
    if (error) { setStatus("error"); return; }
    setAwards((data || []).filter(item => CATALOG[item.award_code]));
    setStatus("ready");
  }, [accountNumber]);

  useEffect(() => { refresh(); }, [refresh]);

  const received = awards.some(item => item.award_code === code);
  async function manage() {
    if (busy || !canManage) return;
    if (!window.confirm(received ? "Відкликати нагороду?" : "Видати нагороду?")) return;
    setBusy(true); setMessage("");
    const { error } = await supabase.rpc("manage_member_award", {
      p_account_number: accountNumber, p_award_code: code, p_grant: !received,
    });
    if (error) {
      const reason = error.message || "";
      setMessage(reason.includes("MFA_REQUIRED") ? "Потрібна двофакторна автентифікація." :
        reason.includes("OWNER_PROTECTED") ? "Нагородами власника керує тільки власник." :
        "Зміна нагороди не вдалася. Перевірте права доступу.");
    } else {
      await refresh();
      setMessage(received ? "Нагороду відкликано." : "Нагороду видано.");
    }
    setBusy(false);
  }

  return <section className="iste-awards">
    <header className="iste-awards-head">
      <h2><span aria-hidden="true">♛</span> Досягнення</h2>
      <span>{awards.length} нагород</span>
    </header>
    <p className="iste-awards-caption">Нагороди та спеціальні відзнаки учасника ISTe.</p>
    {status === "loading" && <p className="iste-awards-muted">Завантажуємо нагороди…</p>}
    {status === "error" && <p className="iste-awards-muted" role="alert">Не вдалося отримати нагороди.</p>}
    {status === "ready" && <div className="iste-awards-grid">
      {awards.map(item => {
        const [title, description, symbol, tone] = CATALOG[item.award_code];
        return <div key={item.award_code} className={`iste-award iste-award--${tone}`}
          title={`${title}. ${description}`}>
          <span className="iste-award-icon" aria-hidden="true">{symbol}</span>
          <strong>{title}</strong>
        </div>;
      })}
    </div>}
    {status === "ready" && awards.length === 0 && <p className="iste-awards-muted">Нагороди ще не отримано.</p>}
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
