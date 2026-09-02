import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Legal.css";

const TEXT = {
  uk: {
    updatedLabel: "Останнє оновлення:",
    updatedDate: "8 серпня 2026 року",
    contents: "Зміст",
    contentsAria: (title) => `Зміст документа «${title}»`,
    contactLink: "контактів ISTe",
    contactButton: "Зв’язатися з командою",
    homeButton: "Повернутися на головну",
    privacy: {
      eyebrow: "Privacy policy",
      title: "Політика конфіденційності",
      description:
        "Зрозумілі правила обробки даних користувачів офіційного сайту ISTe.",
      sections: [
        {
          id: "general",
          title: "1. Загальні положення",
          blocks: [
            ["p", "Ця політика описує, які дані можуть оброблятися під час використання сайту ISTe, для чого вони потрібні та які можливості має користувач."],
            ["p", "Продовжуючи користуватися сайтом, користувач підтверджує, що ознайомився з цією політикою."],
          ],
        },
        {
          id: "data",
          title: "2. Які дані обробляються",
          blocks: [
            ["p", "Під час використання сайту можуть оброблятися такі відомості:"],
            ["ul", [
              "адреса електронної пошти, необхідна для реєстрації та входу;",
              "ім’я користувача, відображуване ім’я, аватар і опис профілю;",
              "публічний ID акаунта, що використовується для точного пошуку профілю;",
              "роль акаунта, статус доступу та відомості про блокування;",
              "технічні дані сесії, необхідні для авторизації, безпеки та стабільної роботи сайту;",
              "ім’я, email, обраний товар, розмір і кількість, якщо користувач добровільно надсилає заявку на передзамовлення ISTe Wear;",
              "інформація, яку користувач добровільно передає під час звернення до команди.",
            ]],
          ],
        },
        {
          id: "purpose",
          title: "3. Для чого використовуються дані",
          blocks: [
            ["ul", [
              "створення акаунта та підтвердження особи користувача;",
              "робота особистого кабінету та збереження налаштувань профілю;",
              "пошук публічного профілю за точним ID акаунта;",
              "розмежування прав користувачів, редакторів та адміністрації;",
              "захист сайту від зловживань і несанкціонованого доступу;",
              "облік попереднього попиту на ISTe Wear і зв’язок із користувачем за надісланою ним заявкою;",
              "обробка звернень і покращення роботи сайту.",
            ]],
          ],
        },
        {
          id: "storage",
          title: "4. Зберігання та стороння інфраструктура",
          blocks: [
            ["p", "Для авторизації та зберігання даних сайт використовує інфраструктуру Supabase. Серверні операції магазину виконуються через захищений API сайту. Секретні серверні ключі не передаються до браузера."],
            ["p", "Для підтримання входу в акаунт використовуються технічні дані сесії. Окремі функції сайту також можуть використовувати локальне сховище браузера для користувацьких налаштувань."],
            ["p", "Сайт містить посилання на FACEIT, Twitch, YouTube, Telegram, Discord, Steam, Instagram та інші зовнішні сервіси. Після переходу на такі сайти діють їхні власні правила обробки даних."],
          ],
        },
        {
          id: "shop",
          title: "5. Заявки ISTe Wear",
          blocks: [
            ["p", "Форма ISTe Wear на поточному етапі використовується для попередньої заявки та оцінки попиту. Надсилання такої форми саме по собі не є оплатою і не означає автоматичне укладення договору купівлі-продажу."],
            ["p", "Контактні дані із заявки використовуються для зв’язку щодо обраного товару та організації подальшого запуску колекції. Сайт не запитує дані банківської картки через форму передзамовлення."],
          ],
        },
        {
          id: "sharing",
          title: "6. Передача даних",
          blocks: [
            ["p", "Дані не продаються рекламодавцям. Вони можуть передаватися технічним постачальникам лише в обсязі, необхідному для роботи сайту, або у випадках, передбачених застосовним законодавством."],
          ],
        },
        {
          id: "security",
          title: "7. Безпека",
          blocks: [
            ["p", "ISTe застосовує розмежування прав, серверну перевірку запитів, обмеження частоти операцій, захист від міжсайтових запитів та інші технічні заходи для обмеження доступу до даних."],
            ["p", "Водночас жоден спосіб передавання або зберігання інформації в інтернеті не може гарантувати абсолютну безпеку."],
          ],
        },
        {
          id: "rights",
          title: "8. Права користувача",
          blocks: [
            ["p", "Користувач може запросити уточнення, виправлення або видалення відомостей свого профілю та даних, добровільно переданих через форми сайту, а також повідомити про проблему з доступом до акаунта."],
            ["contact", "Для звернення використовуйте сторінку"],
          ],
        },
        {
          id: "updates",
          title: "9. Зміни політики",
          blocks: [
            ["p", "Політика може оновлюватися у разі зміни функцій сайту або вимог законодавства. Актуальна версія завжди розміщується на цій сторінці."],
          ],
        },
      ],
    },
    terms: {
      eyebrow: "Terms of use",
      title: "Умови використання",
      description:
        "Основні правила доступу до сайту, акаунтів, ISTe Wear і матеріалів кіберспортивної команди ISTe.",
      sections: [
        { id: "acceptance", title: "1. Прийняття умов", blocks: [["p", "Використовуючи сайт ISTe, користувач погоджується дотримуватися цих умов. У разі незгоди з ними слід припинити використання сайту."]] },
        { id: "purpose", title: "2. Призначення сайту", blocks: [["p", "Сайт призначений для представлення кіберспортивної команди ISTe, публікації складу, результатів матчів, новин, історії клубу, партнерських матеріалів, офіційних посилань і розвитку напряму ISTe Wear."]] },
        { id: "accounts", title: "3. Акаунти користувачів", blocks: [["ul", [
          "користувач зобов’язаний вказувати коректні дані та зберігати пароль у таємниці;",
          "заборонено передавати акаунт для обходу обмежень або видавати себе за іншу людину;",
          "адміністрація може обмежити доступ у разі порушення правил, зловживань або загрози безпеці сайту;",
          "користувач несе відповідальність за дії, вчинені через його акаунт."
        ]]] },
        { id: "wear", title: "4. ISTe Wear і попередні заявки", blocks: [
          ["p", "До підключення повноцінної системи замовлень розділ ISTe Wear може приймати лише попередні заявки. Така заявка показує інтерес користувача до товару і не потребує оплати на сайті."],
          ["p", "Ціна, фінальні характеристики, доступність розмірів, спосіб доставки та інші комерційні умови можуть бути уточнені перед запуском виробництва і продажів."]
        ] },
        { id: "content", title: "5. Матеріали та інтелектуальні права", blocks: [
          ["p", "Дизайн сайту, фірмові матеріали ISTe, колекції ISTe Wear, тексти й оригінальна графіка захищені застосовними нормами щодо інтелектуальної власності."],
          ["p", "Назви, зображення та логотипи FACEIT, Twitch, YouTube, Steam, Instagram та інших сторонніх сервісів належать відповідним власникам."]
        ] },
        { id: "rules", title: "6. Заборонені дії", blocks: [["ul", [
          "втручання в роботу сайту та спроби обійти обмеження доступу;",
          "автоматичний збір даних, що створює надмірне навантаження;",
          "масове надсилання неправдивих або автоматизованих заявок магазину;",
          "поширення шкідливого коду, спаму або незаконних матеріалів;",
          "використання сайту для шахрайства та введення людей в оману;",
          "копіювання фірмових матеріалів ISTe без дозволу правовласника."
        ]]] },
        { id: "external", title: "7. Сторонні сервіси", blocks: [["p", "Посилання на сторонні майданчики надаються для зручності. ISTe не керує їхнім вмістом, доступністю, правилами та політиками конфіденційності."]] },
        { id: "availability", title: "8. Доступність і відповідальність", blocks: [["p", "Команда прагне підтримувати сайт у робочому стані, але не гарантує безперервну доступність, відсутність технічних помилок або збереження всіх зовнішніх матеріалів. Інформація про матчі та статистику може залежати від даних сторонніх сервісів."]] },
        { id: "changes", title: "9. Зміна умов", blocks: [["p", "Умови можуть оновлюватися разом із розвитком сайту. Нова редакція набирає чинності після публікації на цій сторінці."]] },
        { id: "contact", title: "10. Зворотний зв’язок", blocks: [["contact", "Питання щодо використання сайту можна надіслати через офіційні канали на сторінці"]] },
      ],
    },
  },

  ru: {
    updatedLabel: "Последнее обновление:",
    updatedDate: "8 августа 2026 года",
    contents: "Содержание",
    contentsAria: (title) => `Содержание документа «${title}»`,
    contactLink: "контактов ISTe",
    contactButton: "Связаться с командой",
    homeButton: "Вернуться на главную",
    privacy: {
      eyebrow: "Privacy policy",
      title: "Политика конфиденциальности",
      description: "Понятные правила обработки данных пользователей официального сайта ISTe.",
      sections: [
        { id: "general", title: "1. Общие положения", blocks: [["p", "Настоящая политика описывает, какие данные могут обрабатываться при использовании сайта ISTe, для чего они нужны и какие возможности есть у пользователя."], ["p", "Продолжая использовать сайт, пользователь подтверждает, что ознакомился с этой политикой."]] },
        { id: "data", title: "2. Какие данные обрабатываются", blocks: [["p", "При использовании сайта могут обрабатываться следующие сведения:"], ["ul", [
          "адрес электронной почты, необходимый для регистрации и входа;",
          "имя пользователя, отображаемое имя, аватар и описание профиля;",
          "публичный ID аккаунта, используемый для точного поиска профиля;",
          "роль аккаунта, статус доступа и сведения о блокировке;",
          "технические данные сессии, необходимые для авторизации, безопасности и стабильной работы сайта;",
          "имя, email, выбранный товар, размер и количество, если пользователь добровольно отправляет заявку на предзаказ ISTe Wear;",
          "информация, которую пользователь добровольно передаёт при обращении к команде."
        ]]] },
        { id: "purpose", title: "3. Для чего используются данные", blocks: [["ul", [
          "создание аккаунта и подтверждение личности пользователя;",
          "работа личного кабинета и сохранение настроек профиля;",
          "поиск публичного профиля по точному ID аккаунта;",
          "разграничение прав пользователей, редакторов и администрации;",
          "защита сайта от злоупотреблений и несанкционированного доступа;",
          "учёт предварительного спроса на ISTe Wear и связь с пользователем по отправленной им заявке;",
          "обработка обращений и улучшение работы сайта."
        ]]] },
        { id: "storage", title: "4. Хранение и сторонняя инфраструктура", blocks: [
          ["p", "Для авторизации и хранения данных сайт использует инфраструктуру Supabase. Серверные операции магазина выполняются через защищённый API сайта. Секретные серверные ключи не передаются в браузер."],
          ["p", "Для поддержания входа в аккаунт используются технические данные сессии. Отдельные функции сайта также могут использовать локальное хранилище браузера для пользовательских настроек."],
          ["p", "Сайт содержит ссылки на FACEIT, Twitch, YouTube, Telegram, Discord, Steam, Instagram и другие внешние сервисы. После перехода на такие сайты действуют их собственные правила обработки данных."]
        ] },
        { id: "shop", title: "5. Заявки ISTe Wear", blocks: [
          ["p", "Форма ISTe Wear на текущем этапе используется для предварительной заявки и оценки спроса. Отправка такой формы сама по себе не является оплатой и не означает автоматическое заключение договора купли-продажи."],
          ["p", "Контактные данные из заявки используются для связи по выбранному товару и организации дальнейшего запуска коллекции. Сайт не запрашивает данные банковской карты через форму предзаказа."]
        ] },
        { id: "sharing", title: "6. Передача данных", blocks: [["p", "Данные не продаются рекламодателям. Они могут передаваться техническим поставщикам только в объёме, необходимом для работы сайта, либо в случаях, предусмотренных применимым законодательством."]] },
        { id: "security", title: "7. Безопасность", blocks: [["p", "ISTe применяет разграничение прав, серверную проверку запросов, ограничения частоты операций, защиту от межсайтовых запросов и другие технические меры для ограничения доступа к данным."], ["p", "При этом ни один способ передачи или хранения информации в интернете не может гарантировать абсолютную безопасность."]] },
        { id: "rights", title: "8. Права пользователя", blocks: [["p", "Пользователь может запросить уточнение, исправление или удаление сведений своего профиля и данных, добровольно переданных через формы сайта, а также сообщить о проблеме с доступом к аккаунту."], ["contact", "Для обращения используйте страницу"]] },
        { id: "updates", title: "9. Изменения политики", blocks: [["p", "Политика может обновляться при изменении функций сайта или требований законодательства. Актуальная версия всегда размещается на этой странице."]] },
      ],
    },
    terms: {
      eyebrow: "Terms of use",
      title: "Условия использования",
      description: "Основные правила доступа к сайту, аккаунтам, ISTe Wear и материалам киберспортивной команды ISTe.",
      sections: [
        { id: "acceptance", title: "1. Принятие условий", blocks: [["p", "Используя сайт ISTe, пользователь соглашается соблюдать настоящие условия. При несогласии с ними следует прекратить использование сайта."]] },
        { id: "purpose", title: "2. Назначение сайта", blocks: [["p", "Сайт предназначен для представления киберспортивной команды ISTe, публикации состава, результатов матчей, новостей, истории клуба, партнёрских материалов, официальных ссылок и развития направления ISTe Wear."]] },
        { id: "accounts", title: "3. Аккаунты пользователей", blocks: [["ul", [
          "пользователь обязан указывать корректные данные и сохранять пароль в тайне;",
          "запрещено передавать аккаунт для обхода ограничений или выдавать себя за другого человека;",
          "администрация может ограничить доступ при нарушении правил, злоупотреблениях или угрозе безопасности сайта;",
          "пользователь несёт ответственность за действия, совершённые через его аккаунт."
        ]]] },
        { id: "wear", title: "4. ISTe Wear и предварительные заявки", blocks: [
          ["p", "До подключения полноценной системы заказов раздел ISTe Wear может принимать только предварительные заявки. Такая заявка показывает интерес пользователя к товару и не требует оплаты на сайте."],
          ["p", "Цена, финальные характеристики, доступность размеров, способ доставки и другие коммерческие условия могут быть уточнены перед запуском производства и продаж."]
        ] },
        { id: "content", title: "5. Материалы и интеллектуальные права", blocks: [
          ["p", "Дизайн сайта, фирменные материалы ISTe, коллекции ISTe Wear, тексты и оригинальная графика защищены применимыми нормами об интеллектуальной собственности."],
          ["p", "Названия, изображения и логотипы FACEIT, Twitch, YouTube, Steam, Instagram и других сторонних сервисов принадлежат соответствующим владельцам."]
        ] },
        { id: "rules", title: "6. Запрещённые действия", blocks: [["ul", [
          "вмешательство в работу сайта и попытки обойти ограничения доступа;",
          "автоматический сбор данных, создающий чрезмерную нагрузку;",
          "массовая отправка ложных или автоматизированных заявок магазина;",
          "распространение вредоносного кода, спама или незаконных материалов;",
          "использование сайта для мошенничества и введения людей в заблуждение;",
          "копирование фирменных материалов ISTe без разрешения правообладателя."
        ]]] },
        { id: "external", title: "7. Сторонние сервисы", blocks: [["p", "Ссылки на сторонние площадки предоставляются для удобства. ISTe не управляет их содержимым, доступностью, правилами и политиками конфиденциальности."]] },
        { id: "availability", title: "8. Доступность и ответственность", blocks: [["p", "Команда стремится поддерживать сайт в рабочем состоянии, но не гарантирует непрерывную доступность, отсутствие технических ошибок или сохранение всех внешних материалов. Информация о матчах и статистике может зависеть от данных сторонних сервисов."]] },
        { id: "changes", title: "9. Изменение условий", blocks: [["p", "Условия могут обновляться вместе с развитием сайта. Новая редакция вступает в силу после публикации на этой странице."]] },
        { id: "contact", title: "10. Обратная связь", blocks: [["contact", "Вопросы по использованию сайта можно отправить через официальные каналы на странице"]] },
      ],
    },
  },

  en: {
    updatedLabel: "Last updated:",
    updatedDate: "August 8, 2026",
    contents: "Contents",
    contentsAria: (title) => `Contents of “${title}”`,
    contactLink: "ISTe contacts",
    contactButton: "Contact the team",
    homeButton: "Return home",
    privacy: {
      eyebrow: "Privacy policy",
      title: "Privacy policy",
      description: "Clear rules for processing user data on the official ISTe website.",
      sections: [
        { id: "general", title: "1. General provisions", blocks: [["p", "This policy describes what data may be processed when using the ISTe website, why it is needed and what options are available to the user."], ["p", "By continuing to use the website, the user confirms that they have read this policy."]] },
        { id: "data", title: "2. Data we process", blocks: [["p", "The following information may be processed when using the website:"], ["ul", [
          "email address required for registration and sign-in;",
          "username, display name, avatar and profile description;",
          "public account ID used for exact profile search;",
          "account role, access status and blocking information;",
          "technical session data required for authentication, security and stable website operation;",
          "name, email, selected product, size and quantity when a user voluntarily submits an ISTe Wear preorder request;",
          "information voluntarily provided by the user when contacting the team."
        ]]] },
        { id: "purpose", title: "3. How data is used", blocks: [["ul", [
          "creating an account and verifying the user’s identity;",
          "operating the account area and saving profile settings;",
          "searching for a public profile by exact account ID;",
          "separating permissions for users, editors and administrators;",
          "protecting the website from abuse and unauthorized access;",
          "measuring preliminary demand for ISTe Wear and contacting the user about their request;",
          "processing inquiries and improving the website."
        ]]] },
        { id: "storage", title: "4. Storage and third-party infrastructure", blocks: [
          ["p", "The website uses Supabase infrastructure for authentication and data storage. Store server operations are performed through the website’s protected API. Secret server keys are not sent to the browser."],
          ["p", "Technical session data is used to maintain account sign-in. Some website features may also use browser local storage for user preferences."],
          ["p", "The website contains links to FACEIT, Twitch, YouTube, Telegram, Discord, Steam, Instagram and other external services. Their own data-processing rules apply after following those links."]
        ] },
        { id: "shop", title: "5. ISTe Wear requests", blocks: [
          ["p", "At the current stage, the ISTe Wear form is used for preliminary requests and demand assessment. Submitting the form is not a payment and does not automatically create a purchase agreement."],
          ["p", "Contact details from the request are used to communicate about the selected product and organize the future collection launch. The website does not request bank card details through the preorder form."]
        ] },
        { id: "sharing", title: "6. Data sharing", blocks: [["p", "Data is not sold to advertisers. It may be shared with technical providers only to the extent necessary to operate the website or when required by applicable law."]] },
        { id: "security", title: "7. Security", blocks: [["p", "ISTe uses permission separation, server-side request validation, rate limits, protection against cross-site requests and other technical measures to restrict access to data."], ["p", "However, no method of transmitting or storing information on the internet can guarantee absolute security."]] },
        { id: "rights", title: "8. User rights", blocks: [["p", "A user may request clarification, correction or deletion of profile information and data voluntarily provided through website forms, and may report account-access problems."], ["contact", "To contact us, use the"]] },
        { id: "updates", title: "9. Policy changes", blocks: [["p", "The policy may be updated when website features or legal requirements change. The current version is always published on this page."]] },
      ],
    },
    terms: {
      eyebrow: "Terms of use",
      title: "Terms of use",
      description: "The main rules for accessing the website, accounts, ISTe Wear and materials of the ISTe esports team.",
      sections: [
        { id: "acceptance", title: "1. Acceptance of terms", blocks: [["p", "By using the ISTe website, the user agrees to follow these terms. If the user does not agree, they should stop using the website."]] },
        { id: "purpose", title: "2. Purpose of the website", blocks: [["p", "The website presents the ISTe esports team and publishes its roster, match results, news, club history, partner materials, official links and ISTe Wear development." ]] },
        { id: "accounts", title: "3. User accounts", blocks: [["ul", [
          "users must provide accurate information and keep their password confidential;",
          "accounts may not be transferred to bypass restrictions or used to impersonate another person;",
          "the administration may restrict access for rule violations, abuse or security threats;",
          "users are responsible for actions performed through their account."
        ]]] },
        { id: "wear", title: "4. ISTe Wear and preliminary requests", blocks: [
          ["p", "Until a full order system is connected, ISTe Wear may accept preliminary requests only. Such a request indicates interest in a product and does not require payment on the website."],
          ["p", "Price, final specifications, size availability, delivery method and other commercial terms may be clarified before production and sales begin."]
        ] },
        { id: "content", title: "5. Materials and intellectual property", blocks: [
          ["p", "The website design, ISTe brand materials, ISTe Wear collections, texts and original graphics are protected by applicable intellectual-property rules."],
          ["p", "Names, images and logos of FACEIT, Twitch, YouTube, Steam, Instagram and other third-party services belong to their respective owners."]
        ] },
        { id: "rules", title: "6. Prohibited actions", blocks: [["ul", [
          "interfering with website operation or attempting to bypass access restrictions;",
          "automated data collection that creates excessive load;",
          "mass submission of false or automated store requests;",
          "distribution of malicious code, spam or illegal materials;",
          "using the website for fraud or misleading other people;",
          "copying ISTe brand materials without the rights holder’s permission."
        ]]] },
        { id: "external", title: "7. Third-party services", blocks: [["p", "Links to third-party platforms are provided for convenience. ISTe does not control their content, availability, rules or privacy policies."]] },
        { id: "availability", title: "8. Availability and liability", blocks: [["p", "The team aims to keep the website operational but does not guarantee uninterrupted availability, absence of technical errors or preservation of all external materials. Match and statistics information may depend on third-party service data."]] },
        { id: "changes", title: "9. Changes to the terms", blocks: [["p", "The terms may be updated as the website evolves. A new version takes effect after being published on this page."]] },
        { id: "contact", title: "10. Feedback", blocks: [["contact", "Questions about using the website can be sent through the official channels on the"]] },
      ],
    },
  },
};

function renderBlock(block, index, copy) {
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

  if (type === "contact") {
    return (
      <p key={`contact-${index}`}>
        {value}{" "}
        <Link to="/contacts">{copy.contactLink}</Link>.
      </p>
    );
  }

  return <p key={`p-${index}`}>{value}</p>;
}

function LegalPage({ documentKey }) {
  const { language } = useLanguage();
  const copy = TEXT[language] || TEXT.uk;
  const document = copy[documentKey];

  return (
    <section className="legal-page">
      <div className="legal-glow" aria-hidden="true" />

      <header className="legal-header">
        <p className="legal-eyebrow">{document.eyebrow}</p>
        <h1>{document.title}</h1>
        <p>{document.description}</p>
        <span className="legal-updated">
          {copy.updatedLabel}{" "}
          <time dateTime="2026-08-08">{copy.updatedDate}</time>
        </span>
      </header>

      <div className="legal-layout">
        <aside className="legal-sidebar">
          <p>{copy.contents}</p>
          <nav aria-label={copy.contentsAria(document.title)}>
            {document.sections.map((section) => (
              <a href={`#${section.id}`} key={section.id}>
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <article className="legal-document">
          {document.sections.map((section) => (
            <section id={section.id} className="legal-section" key={section.id}>
              <h2>{section.title}</h2>
              {section.blocks.map((block, index) =>
                renderBlock(block, index, copy),
              )}
            </section>
          ))}

          <div className="legal-actions">
            <Link className="legal-button legal-button-primary" to="/contacts">
              {copy.contactButton}
            </Link>
            <Link className="legal-button" to="/">
              {copy.homeButton}
            </Link>
          </div>
        </article>
      </div>
    </section>
  );
}

export function Privacy() {
  return <LegalPage documentKey="privacy" />;
}

export function Terms() {
  return <LegalPage documentKey="terms" />;
}
