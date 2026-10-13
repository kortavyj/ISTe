import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import "./Tournaments.css";

export default function Tournaments({ create = false }) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(!create);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", bestOf: "1", maxTeams: "16", teamSize: "5", weaponMode: "standard",
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
          teamSize: Number(form.teamSize), weaponMode: form.weaponMode,
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
          {role === "owner" && <Link to="/account/tournaments">Управление турнирами</Link>}
          {role === "owner" && <Link to="/tournaments/create">Создать турнир</Link>}
        </div>
      </div>
      {error && <p className="iste-tournaments__error" role="alert">{error}</p>}
      {create ? (
        <div className="iste-tournaments__builder">
          <form className="iste-tournaments__form iste-tournaments__builder-form" onSubmit={submit}>
            <div className="iste-tournaments__section"><span>01 / ИНФОРМАЦИЯ</span><h2>Новый турнир</h2></div>
            <label>Название турнира<input required minLength={4} maxLength={120} placeholder="ISTe OPEN CUP" value={form.title} onChange={e=>setForm(v=>({...v,title:e.target.value}))}/></label>
            <label>Описание<textarea maxLength={3000} rows={3} placeholder="Описание турнира" value={form.description} onChange={e=>setForm(v=>({...v,description:e.target.value}))}/></label>
            <div className="iste-tournaments__section"><span>02 / РЕЖИМ</span><h2>Формат участников</h2></div>
            <div className="iste-tournaments__mode-grid" role="group" aria-label="Формат участников">
              {[["1","1vs1","Дуэль"],["2","2vs2","Парный"],["5","5vs5","Командный"]].map(([size,title,caption])=>
                <button type="button" key={size} className={form.teamSize===size?"iste-tournaments__mode selected":"iste-tournaments__mode"} aria-pressed={form.teamSize===size} onClick={()=>setForm(v=>({...v,teamSize:size}))}>
                  <strong>{title}</strong><small>{caption}</small>
                </button>)}
            </div>
            {Number(form.teamSize)<5&&<p className="iste-tournaments__note">Фиксированный состав без запасных и замен. Проверку состава ещё предстоит подключить.</p>}
            <div className="iste-tournaments__section"><span>03 / ПРАВИЛА</span><h2>Оружие и матчи</h2></div>
            <label>Разрешённое оружие<select value={form.weaponMode} onChange={e=>setForm(v=>({...v,weaponMode:e.target.value}))}>
              <option value="standard">Стандартное вооружение</option><option value="awp">Только AWP</option><option value="pistols">Только пистолеты</option><option value="deagle">Только Desert Eagle</option>
            </select></label>
            <p className="iste-tournaments__note">Ограничение оружия пока задаётся в правилах турнира. Интеграцию с сервером CS2 добавим отдельно.</p>
            <div className="iste-tournaments__fields">
              <label>Формат серии<select value={form.bestOf} onChange={e=>setForm(v=>({...v,bestOf:e.target.value}))}><option value="1">BO1</option><option value="3">BO3</option></select></label>
              <label>Максимум команд<input type="number" min="2" max="64" required value={form.maxTeams} onChange={e=>setForm(v=>({...v,maxTeams:e.target.value}))}/></label>
            </div>
            <button type="submit" disabled={saving}>{saving?"Сохраняем...":"Создать черновик турнира"}</button>
            <p className="iste-tournaments__note">После сохранения можно перейти к публикации и регистрации участников.</p>
          </form>
          <aside className="iste-tournaments__summary">
            <span>ISTe ESPORTS / LIVE PREVIEW</span>
            <div className="iste-tournaments__summary-logo">CS<span>2</span></div>
            <small>● ЧЕРНОВИК</small>
            <h2>{form.title.trim()||"ВАШ НОВЫЙ ТУРНИР"}</h2>
            <p>{form.description.trim()||"Предпросмотр параметров турнира до его публикации."}</p>
            <div className="iste-tournaments__summary-grid">
              <div><small>ФОРМАТ</small><strong>{form.teamSize}vs{form.teamSize}</strong></div>
              <div><small>СЕРИЯ</small><strong>BO{form.bestOf}</strong></div>
              <div><small>КОМАНДЫ</small><strong>{form.maxTeams||"—"}</strong></div>
              <div><small>ОРУЖИЕ</small><strong>{({standard:"STANDARD",awp:"AWP ONLY",pistols:"PISTOLS",deagle:"DEAGLE"})[form.weaponMode]}</strong></div>
            </div>
            <footer>SINGLE ELIMINATION · {Number(form.teamSize)<5?"NO SUBSTITUTES":"TEAM FORMAT"}</footer>
          </aside>
        </div>
      ) : loading ? <p>Загружаем турниры…</p> : items.length ? (
        <div className="iste-tournaments__grid">{items.map(item => (
          <article className="iste-tournaments__card" key={item.id}>
            <span>CS2 · {item.team_size || 5}vs{item.team_size || 5} · {item.best_of === 3 ? "BO3" : "BO1"} · {({standard:"Стандарт",awp:"AWP",pistols:"Пистолеты",deagle:"Desert Eagle"})[item.weapon_mode] || "Стандарт"}</span>
            <h2><Link to={"/tournaments/" + item.slug}>{item.title}</Link></h2>
            <p>{item.description || "Турнир Counter Strike 2"}</p>
            <small>{item.max_teams} команд · {item.status}</small>
          </article>
        ))}</div>
      ) : !error ? <p className="iste-tournaments__empty">Опубликованных турниров пока нет.</p> : null}
    </section>
  );
}