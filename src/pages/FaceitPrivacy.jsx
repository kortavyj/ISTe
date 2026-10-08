import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Legal.css";

const UPDATED_AT = "2026-10-08";

const COPY = {
  uk: {
    eyebrow: "ISTe FACEIT",
    title: "Політика конфіденційності розширення ISTe FACEIT",
    description:
      "Як ISTe FACEIT обробляє налаштування, дані FACEIT та технічну інформацію, необхідну для роботи розширення.",
    updated: "Останнє оновлення: 8 жовтня 2026 року",
    contents: "Зміст",
    contact: "Зв’язатися з командою",
    home: "Повернутися на головну",
    sections: [
      {
        id: "scope",
        title: "1. Сфера дії",
        blocks: [
          "Ця політика стосується браузерного розширення ISTe FACEIT та його серверної інфраструктури, яка використовується для FACEIT Connect і отримання статистики.",
          "ISTe FACEIT призначений для візуального налаштування FACEIT та відображення статистичної інформації про гравців і матчі. Розширення не автоматизує ігровий процес і не керує клієнтом гри.",
        ],
      },
      {
        id: "local",
        title: "2. Дані, що зберігаються у браузері",
        blocks: [
          "У профілі браузера можуть зберігатися налаштування розширення, параметри оформлення, обране локальне фонове зображення або відео та непрозорий токен сесії ISTe після підключення FACEIT.",
          "Локальні фонові файли не завантажуються розширенням на сервер ISTe.",
          "Розширення також використовує короткочасний кеш статистики у пам’яті, щоб не повторювати однакові запити. Такий кеш автоматично обмежується, швидко застаріває та очищується при виході або недійсній сесії.",
        ],
      },
      {
        id: "faceit",
        title: "3. FACEIT Connect і статистика",
        blocks: [
          "Підключення акаунта виконується через FACEIT OAuth2 з PKCE. Користувачеві не потрібно вводити FACEIT API key.",
          "Для роботи функцій можуть оброблятися нікнейм, аватар, FACEIT Level, ELO, публічна статистика CS2, історія матчів, статистика карт, склади матчів, статус і контекст матчу та party ID, якщо FACEIT надає ці дані.",
          "Офіційні FACEIT client credentials і серверний FACEIT Data API key зберігаються лише на сервері та не вбудовуються в розширення.",
        ],
      },
      {
        id: "session",
        title: "4. Сесія ISTe",
        blocks: [
          "Після успішного FACEIT OAuth розширення отримує непрозорий токен сесії ISTe. Він потрібний для авторизованих запитів до серверної частини ISTe FACEIT.",
          "Під час виходу локальна сесія очищується, а серверна сесія анулюється, якщо сервер доступний. Сесії також мають обмежений строк дії.",
        ],
      },
      {
        id: "purpose",
        title: "5. Для чого використовуються дані",
        blocks: [
          "Дані використовуються лише для автентифікації, відображення статистики, ISTe Rating, аналізу форми, Match Intelligence, статистики карт, історії матчів, premade-структури та інших функцій розширення, які запускає користувач.",
          "ISTe FACEIT не використовує ці дані для автоматизації геймплею.",
        ],
      },
      {
        id: "sharing",
        title: "6. Передача та реклама",
        blocks: [
          "ISTe FACEIT не містить реклами та не продає дані користувачів рекламодавцям.",
          "Дані можуть передаватися технічній інфраструктурі ISTe та FACEIT лише в обсязі, необхідному для роботи автентифікації й статистичних функцій.",
        ],
      },
      {
        id: "permissions",
        title: "7. Дозволи розширення",
        blocks: [
          "Storage використовується для налаштувань, локального оформлення та непрозорого токена сесії. Unlimited Storage потрібний для локальних фонів, для яких розширення додатково застосовує власний ліміт розміру.",
          "Доступ до faceit.com потрібний для застосування оформлення та вбудовування статистики. Доступ до серверного домену ISTe потрібний для OAuth-сесії та серверних запитів FACEIT Data API.",
        ],
      },
      {
        id: "rights",
        title: "8. Керування даними",
        blocks: [
          "Користувач може вийти з FACEIT у налаштуваннях розширення, видалити розширення або очистити його локальні дані засобами браузера.",
          "З питаннями щодо даних або видалення серверної інформації можна звернутися до ISTe через офіційні контакти.",
        ],
      },
      {
        id: "updates",
        title: "9. Оновлення політики",
        blocks: [
          "Політика може оновлюватися разом із розвитком ISTe FACEIT, змінами FACEIT API, браузерних вимог або серверної інфраструктури. Актуальна версія публікується на цій сторінці.",
        ],
      },
    ],
  },
  ru: {
    eyebrow: "ISTe FACEIT",
    title: "Политика конфиденциальности расширения ISTe FACEIT",
    description:
      "Как ISTe FACEIT обрабатывает настройки, данные FACEIT и техническую информацию, необходимую для работы расширения.",
    updated: "Последнее обновление: 8 октября 2026 года",
    contents: "Содержание",
    contact: "Связаться с командой",
    home: "Вернуться на главную",
    sections: [
      {
        id: "scope",
        title: "1. Область действия",
        blocks: [
          "Эта политика относится к браузерному расширению ISTe FACEIT и его серверной инфраструктуре, используемой для FACEIT Connect и получения статистики.",
          "ISTe FACEIT предназначен для визуальной настройки FACEIT и отображения статистики игроков и матчей. Расширение не автоматизирует игровой процесс и не управляет игровым клиентом.",
        ],
      },
      {
        id: "local",
        title: "2. Данные, хранящиеся в браузере",
        blocks: [
          "В профиле браузера могут храниться настройки расширения, параметры оформления, выбранное локальное фоновое изображение или видео и непрозрачный токен сессии ISTe после подключения FACEIT.",
          "Локальные фоновые файлы не загружаются расширением на сервер ISTe.",
          "Расширение также использует краткосрочный кеш статистики в памяти, чтобы не повторять одинаковые запросы. Кеш ограничен, быстро устаревает и очищается при выходе или недействительной сессии.",
        ],
      },
      {
        id: "faceit",
        title: "3. FACEIT Connect и статистика",
        blocks: [
          "Подключение аккаунта выполняется через FACEIT OAuth2 с PKCE. Пользователю не нужно вводить FACEIT API key.",
          "Для работы функций могут обрабатываться никнейм, аватар, FACEIT Level, ELO, публичная статистика CS2, история матчей, статистика карт, составы матчей, статус и контекст матча и party ID, если FACEIT предоставляет эти данные.",
          "Официальные FACEIT client credentials и серверный FACEIT Data API key хранятся только на сервере и не встраиваются в расширение.",
        ],
      },
      {
        id: "session",
        title: "4. Сессия ISTe",
        blocks: [
          "После успешного FACEIT OAuth расширение получает непрозрачный токен сессии ISTe. Он необходим для авторизованных запросов к серверной части ISTe FACEIT.",
          "При выходе локальная сессия очищается, а серверная сессия отзывается, если сервер доступен. Сессии также имеют ограниченный срок действия.",
        ],
      },
      {
        id: "purpose",
        title: "5. Для чего используются данные",
        blocks: [
          "Данные используются только для аутентификации, отображения статистики, ISTe Rating, анализа формы, Match Intelligence, статистики карт, истории матчей, premade-структуры и других функций расширения, запускаемых пользователем.",
          "ISTe FACEIT не использует эти данные для автоматизации геймплея.",
        ],
      },
      {
        id: "sharing",
        title: "6. Передача и реклама",
        blocks: [
          "ISTe FACEIT не содержит рекламы и не продаёт данные пользователей рекламодателям.",
          "Данные могут передаваться технической инфраструктуре ISTe и FACEIT только в объёме, необходимом для работы аутентификации и статистических функций.",
        ],
      },
      {
        id: "permissions",
        title: "7. Разрешения расширения",
        blocks: [
          "Storage используется для настроек, локального оформления и непрозрачного токена сессии. Unlimited Storage нужен для локальных фонов, для которых расширение дополнительно применяет собственный лимит размера.",
          "Доступ к faceit.com нужен для применения оформления и встраивания статистики. Доступ к серверному домену ISTe нужен для OAuth-сессии и серверных запросов FACEIT Data API.",
        ],
      },
      {
        id: "rights",
        title: "8. Управление данными",
        blocks: [
          "Пользователь может выйти из FACEIT в настройках расширения, удалить расширение или очистить его локальные данные средствами браузера.",
          "По вопросам данных или удаления серверной информации можно обратиться к ISTe через официальные контакты.",
        ],
      },
      {
        id: "updates",
        title: "9. Обновление политики",
        blocks: [
          "Политика может обновляться вместе с развитием ISTe FACEIT, изменениями FACEIT API, требований браузеров или серверной инфраструктуры. Актуальная версия публикуется на этой странице.",
        ],
      },
    ],
  },
  en: {
    eyebrow: "ISTe FACEIT",
    title: "ISTe FACEIT Extension Privacy Policy",
    description:
      "How ISTe FACEIT handles settings, FACEIT data and technical information required to operate the extension.",
    updated: "Last updated: October 8, 2026",
    contents: "Contents",
    contact: "Contact the team",
    home: "Back to home",
    sections: [
      {
        id: "scope",
        title: "1. Scope",
        blocks: [
          "This policy applies to the ISTe FACEIT browser extension and the server infrastructure used for FACEIT Connect and statistics requests.",
          "ISTe FACEIT provides visual customization and player/match statistics. It does not automate gameplay or control the game client.",
        ],
      },
      {
        id: "local",
        title: "2. Data stored in the browser",
        blocks: [
          "The browser profile may store extension settings, appearance options, a user-selected local background image or video and an opaque ISTe session token after FACEIT is connected.",
          "Local background files are not uploaded by the extension to ISTe servers.",
          "The extension also uses short-lived in-memory statistics caches to avoid duplicate requests. These caches are bounded, expire quickly and are cleared when the user signs out or the session becomes invalid.",
        ],
      },
      {
        id: "faceit",
        title: "3. FACEIT Connect and statistics",
        blocks: [
          "Account connection uses FACEIT OAuth2 with PKCE. Users do not need to enter a FACEIT API key.",
          "Features may process nickname, avatar, FACEIT Level, ELO, public CS2 statistics, match history, map statistics, match rosters, match status/context and party IDs when FACEIT exposes that information.",
          "FACEIT client credentials and the server-side FACEIT Data API key remain on the backend and are not embedded in the extension.",
        ],
      },
      {
        id: "session",
        title: "4. ISTe session",
        blocks: [
          "After successful FACEIT OAuth, the extension receives an opaque ISTe session token used for authenticated requests to the ISTe FACEIT backend.",
          "Signing out clears the local session and revokes the backend session when the backend is reachable. Sessions also expire under the backend session policy.",
        ],
      },
      {
        id: "purpose",
        title: "5. How data is used",
        blocks: [
          "Data is used only for authentication and extension features such as statistics, ISTe Rating, form analysis, Match Intelligence, map analytics, match history and premade structure.",
          "ISTe FACEIT does not use this data to automate gameplay.",
        ],
      },
      {
        id: "sharing",
        title: "6. Sharing and advertising",
        blocks: [
          "ISTe FACEIT contains no advertising and does not sell user data to advertisers.",
          "Data may be sent to ISTe technical infrastructure and FACEIT only to the extent required for authentication and requested statistics features.",
        ],
      },
      {
        id: "permissions",
        title: "7. Extension permissions",
        blocks: [
          "Storage is used for settings, local customization data and the opaque session token. Unlimited Storage supports local backgrounds, which are also subject to an extension file-size limit.",
          "Access to faceit.com is required to apply customization and render intelligence. Access to the ISTe backend domain is required for the OAuth session and server-side FACEIT Data API requests.",
        ],
      },
      {
        id: "rights",
        title: "8. Data controls",
        blocks: [
          "Users can sign out of FACEIT in the extension settings, remove the extension or clear its local browser data.",
          "Questions about data or server-side deletion requests can be submitted to ISTe through the official contact channels.",
        ],
      },
      {
        id: "updates",
        title: "9. Policy updates",
        blocks: [
          "This policy may change as ISTe FACEIT, FACEIT APIs, browser requirements or backend infrastructure evolve. The current version is published on this page.",
        ],
      },
    ],
  },
};

export default function FaceitPrivacy() {
  const { language } = useLanguage();
  const copy = COPY[language] || COPY.uk;

  return (
    <section className="legal-page">
      <div className="legal-glow" aria-hidden="true" />

      <header className="legal-header">
        <p className="legal-eyebrow">{copy.eyebrow}</p>
        <h1>{copy.title}</h1>
        <p>{copy.description}</p>
        <span className="legal-updated">
          <time dateTime={UPDATED_AT}>{copy.updated}</time>
        </span>
      </header>

      <div className="legal-layout">
        <aside className="legal-sidebar">
          <p>{copy.contents}</p>
          <nav aria-label={copy.title}>
            {copy.sections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="legal-document">
          {copy.sections.map((section) => (
            <section id={section.id} className="legal-section" key={section.id}>
              <h2>{section.title}</h2>
              {section.blocks.map((block, index) => (
                <p key={`${section.id}-${index}`}>{block}</p>
              ))}
            </section>
          ))}

          <div className="legal-actions">
            <Link className="legal-button legal-button-primary" to="/contacts">
              {copy.contact}
            </Link>
            <Link className="legal-button" to="/">
              {copy.home}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
