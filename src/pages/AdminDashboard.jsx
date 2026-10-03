import { NavLink } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./FounderDashboard.css";

const copy = {
  uk: {
    eyebrow: "ISTe ADMIN CONTROL",
    title: "Панель адміністратора",
    intro:
      "Центр керування ISTe для адміністратора. Тут зібрані склад, користувачі, тактики, новини, магазин та Discord Bot.",
    protected: "ADMIN",
    open: "Відкрити",
    rosterTitle: "Roster Manager",
    rosterText:
      "Офіційний склад ISTe, ролі гравців, заміни, фото, FACEIT та соціальні мережі.",
    usersTitle: "Користувачі",
    usersText:
      "Керування доступними ролями, блокуваннями та журналом власних адміністративних дій.",
    tacticsTitle: "Тактична дошка",
    tacticsText:
      "Командні тактики, приватні схеми, таймінги, маршрути та utility.",
    newsTitle: "Новини",
    newsText:
      "Чернетки, редагування та публікація новин ISTesport.",
    shopTitle: "ISTe Wear",
    shopText:
      "Товари, статуси, ціни, розміри та заявки на передзамовлення.",
    discordTitle: "Discord Bot",
    discordText:
      "Сервери, перевірка підключення та керування ISTe Bot.",
  },
  en: {
    eyebrow: "ISTe ADMIN CONTROL",
    title: "Administrator panel",
    intro:
      "ISTe management center for administrators. Roster, users, tactics, news, store and Discord Bot are collected here.",
    protected: "ADMIN",
    open: "Open",
    rosterTitle: "Roster Manager",
    rosterText:
      "Official ISTe roster, player roles, substitutes, photos, FACEIT and social links.",
    usersTitle: "Users",
    usersText:
      "Manage permitted roles, account blocks and your administrative audit history.",
    tacticsTitle: "Tactical Board",
    tacticsText:
      "Team tactics, private boards, timings, routes and utility.",
    newsTitle: "News",
    newsText:
      "Draft, edit and publish ISTesport news.",
    shopTitle: "ISTe Wear",
    shopText:
      "Products, statuses, prices, sizes and pre-order requests.",
    discordTitle: "Discord Bot",
    discordText:
      "Servers, connection verification and ISTe Bot management.",
  },
};

const cards = [
  {
    key: "roster",
    to: "/control/roster",
    mark: "01",
  },
  {
    key: "users",
    to: "/owner/users",
    mark: "02",
  },
  {
    key: "tactics",
    to: "/player/tactics",
    mark: "03",
  },
  {
    key: "news",
    to: "/admin/news",
    mark: "04",
  },
  {
    key: "shop",
    to: "/owner/shop",
    mark: "05",
  },
  {
    key: "discord",
    to: "/owner/discord",
    mark: "06",
  },
];

export default function AdminDashboard() {
  const {
    language,
  } = useLanguage();

  const c =
    copy[language] ||
    copy.uk;

  const content = {
    roster: [
      c.rosterTitle,
      c.rosterText,
    ],
    users: [
      c.usersTitle,
      c.usersText,
    ],
    tactics: [
      c.tacticsTitle,
      c.tacticsText,
    ],
    news: [
      c.newsTitle,
      c.newsText,
    ],
    shop: [
      c.shopTitle,
      c.shopText,
    ],
    discord: [
      c.discordTitle,
      c.discordText,
    ],
  };

  return (
    <section className="founder-dashboard-page">
      <div className="founder-dashboard-shell">
        <header className="founder-dashboard-header">
          <div>
            <span className="founder-dashboard-eyebrow">
              {c.eyebrow}
            </span>
            <h1>{c.title}</h1>
            <p>{c.intro}</p>
          </div>

          <span className="founder-dashboard-lock">
            <i />
            {c.protected}
          </span>
        </header>

        <div className="founder-dashboard-grid">
          {cards.map(
            ({
              key,
              to,
              mark,
            }) => {
              const [
                title,
                description,
              ] =
                content[key];

              return (
                <NavLink
                  key={key}
                  to={to}
                  className="founder-dashboard-card"
                >
                  <span className="founder-dashboard-number">
                    {mark}
                  </span>

                  <div>
                    <h2>
                      {title}
                    </h2>
                    <p>
                      {description}
                    </p>
                  </div>

                  <span className="founder-dashboard-open">
                    {c.open}
                    <svg
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 10h10m-4-4 4 4-4 4"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      />
                    </svg>
                  </span>
                </NavLink>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}
