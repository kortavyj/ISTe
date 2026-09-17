import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Legal.css";

const UPDATED_AT = "2026-09-17";

const COPY = {
  uk: {
    eyebrow: "AI privacy notice",
    title: "Використання штучного інтелекту та конфіденційність",
    description:
      "Доповнення до Політики конфіденційності ISTesport щодо роботи ISTe AI Support та обробки AI-запитів.",
    updatedLabel: "Останнє оновлення:",
    updatedDate: "17 вересня 2026 року",
    contents: "Зміст",
    contentsAria: "Зміст політики використання AI",
    privacyButton: "Основна політика конфіденційності",
    supportButton: "Відкрити AI Support",
    contactButton: "Зв’язатися з командою",
    sections: [
      {
        id: "scope",
        title: "1. Сфера дії",
        blocks: [
          ["p", "Цей документ є доповненням до основної Політики конфіденційності ISTesport і пояснює, як працюють функції штучного інтелекту на сайті, зокрема ISTe AI Support."],
          ["p", "Використання AI Support є добровільним. Користувач може не надсилати запит до AI та звернутися до команди ISTesport через звичайні канали підтримки."],
        ],
      },
      {
        id: "provider",
        title: "2. AI-постачальник",
        blocks: [
          ["p", "Для генерації частини відповідей ISTe AI Support використовує OpenAI API. OpenAI виступає стороннім технічним постачальником для обробки AI-запитів."],
          ["p", "Обробка даних OpenAI регулюється актуальними умовами та політиками OpenAI для API. Вони можуть змінюватися незалежно від ISTesport."],
        ],
      },
      {
        id: "data",
        title: "3. Які дані можуть передаватися до AI",
        blocks: [
          ["p", "Коли відповідь неможливо надати лише з локальної бази FAQ, до AI-постачальника можуть передаватися:"],
          ["ul", [
            "текст поточного запиту користувача;",
            "обмежена недавня історія поточного діалогу, необхідна для розуміння контексту;",
            "релевантні фрагменти перевіреної бази знань ISTesport, підібрані серверною частиною;",
            "мовна локаль, необхідна для формування відповіді потрібною мовою.",
          ]],
          ["p", "ISTesport не просить передавати до AI паролі, коди двофакторної автентифікації, Discord Bot Token, API-ключі, банківські реквізити, документи, секрети або іншу інформацію, яка не потрібна для вирішення питання."],
        ],
      },
      {
        id: "rate-limit",
        title: "4. Захист від зловживань і технічні дані",
        blocks: [
          ["p", "Для обмеження частоти AI-запитів сервер може використовувати технічну адресу підключення. Перед використанням у механізмі rate limit вона перетворюється на криптографічний HMAC-ідентифікатор із серверним секретом."],
          ["p", "Такий технічний ідентифікатор використовується для запобігання зловживанням, захисту інфраструктури та контролю лімітів запитів, а не для рекламного профілювання."],
        ],
      },
      {
        id: "purpose",
        title: "5. Для чого використовується AI",
        blocks: [
          ["ul", [
            "відповіді на запитання користувачів у Центрі підтримки;",
            "пояснення загальних тем і допомога з типовими проблемами;",
            "пошук відповідного контексту в базі знань ISTesport;",
            "продовження діалогу з урахуванням обмеженої історії поточної розмови;",
            "визначення ситуацій, у яких краще звернутися до людини з команди підтримки.",
          ]],
        ],
      },
      {
        id: "accuracy",
        title: "6. Обмеження AI-відповідей",
        blocks: [
          ["p", "Штучний інтелект може помилятися, неправильно розуміти контекст або формувати неповні відповіді. Відповідь ISTe AI Support не є автоматично офіційним рішенням адміністрації ISTesport."],
          ["p", "Для фактів про склад, персонал, акаунти, ціни, розклади, внутрішні правила, рішення щодо набору або неопубліковані плани AI має використовувати лише перевірений контекст ISTesport. Якщо підтверджених даних немає, користувачу рекомендується звернутися до людини."],
        ],
      },
      {
        id: "training",
        title: "7. Використання даних постачальником AI",
        blocks: [
          ["p", "ISTesport використовує OpenAI через API. За стандартними правилами OpenAI для API дані API не використовуються для навчання моделей за замовчуванням, якщо власник API-акаунта окремо не ввімкнув передачу таких даних для покращення моделей."],
          ["p", "OpenAI може тимчасово обробляти або зберігати технічні дані відповідно до своїх чинних правил API, вимог безпеки, запобігання зловживанням і налаштувань конкретного API-акаунта."],
        ],
      },
      {
        id: "retention",
        title: "8. Зберігання в ISTesport",
        blocks: [
          ["p", "Клієнтський інтерфейс передає до серверної частини лише обмежену історію поточного діалогу. Технічні ліміти можуть змінюватися в міру розвитку сервісу."],
          ["p", "ISTesport не використовує текст AI-діалогів для рекламного профілювання. Окремі технічні записи можуть зберігатися настільки, наскільки це обґрунтовано потрібно для безпеки, діагностики, обмеження зловживань і виконання законних вимог."],
        ],
      },
      {
        id: "rights",
        title: "9. Вибір і права користувача",
        blocks: [
          ["p", "Користувач може не використовувати AI Support, припинити діалог у будь-який момент і звернутися до звичайної підтримки ISTesport."],
          ["p", "Запити щодо персональних даних, виправлення або видалення інформації можна надсилати через офіційні контакти ISTesport відповідно до основної Політики конфіденційності."],
        ],
      },
      {
        id: "changes",
        title: "10. Зміни цієї політики",
        blocks: [
          ["p", "Цей документ може оновлюватися при зміні AI-функцій, постачальників, технічної архітектури або вимог законодавства. Актуальна версія публікується на цій сторінці."],
        ],
      },
    ],
  },

  ru: {
    eyebrow: "AI privacy notice",
    title: "Использование искусственного интеллекта и конфиденциальность",
    description:
      "Дополнение к Политике конфиденциальности ISTesport о работе ISTe AI Support и обработке AI-запросов.",
    updatedLabel: "Последнее обновление:",
    updatedDate: "17 сентября 2026 года",
    contents: "Содержание",
    contentsAria: "Содержание политики использования AI",
    privacyButton: "Основная политика конфиденциальности",
    supportButton: "Открыть AI Support",
    contactButton: "Связаться с командой",
    sections: [
      {
        id: "scope",
        title: "1. Область действия",
        blocks: [
          ["p", "Этот документ является дополнением к основной Политике конфиденциальности ISTesport и объясняет, как работают функции искусственного интеллекта на сайте, включая ISTe AI Support."],
          ["p", "Использование AI Support является добровольным. Пользователь может не отправлять запрос AI и обратиться к команде ISTesport через обычные каналы поддержки."],
        ],
      },
      {
        id: "provider",
        title: "2. AI-поставщик",
        blocks: [
          ["p", "Для генерации части ответов ISTe AI Support использует OpenAI API. OpenAI выступает сторонним техническим поставщиком для обработки AI-запросов."],
          ["p", "Обработка данных OpenAI регулируется актуальными условиями и политиками OpenAI для API. Они могут изменяться независимо от ISTesport."],
        ],
      },
      {
        id: "data",
        title: "3. Какие данные могут передаваться AI",
        blocks: [
          ["p", "Когда ответ невозможно дать только из локальной базы FAQ, AI-поставщику могут передаваться:"],
          ["ul", [
            "текст текущего запроса пользователя;",
            "ограниченная недавняя история текущего диалога для понимания контекста;",
            "релевантные фрагменты проверенной базы знаний ISTesport, выбранные серверной частью;",
            "языковая локаль, необходимая для ответа на нужном языке.",
          ]],
          ["p", "ISTesport не просит передавать AI пароли, коды двухфакторной аутентификации, Discord Bot Token, API-ключи, банковские реквизиты, документы, секреты или другую информацию, которая не нужна для решения вопроса."],
        ],
      },
      {
        id: "rate-limit",
        title: "4. Защита от злоупотреблений и технические данные",
        blocks: [
          ["p", "Для ограничения частоты AI-запросов сервер может использовать технический адрес подключения. Перед использованием в механизме rate limit он преобразуется в криптографический HMAC-идентификатор с серверным секретом."],
          ["p", "Такой технический идентификатор используется для предотвращения злоупотреблений, защиты инфраструктуры и контроля лимитов запросов, а не для рекламного профилирования."],
        ],
      },
      {
        id: "purpose",
        title: "5. Для чего используется AI",
        blocks: [[
          "ul",
          [
            "ответы на вопросы пользователей в Центре поддержки;",
            "объяснение общих тем и помощь с типичными проблемами;",
            "поиск подходящего контекста в базе знаний ISTesport;",
            "продолжение диалога с учётом ограниченной истории текущего разговора;",
            "определение ситуаций, когда лучше обратиться к человеку из поддержки.",
          ],
        ]],
      },
      {
        id: "accuracy",
        title: "6. Ограничения AI-ответов",
        blocks: [
          ["p", "Искусственный интеллект может ошибаться, неверно понимать контекст или давать неполные ответы. Ответ ISTe AI Support не является автоматически официальным решением администрации ISTesport."],
          ["p", "Для фактов о составе, персонале, аккаунтах, ценах, расписаниях, внутренних правилах, решениях по набору или неопубликованных планах AI должен использовать только проверенный контекст ISTesport. Если подтверждённых данных нет, пользователю рекомендуется обратиться к человеку."],
        ],
      },
      {
        id: "training",
        title: "7. Использование данных AI-поставщиком",
        blocks: [
          ["p", "ISTesport использует OpenAI через API. По стандартным правилам OpenAI для API данные API не используются для обучения моделей по умолчанию, если владелец API-аккаунта отдельно не включил передачу таких данных для улучшения моделей."],
          ["p", "OpenAI может временно обрабатывать или хранить технические данные в соответствии со своими действующими правилами API, требованиями безопасности, предотвращения злоупотреблений и настройками конкретного API-аккаунта."],
        ],
      },
      {
        id: "retention",
        title: "8. Хранение в ISTesport",
        blocks: [
          ["p", "Клиентский интерфейс передаёт серверной части только ограниченную историю текущего диалога. Технические лимиты могут изменяться по мере развития сервиса."],
          ["p", "ISTesport не использует текст AI-диалогов для рекламного профилирования. Отдельные технические записи могут храниться столько, сколько обоснованно необходимо для безопасности, диагностики, ограничения злоупотреблений и выполнения законных требований."],
        ],
      },
      {
        id: "rights",
        title: "9. Выбор и права пользователя",
        blocks: [
          ["p", "Пользователь может не использовать AI Support, прекратить диалог в любой момент и обратиться в обычную поддержку ISTesport."],
          ["p", "Запросы о персональных данных, исправлении или удалении информации можно отправлять через официальные контакты ISTesport в соответствии с основной Политикой конфиденциальности."],
        ],
      },
      {
        id: "changes",
        title: "10. Изменения этой политики",
        blocks: [
          ["p", "Документ может обновляться при изменении AI-функций, поставщиков, технической архитектуры или требований законодательства. Актуальная версия публикуется на этой странице."],
        ],
      },
    ],
  },

  en: {
    eyebrow: "AI privacy notice",
    title: "Artificial intelligence use and privacy",
    description:
      "A supplement to the ISTesport Privacy Policy covering ISTe AI Support and the processing of AI requests.",
    updatedLabel: "Last updated:",
    updatedDate: "September 17, 2026",
    contents: "Contents",
    contentsAria: "AI privacy notice contents",
    privacyButton: "Main Privacy Policy",
    supportButton: "Open AI Support",
    contactButton: "Contact the team",
    sections: [
      {
        id: "scope",
        title: "1. Scope",
        blocks: [
          ["p", "This document supplements the main ISTesport Privacy Policy and explains how artificial intelligence features on the website operate, including ISTe AI Support."],
          ["p", "Use of AI Support is voluntary. A user may choose not to send a request to AI and may contact the ISTesport team through regular support channels instead."],
        ],
      },
      {
        id: "provider",
        title: "2. AI provider",
        blocks: [
          ["p", "ISTe AI Support uses the OpenAI API to generate some responses. OpenAI acts as a third-party technical provider for processing AI requests."],
          ["p", "OpenAI processing is governed by the then-current OpenAI API terms and policies, which may change independently of ISTesport."],
        ],
      },
      {
        id: "data",
        title: "3. Data that may be sent to AI",
        blocks: [
          ["p", "When a response cannot be provided solely from the local FAQ, the following may be sent to the AI provider:"],
          ["ul", [
            "the user's current message;",
            "a limited amount of recent conversation history needed to understand context;",
            "relevant excerpts from the verified ISTesport knowledge base selected by the server;",
            "the language locale needed to answer in the appropriate language.",
          ]],
          ["p", "ISTesport does not ask users to send passwords, two-factor authentication codes, Discord Bot Tokens, API keys, payment card details, identity documents, secrets, or other information that is not necessary to resolve a support question."],
        ],
      },
      {
        id: "rate-limit",
        title: "4. Abuse prevention and technical data",
        blocks: [
          ["p", "To enforce AI request limits, the server may use a technical network address. Before it is used for rate limiting, it is transformed into a cryptographic HMAC identifier using a server-side secret."],
          ["p", "This technical identifier is used to prevent abuse, protect infrastructure and enforce request limits, not for advertising profiling."],
        ],
      },
      {
        id: "purpose",
        title: "5. How AI is used",
        blocks: [[
          "ul",
          [
            "answering user questions in the Support Center;",
            "explaining general topics and assisting with common problems;",
            "finding relevant context in the ISTesport knowledge base;",
            "continuing a conversation using limited recent context;",
            "identifying cases where human support is more appropriate.",
          ],
        ]],
      },
      {
        id: "accuracy",
        title: "6. Limits of AI responses",
        blocks: [
          ["p", "Artificial intelligence can make mistakes, misunderstand context, or produce incomplete answers. An ISTe AI Support response is not automatically an official decision of the ISTesport administration."],
          ["p", "For facts about the roster, staff, accounts, prices, schedules, internal rules, recruitment decisions or unpublished plans, AI is instructed to rely only on verified ISTesport context. If verified information is unavailable, the user should contact a human member of the team."],
        ],
      },
      {
        id: "training",
        title: "7. AI provider use of data",
        blocks: [
          ["p", "ISTesport uses OpenAI through the API. Under OpenAI's standard API data rules, API data is not used to train models by default unless the API account owner separately opts in to share data for model improvement."],
          ["p", "OpenAI may temporarily process or retain technical data under its current API rules, security and abuse-prevention requirements, and the settings applicable to the specific API account."],
        ],
      },
      {
        id: "retention",
        title: "8. Retention by ISTesport",
        blocks: [
          ["p", "The client sends only a limited amount of recent conversation history to the server. Technical limits may change as the service evolves."],
          ["p", "ISTesport does not use AI conversation text for advertising profiling. Certain technical records may be retained for as long as reasonably necessary for security, diagnostics, abuse prevention and lawful requirements."],
        ],
      },
      {
        id: "rights",
        title: "9. User choice and rights",
        blocks: [
          ["p", "Users may choose not to use AI Support, may stop a conversation at any time, and may contact regular ISTesport support instead."],
          ["p", "Requests relating to personal data, correction or deletion can be sent through official ISTesport contact channels under the main Privacy Policy."],
        ],
      },
      {
        id: "changes",
        title: "10. Changes to this notice",
        blocks: [
          ["p", "This notice may be updated when AI features, providers, technical architecture or legal requirements change. The current version is published on this page."],
        ],
      },
    ],
  },
};

function renderBlock(block, index) {
  const [type, value] = block;

  if (type === "ul") {
    return (
      <ul key={`ul-${index}`}>
        {value.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  return <p key={`p-${index}`}>{value}</p>;
}

export default function AIPrivacy() {
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
          {copy.updatedLabel}{" "}
          <time dateTime={UPDATED_AT}>{copy.updatedDate}</time>
        </span>
      </header>

      <div className="legal-layout">
        <aside className="legal-sidebar">
          <p>{copy.contents}</p>
          <nav aria-label={copy.contentsAria}>
            {copy.sections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="legal-document">
          {copy.sections.map((section) => (
            <section
              id={section.id}
              className="legal-section"
              key={section.id}
            >
              <h2>{section.title}</h2>
              {section.blocks.map((block, index) =>
                renderBlock(block, index),
              )}
            </section>
          ))}

          <div className="legal-actions">
            <Link
              className="legal-button legal-button-primary"
              to="/privacy"
            >
              {copy.privacyButton}
            </Link>
            <Link className="legal-button" to="/support">
              {copy.supportButton}
            </Link>
            <Link className="legal-button" to="/contacts">
              {copy.contactButton}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}
