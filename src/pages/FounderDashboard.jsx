import { NavLink } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./FounderDashboard.css";

const copy = {
  uk: {
    eyebrow: "ISTe FOUNDER CONTROL",
    title: "Панель засновника",
    intro:
      "Окремий центр керування ISTe, доступний лише власнику. Усі ключові адміністративні розділи зібрані в одному місці.",
    protected: "OWNER ONLY",
    open: "Відкрити",
    usersTitle: "Користувачі",
    usersText:
      "Ролі, блокування, пошук акаунтів та журнал адміністративних дій.",
    newsTitle: "Новини",
    newsText:
      "Чернетки, публікації та керування новинами ISTesport.",
    shopTitle: "ISTe Wear",
    shopText:
      "Товари, передзамовлення та керування магазином.",
    discordTitle: "Discord Bot",
    discordText:
      "Сервери, перевірка підключення та глобальні slash-команди.",
    publicBotTitle: "Публічна сторінка бота",
    publicBotText:
      "Перегляд сторінки, через яку користувачі додають ISTe Bot на свої сервери.",
    websiteTitle: "Публічний сайт",
    websiteText:
      "Повернутися до публічної частини ISTesport та перевірити результат змін.",
  },
  ru: {
    eyebrow: "ISTe FOUNDER CONTROL",
    title: "Панель основателя",
    intro:
      "Отдельный центр управления ISTe, доступный только владельцу. Все ключевые административные разделы собраны в одном месте.",
    protected: "ТОЛЬКО OWNER",
    open: "Открыть",
    usersTitle: "Пользователи",
    usersText:
      "Роли, блокировки, поиск аккаунтов и журнал административных действий.",
    newsTitle: "Новости",
    newsText:
      "Черновики, публикации и управление новостями ISTesport.",
    shopTitle: "ISTe Wear",
    shopText:
      "Товары, предзаказы и управление магазином.",
    discordTitle: "Discord Bot",
    discordText:
      "Серверы, проверка подключения и глобальные slash-команды.",
    publicBotTitle: "Публичная страница бота",
    publicBotText:
      "Просмотр страницы, через которую пользователи добавляют ISTe Bot на свои серверы.",
    websiteTitle: "Публичный сайт",
    websiteText:
      "Вернуться в публичную часть ISTesport и проверить результат изменений.",
  },
  en: {
    eyebrow: "ISTe FOUNDER CONTROL",
    title: "Founder dashboard",
    intro:
      "A dedicated ISTe management center available only to the owner. All key administrative sections are collected in one place.",
    protected: "OWNER ONLY",
    open: "Open",
    usersTitle: "Users",
    usersText:
      "Roles, bans, account search and administrative audit log.",
    newsTitle: "News",
    newsText:
      "Drafts, publications and ISTesport news management.",
    shopTitle: "ISTe Wear",
    shopText:
      "Products, pre-orders and shop management.",
    discordTitle: "Discord Bot",
    discordText:
      "Servers, connection verification and global slash commands.",
    publicBotTitle: "Public bot page",
    publicBotText:
      "Preview the page users use to add ISTe Bot to their own servers.",
    websiteTitle: "Public website",
    websiteText:
      "Return to the public ISTesport website and review the latest changes.",
  },
};

const cards = [
  { key: "users", to: "/owner/users", mark: "01" },
  { key: "news", to: "/admin/news", mark: "02" },
  { key: "shop", to: "/owner/shop", mark: "03" },
  { key: "discord", to: "/owner/discord", mark: "04" },
  { key: "publicBot", to: "/discord", mark: "05" },
  { key: "website", to: "/", mark: "06" },
];

export default function FounderDashboard() {
  const { language } = useLanguage();
  const c = copy[language] || copy.uk;

  const content = {
    users: [c.usersTitle, c.usersText],
    news: [c.newsTitle, c.newsText],
    shop: [c.shopTitle, c.shopText],
    discord: [c.discordTitle, c.discordText],
    publicBot: [c.publicBotTitle, c.publicBotText],
    website: [c.websiteTitle, c.websiteText],
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
          {cards.map(({ key, to, mark }) => {
            const [title, description] = content[key];

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
                  <h2>{title}</h2>
                  <p>{description}</p>
                </div>

                <span className="founder-dashboard-open">
                  {c.open}
                  <svg viewBox="0 0 20 20" aria-hidden="true">
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
          })}
        </div>
      </div>
    </section>
  );
}
