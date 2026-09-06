import { Link } from "react-router-dom";

import logo from "../../assets/logos/iste-logo.png";
import { useLanguage } from "../../i18n/LanguageContext.jsx";

import "./Footer.css";

const footerGroups = [
  {
    titleKey: "footer.navigation",
    links: [
      {
        labelKey: "footer.home",
        to: "/",
      },
      {
        labelKey: "footer.team",
        to: "/team",
      },
      {
        labelKey: "footer.matches",
        to: "/matches",
      },
      {
        labelKey: "footer.news",
        to: "/news",
      },
    ],
  },
  {
    titleKey: "footer.club",
    links: [
      {
        labelKey: "footer.history",
        to: "/history",
      },
      {
        labelKey: "footer.partners",
        to: "/partners",
      },
      {
        labelKey: "footer.shop",
        to: "/shop",
      },
      {
        labelKey: "footer.contacts",
        to: "/contacts",
      },
    ],
  },
  {
    titleKey: "footer.documents",
    links: [
      {
        labelKey: "footer.privacy",
        to: "/privacy",
      },
      {
        labelKey: "footer.terms",
        to: "/terms",
      },
      {
        labelKey: "footer.downloadLogo",
        href: logo,
        download: "ISTe-logo.png",
      },
    ],
  },
];

function FooterLink({
  item,
  label,
}) {
  if (item.to) {
    return (
      <Link
        className="footer-link"
        to={item.to}
      >
        {label}
      </Link>
    );
  }

  return (
    <a
      className="footer-link"
      href={item.href}
      download={item.download}
      target={
        item.external
          ? "_blank"
          : undefined
      }
      rel={
        item.external
          ? "noopener noreferrer"
          : undefined
      }
    >
      {label}
    </a>
  );
}

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <div className="footer-primary">
          <div className="footer-brand-column">
            <Link
              className="footer-brand"
              to="/"
              aria-label={t(
                "footer.homeAria",
              )}
            >
              <img src={logo} alt="" />
              <span>ISTe</span>
            </Link>

            <p className="footer-description">
              {t(
                "footer.description",
              )}
            </p>
          </div>

          <div className="footer-navigation">
            {footerGroups.map(
              (group) => {
                const groupTitle =
                  t(group.titleKey);

                return (
                  <nav
                    className="footer-group"
                    aria-label={groupTitle}
                    key={group.titleKey}
                  >
                    <h2>
                      {groupTitle}
                    </h2>

                    <div className="footer-group-links">
                      {group.links.map(
                        (item) => (
                          <FooterLink
                            item={item}
                            label={t(
                              item.labelKey,
                            )}
                            key={
                              item.labelKey
                            }
                          />
                        ),
                      )}
                    </div>
                  </nav>
                );
              },
            )}
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-inner">
          <strong className="footer-copyright-line">
            © 2026 ISTesport
          </strong>

          <a
            className="footer-email"
            href="mailto:istesport.official@gmail.com"
          >
            istesport.official@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
