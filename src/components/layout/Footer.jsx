import { Link } from "react-router-dom";

import logo from "../../assets/logos/iste-logo.png";

import "./Footer.css";

const footerGroups = [
  {
    title: "МЕНЮ",
    links: [
      { label: "ГЛАВНАЯ", to: "/" },
      { label: "НОВОСТИ", to: "/news" },
      { label: "МАТЧИ", to: "/matches" },
      { label: "КОМАНДА", to: "/team" },
    ],
  },
  {
    title: "МЕДИА",
    links: [
      { label: "ВСЕ МЕДИА", href: "/#media" },
      {
        label: "ВИДЕО",
        href: "https://www.youtube.com/@Hell_Hound_Game",
        external: true,
      },
      {
        label: "СТРИМЫ",
        href: "https://www.twitch.tv/hell_hound_tw",
        external: true,
      },
    ],
  },
  {
    title: "ПРО КЛУБ",
    links: [
      { label: "ПАРТНЁРЫ", to: "/partners" },
      { label: "ИСТОРИЯ", to: "/team" },
      { label: "КОНТАКТЫ", to: "/contacts" },
      { label: "ЛОГОТИП", href: logo, download: "ISTe-logo.png" },
    ],
  },
];

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/", icon: "instagram" },
  { label: "X", href: "https://x.com/", icon: "x" },
  { label: "Telegram", href: "https://t.me/", icon: "telegram" },
  { label: "TikTok", href: "https://www.tiktok.com/", icon: "tiktok" },
  { label: "Steam", href: "https://steamcommunity.com/", icon: "steam" },
  {
    label: "YouTube",
    href: "https://www.youtube.com/@Hell_Hound_Game",
    icon: "youtube",
  },
  {
    label: "Twitch",
    href: "https://www.twitch.tv/hell_hound_tw",
    icon: "twitch",
  },
  { label: "Discord", href: "https://discord.com/", icon: "discord" },
];

function SocialIcon({ name }) {
  const commonProps = {
    className: "footer-social-icon",
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg",
    "aria-hidden": "true",
  };

  if (name === "instagram") {
    return (
      <svg {...commonProps}>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <circle cx="17.5" cy="6.8" r="1.1" fill="currentColor" />
      </svg>
    );
  }

  if (name === "x") {
    return (
      <svg {...commonProps}>
        <path d="M5 4L19 20M19 4L5 20" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "telegram") {
    return (
      <svg {...commonProps}>
        <path d="M3.6 11.1L19.3 4.6C20.1 4.3 20.8 5 20.5 5.8L15.9 19.1C15.6 20 14.5 20.2 13.9 19.5L10.6 15.9L8.7 17.7C8.3 18.1 7.6 17.9 7.5 17.3L6.7 13.5L3.7 12.5C3 12.3 2.9 11.4 3.6 11.1Z" fill="currentColor" />
        <path d="M7 13.2L16.8 7.2L9.1 14.7" stroke="#121216" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "tiktok") {
    return (
      <svg {...commonProps}>
        <path d="M14.1 4V14.3C14.1 17 12.1 19 9.5 19C7.2 19 5.3 17.2 5.3 14.9C5.3 12.6 7.2 10.7 9.5 10.7C10.1 10.7 10.6 10.8 11.1 11V7.9C10.6 7.8 10 7.7 9.5 7.7C5.5 7.7 2.3 10.9 2.3 14.9C2.3 18.8 5.5 22 9.5 22C13.7 22 17.1 18.7 17.1 14.3V9.5C18.3 10.3 19.7 10.7 21.2 10.7V7.7C18.8 7.7 17 6.1 17 4H14.1Z" fill="currentColor" />
      </svg>
    );
  }

  if (name === "steam") {
    return (
      <svg {...commonProps}>
        <circle cx="16.8" cy="7.2" r="3.8" stroke="currentColor" strokeWidth="2" />
        <circle cx="16.8" cy="7.2" r="1.5" fill="currentColor" />
        <circle cx="7.2" cy="16.5" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M9.7 14.8L14 10.2M4 14.8L1.8 13.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (name === "youtube") {
    return (
      <svg {...commonProps}>
        <rect x="2.5" y="6" width="19" height="12" rx="4" fill="currentColor" />
        <path d="M10 9.3L15 12L10 14.7V9.3Z" fill="#121216" />
      </svg>
    );
  }

  if (name === "twitch") {
    return (
      <svg {...commonProps}>
        <path d="M4 3.5H20V14.5L15.5 19H12L9 21V19H4V3.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 8V13M15 8V13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M7.2 8.1C8.7 7.4 10.3 7 12 7C13.7 7 15.3 7.4 16.8 8.1C18.1 9.9 18.8 12 19 14.3C17.4 15.5 15.9 16.2 14.4 16.6L13.7 15.6C14.4 15.4 15.1 15.1 15.8 14.7C13.3 15.8 10.7 15.8 8.2 14.7C8.9 15.1 9.6 15.4 10.3 15.6L9.6 16.6C8.1 16.2 6.6 15.5 5 14.3C5.2 12 5.9 9.9 7.2 8.1Z" fill="currentColor" />
      <circle cx="9.3" cy="12.1" r="1.2" fill="#121216" />
      <circle cx="14.7" cy="12.1" r="1.2" fill="#121216" />
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
      rel={item.external ? "noreferrer" : undefined}
    >
      {item.label}
    </a>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-top">
          <div className="footer-intro">
            <Link className="footer-brand" to="/" aria-label="ISTe, главная">
              ISTe
            </Link>
            <p>Официальный сайт киберспортивной команды ISTe</p>
          </div>

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

          <div className="footer-shop-column">
            <Link className="footer-shop-link" to="/shop">
              МАГАЗИН
              <span aria-hidden="true">↗</span>
            </Link>
            <p>Форма команды, мерч и будущие коллекции ISTe.</p>
          </div>
        </div>

        <nav
          className="footer-socials"
          id="footer-socials"
          aria-label="Социальные сети ISTe"
        >
          {socialLinks.map((social) => (
            <a
              className="footer-social"
              href={social.href}
              key={social.label}
              target="_blank"
              rel="noreferrer"
              aria-label={social.label}
              title={social.label}
            >
              <SocialIcon name={social.icon} />
            </a>
          ))}
        </nav>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <Link className="footer-bottom-brand" to="/" aria-label="ISTe, главная">
            <img src={logo} alt="" />
            <span>
              ISTe Esports {currentYear} ©
              <small>Материалы сайта предназначены для аудитории 18+</small>
            </span>
          </Link>

          <div className="footer-legal">
            <p>Все права на материалы сайта принадлежат их владельцам.</p>
            <div>
              <Link to="/privacy">Политика конфиденциальности</Link>
              <Link to="/terms">Условия использования</Link>
              <Link to="/contacts">Связаться с командой</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
