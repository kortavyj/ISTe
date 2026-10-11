import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import "./Tournaments.css";

export default function Tournaments({ create = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(!create);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", bestOf: "1", maxTeams: "16",
  });

  useEffect(() => {
    if (create) return;
    const controller = new AbortController();
    fetch("/api/tournaments", { signal: controller.signal })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.ok) throw new Error(data.message || "Не удалось получить турниры.");
        setItems(data.tournaments || []);
      })
      .catch((err) => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [create]);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/tournaments", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          title: form.title, description: form.description,
          bestOf: Number(form.bestOf), maxTeams: Number(form.maxTeams),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || "Ошибка создания турнира.");
      navigate("/account/tournaments", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="iste-tournaments">
      <div className="iste-tournaments__head">
        <span className="iste-tournaments__eyebrow">ISTe · COUNTER STRIKE 2</span>
        <h1>{create ? "Создать турнир" : "Турниры CS2"}</h1>
        <p>{create
          ? "Настройте турнир. После сохранения он останется черновиком и не будет виден посетителям."
          : "Здесь появятся опубликованные турниры ISTe и сообщества. Смотреть их могут все."}</p>
        <div className="iste-tournaments__actions">
          <Link to="/tournaments">Все турниры</Link>
          {user && <Link to="/account/tournaments">Мои турниры</Link>}
          {user ? <Link to="/tournaments/create">Создать турнир</Link> : <Link to="/login">Войти для создания</Link>}
        </div>
      </div>
      {error && <p className="iste-tournaments__error" role="alert">{error}</p>}
      {create ? (
        <form className="iste-tournaments__form" onSubmit={submit}>
          <label>Название турнира
            <input required minLength={4} maxLength={120} value={form.title}
              onChange={e => setForm(v => ({ ...v, title: e.target.value }))} />
          </label>
          <label>Описание
            <textarea maxLength={3000} rows={4} value={form.description}
              onChange={e => setForm(v => ({ ...v, description: e.target.value }))} />
          </label>
          <label>Формат серии
            <select value={form.bestOf} onChange={e => setForm(v => ({ ...v, bestOf: e.target.value }))}>
              <option value="1">BO1</option><option value="3">BO3</option>
            </select>
          </label>
          <label>Максимум команд
            <input type="number" min={2} max={64} value={form.maxTeams}
              onChange={e => setForm(v => ({ ...v, maxTeams: e.target.value }))} />
          </label>
          <button type="submit" disabled={saving}>{saving ? "Сохраняем..." : "Сохранить черновик"}</button>
          <p className="iste-tournaments__note">Публикация, сетка и регистрация команд появятся на следующем этапе. Сейчас создаётся только черновик.</p>
        </form>
      ) : loading ? <p>Загружаем турниры…</p> : items.length ? (
        <div className="iste-tournaments__grid">{items.map(item => (
          <article className="iste-tournaments__card" key={item.id}>
            <span>CS2 · {item.best_of === 3 ? "BO3" : "BO1"}</span>
            <h2>{item.title}</h2>
            <p>{item.description || "Турнир Counter Strike 2"}</p>
            <small>{item.max_teams} команд · {item.status}</small>
          </article>
        ))}</div>
      ) : !error ? <p className="iste-tournaments__empty">Опубликованных турниров пока нет.</p> : null}
    </section>
  );
}