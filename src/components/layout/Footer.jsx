import { Link } from "react-router-dom";

import logo from "../../assets/logos/iste-logo.png";

import "./Footer.css";

const footerGroups = [
  {
    title: "Навигация",
    links: [
      { label: "Главная", to: "/" },
      { label: "Команда", to: "/team" },
      { label: "Матчи", to: "/matches" },
      { label: "Новости", to: "/news" },
    ],
  },
  {
    title: "Клуб",
    links: [
      { label: "История ISTe", to: "/history" },
      { label: "Партнёры", to: "/partners" },
      { label: "Магазин", to: "/shop" },
      { label: "Контакты", to: "/contacts" },
    ],
  },
  {
    title: "Документы",
    links: [
      { label: "Политика конфиденциальности", to: "/privacy" },
      { label: "Условия использования", to: "/terms" },
      { label: "Скачать логотип", href: logo, download: "ISTe-logo.png" },
    ],
  },
];

const socialLinks = [
  {
    label: "Telegram",
    href: "https://t.me/ISTesport",
    icon: "telegram",
  },
  {
    label: "Steam",
    href: "https://steamcommunity.com/groups/IceSaberTeam",
    icon: "steam",
  },
  {
    label: "Twitch",
    href: "https://www.twitch.tv/kortavyj",
    icon: "twitch",
  },
  {
    label: "Discord",
    href: "https://discord.gg/AzpCxEgxye",
    icon: "discord",
  },
];

function SocialIcon({ name }) {
  const commonProps = {
    className: "footer-social-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
  };

  if (name === "telegram") {
    return (
      <svg {...commonProps}>
        <path
          d="M3.6 11.1 19.3 4.6c.8-.3 1.5.4 1.2 1.2l-4.6 13.3c-.3.9-1.4 1.1-2 .4l-3.3-3.6-1.9 1.8c-.4.4-1.1.2-1.2-.4l-.8-3.8-3-1c-.7-.2-.8-1.1-.1-1.4Z"
          fill="currentColor"
        />
        <path
          d="m7 13.2 9.8-6-7.7 7.5"
          stroke="#080808"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (name === "steam") {
    return (
      <svg {...commonProps}>
        <circle cx="16.8" cy="7.2" r="3.8" stroke="currentColor" strokeWidth="2" />
        <circle cx="16.8" cy="7.2" r="1.5" fill="currentColor" />
        <circle cx="7.2" cy="16.5" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="m9.7 14.8 4.3-4.6M4 14.8l-2.2-1"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (name === "twitch") {
    return (
      <svg {...commonProps}>
        <path
          d="M4 3.5h16v11L15.5 19H12l-3 2v-2H4V3.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M9 8v5M15 8v5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path
        d="M7.2 8.1A11.4 11.4 0 0 1 12 7c1.7 0 3.3.4 4.8 1.1a12.2 12.2 0 0 1 2.2 6.2 11.3 11.3 0 0 1-4.6 2.3l-.7-1c.7-.2 1.4-.5 2.1-.9a9.1 9.1 0 0 1-7.6 0c.7.4 1.4.7 2.1.9l-.7 1A11.3 11.3 0 0 1 5 14.3c.2-2.3.9-4.4 2.2-6.2Z"
        fill="currentColor"
      />
      <circle cx="9.3" cy="12.1" r="1.2" fill="#080808" />
      <circle cx="14.7" cy="12.1" r="1.2" fill="#080808" />
    </svg>
  );
}

function FooterLink({ item }) {
  if (item.to) {
    return (
      <Link className="footer-link" to={item.to}>
        {item.label}
      </Link>
    );
  }

  return (
    <a
      className="footer-link"
      href={item.href}
      download={item.download}
      target={item.external ? "_blank" : undefined}
      rel={item.external ? "noopener noreferrer" : undefined}
    >
      {item.label}
    </a>
  );
}

function scrollToPageTop() {
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: reduceMotion ? "auto" : "smooth",
  });
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="footer-primary">
          <div className="footer-brand-column">
            <Link className="footer-brand" to="/" aria-label="ISTe, главная страница">
              <img src={logo} alt="" />
              <span>ISTe</span>
            </Link>

            <p className="footer-description">
              Официальный сайт киберспортивной команды ISTe. Состав, матчи,
              новости и история клуба в одном месте.
            </p>

            <nav className="footer-socials" aria-label="Социальные сети ISTe">
              {socialLinks.map((social) => (
                <a
                  className="footer-social"
                  href={social.href}
                  key={social.label}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                >
                  <SocialIcon name={social.icon} />
                </a>
              ))}
            </nav>
          </div>

          <div className="footer-navigation">
            {footerGroups.map((group) => (
              <nav
                className="footer-group"
                aria-label={group.title}
                key={group.title}
              >
                <h2>{group.title}</h2>
                <div className="footer-group-links">
                  {group.links.map((item) => (
                    <FooterLink item={item} key={item.label} />
                  ))}
                </div>
              </nav>
            ))}
          </div>

          <aside className="footer-contact-card">
            <span className="footer-contact-label">Сотрудничество</span>
            <h2>Есть предложение для ISTe?</h2>
            <p>
              Партнёрство, участие в турнире, медиапроект или деловое
              предложение можно отправить через официальные каналы команды.
            </p>
            <Link className="footer-contact-button" to="/contacts">
              Связаться с командой
              <svg viewBox="0 0 20 20" aria-hidden="true">
                <path d="M4 10h11M11 6l4 4-4 4" />
              </svg>
            </Link>
          </aside>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <div className="footer-copyright">
            <strong>© {currentYear} ISTe Esports</strong>
            <span>Все права защищены.</span>
          </div>

          <div className="footer-audience">
            <span className="footer-age">18+</span>
            <span>Материалы сайта предназначены для совершеннолетней аудитории.</span>
          </div>

          <nav className="footer-legal-links" aria-label="Юридические документы">
            <Link to="/privacy">Конфиденциальность</Link>
            <Link to="/terms">Условия</Link>
            <Link to="/contacts">Контакты</Link>
          </nav>

          <button
            className="footer-top-button"
            type="button"
            onClick={scrollToPageTop}
            aria-label="Вернуться в начало страницы"
          >
            Наверх
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 15V4M6 8l4-4 4 4" />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}
