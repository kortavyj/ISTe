import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { useLanguage } from "../i18n/LanguageContext.jsx";
import "./TournamentsShowcase.css";

const DISCORD = "https://discord.gg/AzpCxEgxye";
const copy = {
  uk: {
    title: "ТУРНІРИ CS2",
    eyebrow: "ISTesport / CS2",
    intro: "Скоро на платформі ISTe. Ми готуємо серію турнірів, які об'єднають команди, гравців і нашу спільноту.",
    discord: "Слідкувати в Discord",
    notify: "Дізнатися першими",
    subscribed: "Сповіщення увімкнено",
    subscribing: "Збереження...",
    alertSuccess: "Готово! Після публікації турніру з’явиться сповіщення в дзвіночку на сайті.",
    alertRemoved: "Підписку на анонси вимкнено.",
    alertLogin: "Увійди в акаунт ISTe, щоб отримувати сповіщення про турніри.",
    alertError: "Не вдалося оновити підписку. Спробуй ще раз.",
    statusTitle: "ТУРНІРИ НЕЗАБАРОМ",
    statusDescription: "Готуємо перші змагання CS2. Анонси, регламент та реєстрація з’являться після офіційного оголошення.",
    seasonLabel: "НОВИЙ СЕЗОН",
    dateLabel: "ДАТУ БУДЕ ОГОЛОШЕНО",
    statusEyebrow: "ISTe / UPCOMING EVENTS",
    statusWatch: "СТЕЖ ЗА АНОНСАМИ",
    formats: "ФОРМАТИ ТУРНІРІВ",
    cards: [
      { title: "Відкриті турніри", description: "Доступні для всіх команд. Ідеальний старт для нових складів." },
      { title: "Командні кубки", description: "Багатоетапні турніри з більшою конкуренцією та статусом." },
      { title: "Події спільноти", description: "Тематичні змагання, шоуматчі та активності для учасників ISTe." },
    ],
    followTitle: "БУДЬ У КУРСІ",
    followDescription: "Приєднуйся до нашого Discord, щоб не пропустити анонси турнірів, реєстрацію та важливі новини.",
    followButton: "Перейти в Discord",
    request: "Запропонувати проведення турніру",
    note: "Реєстрація ще не відкрита. Дати та призові фонди будуть оголошені окремо.",
  },
  ru: {
    title: "ТУРНИРЫ CS2",
    eyebrow: "ISTesport / CS2",
    intro: "Скоро на платформе ISTe. Мы готовим серию турниров, объединяющих команды, игроков и наше сообщество.",
    discord: "Следить в Discord",
    notify: "Узнать первыми",
    subscribed: "Уведомления включены",
    subscribing: "Сохранение...",
    alertSuccess: "Готово! После публикации турнира уведомление появится в колокольчике на сайте.",
    alertRemoved: "Подписка на анонсы отключена.",
    alertLogin: "Войди в аккаунт ISTe, чтобы получать уведомления о турнирах.",
    alertError: "Не удалось обновить подписку. Попробуй ещё раз.",
    statusTitle: "ТУРНИРЫ СКОРО",
    statusDescription: "Готовим первые соревнования CS2. Анонсы, регламент и регистрация появятся после официального объявления.",
    seasonLabel: "НОВЫЙ СЕЗОН",
    dateLabel: "ДАТА БУДЕТ ОБЪЯВЛЕНА",
    statusEyebrow: "ISTe / UPCOMING EVENTS",
    statusWatch: "СЛЕДИ ЗА АНОНСАМИ",
    formats: "ФОРМАТЫ ТУРНИРОВ",
    cards: [
      { title: "Открытые турниры", description: "Доступны всем командам. Хороший старт для новых составов." },
      { title: "Командные кубки", description: "Многоэтапные турниры с более высокой конкуренцией и статусом." },
      { title: "События сообщества", description: "Тематические соревнования, шоу-матчи и активности участников ISTe." },
    ],
    followTitle: "БУДЬ В КУРСЕ",
    followDescription: "Присоединяйся к нашему Discord, чтобы не пропустить анонсы, регистрацию и важные новости.",
    followButton: "Перейти в Discord",
    request: "Предложить проведение турнира",
    note: "Регистрация ещё не открыта. Даты и призовые фонды будут объявлены отдельно.",
  },
  en: {
    title: "CS2 TOURNAMENTS",
    eyebrow: "ISTesport / CS2",
    intro: "Coming to ISTe. We're preparing a series of events bringing teams, players and our community together.",
    discord: "Follow on Discord",
    notify: "Be first to know",
    subscribed: "Alerts enabled",
    subscribing: "Saving...",
    alertSuccess: "Subscribed! Tournament announcements will appear in the website notification bell.",
    alertRemoved: "Tournament alerts disabled.",
    alertLogin: "Sign in to ISTe to receive tournament notifications.",
    alertError: "Could not update your subscription. Try again.",
    statusTitle: "TOURNAMENTS COMING SOON",
    statusDescription: "Our first CS2 events are in preparation. Announcements, rules and registration will follow an official launch.",
    seasonLabel: "NEW SEASON",
    dateLabel: "DATE TO BE ANNOUNCED",
    statusEyebrow: "ISTe / UPCOMING EVENTS",
    statusWatch: "FOLLOW ANNOUNCEMENTS",
    formats: "TOURNAMENT FORMATS",
    cards: [
      { title: "Open tournaments", description: "Accessible to all teams. A great start for new rosters." },
      { title: "Team cups", description: "Multi-stage tournaments with stronger competition and prestige." },
      { title: "Community events", description: "Themed events, showmatches and activities for the ISTe community." },
    ],
    followTitle: "STAY IN THE LOOP",
    followDescription: "Join our Discord for tournament announcements, registration details and important updates.",
    followButton: "Go to Discord",
    request: "Propose hosting a tournament",
    note: "Registration is not open yet. Dates and prizes will be announced separately.",
  },
};

function TournamentIcon({ kind }) {
  if (kind === 0) return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="4" /><circle cx="23" cy="11" r="4" /><path d="M3 26v-4c0-4 3-6 8-6s8 2 8 6v4M18 17c5-1 11 1 11 6v3H22" /></svg>;
  if (kind === 1) return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M8 5h16v10a8 8 0 0 1-16 0V5ZM8 8H3v5c0 4 3 6 7 6M24 8h5v5c0 4-3 6-7 6M16 23v5m-7 0h14" /></svg>;
  return <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M17 2 7 17h8l-2 13 12-18h-9l1-10Z" /></svg>;
}

function ArenaArtwork() {
  return (
    <div className="ts-arena ts-bracket-hero" aria-hidden="true">
      <div className="ts-bracket-atmosphere" />
      <svg className="ts-bracket-svg" viewBox="0 0 620 350" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ts-line" x1="190" y1="0" x2="475" y2="0" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ef344e" stopOpacity=".4"/>
            <stop offset=".55" stopColor="#ed2945" stopOpacity=".9"/>
            <stop offset="1" stopColor="#fc3853" stopOpacity=".8"/>
          </linearGradient>
          <linearGradient id="ts-slot" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#262026" stopOpacity=".95"/>
            <stop offset="1" stopColor="#0a090d" stopOpacity=".97"/>
          </linearGradient>
          <radialGradient id="ts-final-glow">
            <stop stopColor="#e7203e" stopOpacity=".24"/>
            <stop offset="1" stopColor="#e7203e" stopOpacity="0"/>
          </radialGradient>
          <filter id="ts-connect-glow"><feGaussianBlur stdDeviation="4"/></filter>
          <linearGradient id="ts-trophy-metal" x1="0" y1="0" x2="1" y2=".2">
            <stop offset="0" stopColor="#260d16"/>
            <stop offset=".13" stopColor="#b74759"/>
            <stop offset=".24" stopColor="#ffe1d4"/>
            <stop offset=".34" stopColor="#8c5663"/>
            <stop offset=".51" stopColor="#30202e"/>
            <stop offset=".66" stopColor="#d79195"/>
            <stop offset=".79" stopColor="#fff1e0"/>
            <stop offset=".91" stopColor="#9a394c"/>
            <stop offset="1" stopColor="#1c0a15"/>
          </linearGradient>
          <linearGradient id="ts-trophy-bowl" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6c6b5"/>
            <stop offset=".18" stopColor="#894d59"/>
            <stop offset=".42" stopColor="#2b1826"/>
            <stop offset=".62" stopColor="#a85f70"/>
            <stop offset=".84" stopColor="#e8bab1"/>
            <stop offset="1" stopColor="#3a1723"/>
          </linearGradient>
          <linearGradient id="ts-trophy-base" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#c46676"/>
            <stop offset=".25" stopColor="#2b121d"/>
            <stop offset=".59" stopColor="#130d15"/>
            <stop offset="1" stopColor="#992b40"/>
          </linearGradient>
          <radialGradient id="ts-trophy-spot"><stop stopColor="#b51532" stopOpacity=".38"/><stop offset=".65" stopColor="#780b24" stopOpacity=".11"/><stop offset="1" stopColor="#780b24" stopOpacity="0"/></radialGradient>

        </defs>
        <circle cx="532" cy="169" r="106" fill="url(#ts-final-glow)" />
        <g className="ts-bracket-connection" stroke="url(#ts-line)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M190 55 H220 V88 H270 M190 117 H220 V88 M190 233 H220 V265 H270 M190 295 H220 V265"/>
          <path d="M384 88 H411 V176 H471 M384 265 H411 V176"/>
        </g>
        <g stroke="#db3047" strokeWidth="2" opacity=".32" filter="url(#ts-connect-glow)">
          <path d="M220 88H270 M220 265H270 M411 176H471"/>
        </g>
        {[{x:49,y:36},{x:49,y:98},{x:49,y:214},{x:49,y:276}].map(({x,y},i)=>(
          <g key={i}>
            <rect x={x} y={y} width="141" height="38" rx="8" fill="url(#ts-slot)" stroke="#ad3044" strokeOpacity=".55"/>
            <path d={`M${x+12} ${y+13}H${x+44}M${x+12} ${y+22}H${x+67}`} stroke="#dc6576" strokeOpacity=".22" strokeWidth="3" strokeLinecap="round"/>
            <rect x={x+113} y={y+13} width="15" height="11" rx="3" fill="#5c2430" fillOpacity=".45"/>
          </g>
        ))}
        {[{x:270,y:69},{x:270,y:246}].map(({x,y},i)=>(
          <g key={i}>
            <rect x={x} y={y} width="114" height="38" rx="8" fill="url(#ts-slot)" stroke="#c3324a" strokeOpacity=".67"/>
            <path d={`M${x+12} ${y+14}H${x+38}M${x+12} ${y+23}H${x+63}`} stroke="#dc6576" strokeOpacity=".24" strokeWidth="3" strokeLinecap="round"/>
          </g>
        ))}
        <g className="ts-bracket-champion-trophy">
          <ellipse cx="539" cy="184" rx="95" ry="117" fill="url(#ts-trophy-spot)" />
          <path d="M467 177H484" stroke="#e8324d" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="484" cy="177" r="2.5" fill="#ff536c" />
          <ellipse cx="538" cy="253" rx="56" ry="9" fill="#000" opacity=".65"/>
          <g className="ts-bracket-champion-figure">
            <path d="M499 111C478 107 468 117 471 135C473 149 487 161 504 163" stroke="url(#ts-trophy-metal)" strokeWidth="8" strokeLinecap="round"/>
            <path d="M499 112C483 112 477 118 480 132C482 144 490 150 500 152" stroke="#fa9ca1" strokeOpacity=".66" strokeWidth="2.2"/>
            <path d="M576 111C595 107 606 117 603 135C600 151 590 160 572 163" stroke="url(#ts-trophy-metal)" strokeWidth="8" strokeLinecap="round"/>
            <path d="M576 112C594 112 598 119 595 131C593 143 586 150 576 151" stroke="#fac1b7" strokeOpacity=".48" strokeWidth="2.2"/>
            <path d="M490 102Q538 96 585 102L579 149Q573 186 539 198Q504 188 495 150Z" fill="url(#ts-trophy-bowl)" stroke="#e2a3a4" strokeOpacity=".8" strokeWidth="1.6"/>
            <path d="M496 112Q536 118 579 111" stroke="#ffdfcd" strokeOpacity=".78" strokeWidth="2" fill="none"/>
            <path d="M500 124Q537 131 576 121M504 148Q537 156 571 142" stroke="#ffd1c7" strokeOpacity=".22" strokeWidth="1" fill="none"/>
            <path d="M515 113Q509 148 528 177" stroke="#fff1e4" strokeOpacity=".22" strokeWidth="5" fill="none"/>
            <path d="M557 111Q562 146 549 177" stroke="#ffe0d0" strokeOpacity=".4" strokeWidth="4" fill="none"/>
            <ellipse cx="538" cy="103" rx="47" ry="6" fill="url(#ts-trophy-metal)" stroke="#f9cfbf" strokeOpacity=".86" strokeWidth="1.4"/>
            <path d="M520 192Q539 199 556 192L550 208L545 224H531L527 207Z" fill="url(#ts-trophy-metal)" stroke="#d3858e" strokeWidth=".8"/>
            <rect x="524" y="223" width="30" height="6" rx="2" fill="#c57880"/>
            <path d="M507 228H570L576 245H501Z" fill="url(#ts-trophy-base)" stroke="#cd586e" strokeWidth="1"/>
            <path d="M500 243H577L583 250H494Z" fill="url(#ts-trophy-metal)" stroke="#a54258" strokeWidth="1"/>
            <path d="M511 232H566" stroke="#c8858b" strokeOpacity=".4"/>
            <rect x="517" y="234" width="44" height="8" rx="2" fill="#09090e" stroke="#8e4353" strokeWidth=".6"/>
            <path d="M520 238H558" stroke="#e58d92" strokeOpacity=".45" strokeWidth="1"/>
          </g>
          <path d="M488 89L489 81M538 83V73M589 89L593 81" stroke="#f33956" strokeOpacity=".48" strokeWidth="1.4" strokeLinecap="round"/>
          <g stroke="#f43e58" strokeOpacity=".3" strokeWidth="1">
            <path d="M459 252H487M584 252H613M589 267H610"/>
          </g>
        </g>
        <g stroke="#e82842" strokeOpacity=".18">
          <path d="M15 310H208M218 327H405M420 21H602"/>
        </g>
      </svg>
    </div>
  );
}

export default function TournamentsShowcase() {
  const { language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const t = copy[language] || copy.uk;
  const [subscribed, setSubscribed] = useState(false);
  const [alertPending, setAlertPending] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  useEffect(() => {
    if (!user?.id) {
      setSubscribed(false);
      return undefined;
    }
    let live = true;
    fetch("/api/tournaments-alerts", { credentials: "include", cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("status")))
      .then((result) => { if (live) setSubscribed(result.subscribed === true); })
      .catch(() => { if (live) setAlertMessage(t.alertError); });
    return () => { live = false; };
  }, [user?.id]);
  async function toggleAlert() {
    if (alertPending) return;
    if (!user) {
      setAlertMessage(t.alertLogin);
      navigate("/login", { state: { from: "/tournaments" } });
      return;
    }
    setAlertPending(true);
    setAlertMessage("");
    try {
      const response = await fetch("/api/tournaments-alerts", {
        method: subscribed ? "DELETE" : "POST",
        credentials: "include",
        headers: subscribed ? { Accept: "application/json" } : { "Content-Type": "application/json", Accept: "application/json" },
        ...(subscribed ? {} : { body: JSON.stringify({ action: "subscribe" }) }),
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error("Failed");
      setSubscribed(result.subscribed === true);
      setAlertMessage(result.subscribed ? t.alertSuccess : t.alertRemoved);
      window.dispatchEvent(new Event("iste:tournament-alert-changed"));
    } catch {
      setAlertMessage(t.alertError);
    } finally {
      setAlertPending(false);
    }
  }
  return (
    <section className="ts-page ts-preview-page">
      <div className="ts-preview-shell">
        <header className="ts-preview-hero">
          <ArenaArtwork />
          <div className="ts-preview-hero-content">
            <span className="ts-preview-kicker">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
            <div className="ts-preview-actions">

              <button type="button" disabled={alertPending || authLoading} onClick={toggleAlert} className={`ts-preview-secondary ts-alert-toggle${subscribed ? " ts-alert-toggle--active" : ""}`} aria-pressed={subscribed}><svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 20h4" /></svg>{alertPending ? t.subscribing : subscribed ? t.subscribed : t.notify}</button>
            </div>
            <p className="ts-alert-feedback" role="status" aria-live="polite">{alertMessage}</p>
          </div>
        </header>

        <section id="tournament-status" className="ts-preview-announcement ts-season-announcement" aria-labelledby="ts-season-title">
          <div className="ts-season-copy">
            <span className="ts-season-kicker"><span className="ts-season-indicator" aria-hidden="true" />{t.statusEyebrow}</span>
            <h2 id="ts-season-title"><span className="ts-season-slashes" aria-hidden="true">//</span>{t.statusTitle}</h2>
            <p>{t.statusDescription}</p>
            <a className="ts-season-watch" href={DISCORD} target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 17h14l-2-3V9a5 5 0 0 0-10 0v5l-2 3ZM10 20h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              {t.statusWatch}
              <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="ts-season-visual" aria-label={t.dateLabel}>
            <div className="ts-season-visual-grid" aria-hidden="true" />
            <div className="ts-season-calendar" aria-hidden="true">
              <svg viewBox="0 0 80 80" fill="none">
                <rect x="12" y="17" width="56" height="52" rx="9" stroke="currentColor" strokeWidth="2.5"/>
                <path d="M25 11v13M55 11v13M12 33h56" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                <circle cx="30" cy="46" r="3.5" fill="currentColor"/>
                <circle cx="49" cy="46" r="3.5" fill="currentColor"/>
                <circle cx="30" cy="58" r="3.5" fill="currentColor"/>
                <path d="m45 59 5 5 9-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <strong>{t.seasonLabel}</strong>
            <span>{t.dateLabel}</span>
          </div>
        </section>

        <section className="ts-preview-formats" aria-labelledby="ts-formats-heading">
          <h2 id="ts-formats-heading"><span aria-hidden="true">//</span>{t.formats}</h2>
          <div className="ts-preview-format-grid">
            {t.cards.map((item, i) => <article className={"ts-preview-format ts-preview-format--" + i} key={item.title}>
              <TournamentIcon kind={i} />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>)}
          </div>
        </section>




      </div>
    </section>
  );
}
