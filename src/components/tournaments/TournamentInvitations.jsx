import { useCallback, useEffect, useState } from "react";

export default function TournamentInvitations() {
  const [items, setItems] = useState([]);
  const [state, setState] = useState("loading");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const refresh = useCallback(async () => {
    setState("loading");
    try {
      const response = await fetch("/api/tournaments-my-invitations", {
        credentials: "include", headers: { Accept: "application/json" }, cache: "no-store",
      });
      const data = await response.json();
      if (response.status === 503 && data?.error === "INVITATIONS_NOT_READY") {
        setState("unavailable");
        return;
      }
      if (!response.ok || data?.ok !== true) throw new Error("Не удалось получить приглашения.");
      setItems(Array.isArray(data.invitations) ? data.invitations : []);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  async function respond(memberId, accept) {
    if (busy) return;
    setBusy(memberId);
    setNotice("");
    try {
      const response = await fetch("/api/tournaments-roster-response", {
        method: "POST", credentials: "include", cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ memberId, accept }),
      });
      const data = await response.json();
      if (!response.ok || data?.ok !== true) {
        const messages = {
          TOURNAMENT_WRITES_DISABLED: "Подтверждение участия пока отключено.",
          ACCOUNT_BLOCKED: "Действие недоступно для заблокированного аккаунта.",
          MEMBERSHIP_ALREADY_CONFIRMED: "Участие уже подтверждено.",
        };
        throw new Error(messages[data?.error] || "Не удалось обработать приглашение.");
      }
      setNotice(accept ? "Участие подтверждено." : "Приглашение отклонено.");
      await refresh();
    } catch (error) {
      setNotice(error?.message || "Ошибка запроса.");
    } finally {
      setBusy("");
    }
  }

  if (state === "unavailable") return null;
  return (
    <section className="auth-card" aria-label="Приглашения в турниры CS2" style={{ marginBottom: 24 }}>
      <h2>Приглашения в турниры CS2</h2>
      {state === "loading" && <p role="status">Проверяем приглашения…</p>}
      {state === "error" && <p role="alert">Приглашения временно недоступны. <button type="button" onClick={() => void refresh()}>Повторить</button></p>}
      {state === "ready" && items.length === 0 && <p>Ожидающих приглашений нет.</p>}
      {state === "ready" && items.map(item => (
        <article key={item.member_id} style={{ padding: "12px 0", borderTop: "1px solid #444" }}>
          <strong>{item.team_name}</strong>
          <p>{item.tournament_title}</p>
          {item.is_captain
            ? <button type="button" disabled={Boolean(busy)} onClick={() => void respond(item.member_id, true)}>Подтвердить участие капитана</button>
            : <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" disabled={Boolean(busy)} onClick={() => void respond(item.member_id, true)}>Принять</button>
                <button type="button" disabled={Boolean(busy)} onClick={() => void respond(item.member_id, false)}>Отклонить</button>
              </div>}
        </article>
      ))}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
