import { Link } from "react-router-dom";

import { useLanguage } from "../i18n/LanguageContext.jsx";

import "./Legal.css";

const LEGAL_UPDATED_AT = "2026-09-04";

const TEXT = {
  uk: {
    updatedLabel: "Останнє оновлення:",
    updatedDate: "4 вересня 2026 року",
    contents: "Зміст",
    contentsAria: (title) => `Зміст документа «${title}»`,
    contactLink: "контактів ISTe",
    contactButton: "Зв’язатися з командою",
    homeButton: "Повернутися на головну",
    privacy: {
      eyebrow: "Privacy policy",
      title: "Політика конфіденційності",
      description:
        "Правила обробки даних під час використання офіційного сайту ISTe та ISTe Bot у Discord.",
      sections: [
        {
          id: "general",
          title: "1. Загальні положення",
          blocks: [
            ["p", "Ця політика описує, які дані можуть оброблятися під час використання сайту ISTe та офіційного Discord застосунку ISTe Bot, для чого вони потрібні та які можливості має користувач."],
            ["p", "Використовуючи сайт або взаємодіючи з ISTe Bot, користувач підтверджує, що ознайомився з цією політикою."],
          ],
        },
        {
          id: "data",
          title: "2. Які дані можуть оброблятися",
          blocks: [
            ["p", "Під час використання сервісів ISTe можуть оброблятися:"],
            ["ul", [
              "адреса електронної пошти, необхідна для реєстрації та входу на сайт;",
              "ім’я користувача, відображуване ім’я, аватар, опис профілю та публічний ID акаунта;",
              "роль акаунта, статус доступу та відомості про блокування;",
              "технічні дані сесії, необхідні для авторизації, безпеки та стабільної роботи сайту;",
              "ім’я, email, обраний товар, розмір і кількість, якщо користувач добровільно надсилає заявку ISTe Wear;",
              "Discord User ID, Discord Guild ID, Channel ID, назва сервера, локаль сервера та технічні метадані взаємодії з ISTe Bot;",
              "параметри slash команд, які користувач добровільно передає ISTe Bot;",
              "для модераційних команд можуть оброблятися ID модератора, ID цільового учасника, тривалість тайм ауту, причина модераційної дії, кількість видалених повідомлень та ID каналу;",
              "під час виконання команди очищення ISTe Bot може тимчасово отримувати через Discord API ID та часові мітки останніх повідомлень, необхідні для їх видалення; вміст таких повідомлень не зберігається ISTe навмисно;",
              "інформація, яку користувач добровільно передає під час звернення до команди ISTe.",
            ]],
          ],
        },
        {
          id: "purpose",
          title: "3. Для чого використовуються дані",
          blocks: [
            ["ul", [
              "створення акаунта, вхід і робота особистого кабінету;",
              "пошук публічного профілю за точним ID;",
              "розмежування прав користувачів, редакторів, адміністраторів і власника;",
              "захист сайту від зловживань та несанкціонованого доступу;",
              "робота slash команд ISTe Bot, відображення інформації про користувача, сервер, склад, матчі та новини;",
              "виконання опитувань і дозволених модераційних дій у Discord;",
              "ведення технічного журналу важливих дій ISTe Bot для безпеки, діагностики та розслідування зловживань;",
              "облік попереднього попиту на ISTe Wear та зв’язок з користувачем за його заявкою;",
              "обробка звернень і покращення сервісів ISTe.",
            ]],
          ],
        },
        {
          id: "discord",
          title: "4. ISTe Bot і Discord",
          blocks: [
            ["p", "ISTe Bot працює як офіційний Discord застосунок ISTe. Команди передаються Discord до серверної інфраструктури ISTe через Interactions Endpoint. Вхідні interactions перевіряються криптографічним підписом Discord."],
            ["p", "ISTe Bot використовує лише ті дозволи Discord, які потрібні для активованих функцій. Команди модерації додатково перевіряють права користувача та права самого бота на конкретному сервері або каналі."],
            ["p", "ISTe не просить користувачів передавати Bot Token, Discord пароль або інші секретні облікові дані. Серверні секрети зберігаються окремо від клієнтського коду."],
          ],
        },
        {
          id: "storage",
          title: "5. Зберігання та стороння інфраструктура",
          blocks: [
            ["p", "Для авторизації, бази даних, журналів і серверної логіки ISTe використовує Supabase. Сайт розгортається через Vercel. Взаємодія ISTe Bot з Discord виконується через офіційний Discord API."],
            ["p", "Технічні записи про встановлені Discord сервери та важливі дії бота можуть зберігатися стільки, скільки це обґрунтовано потрібно для роботи сервісу, безпеки, діагностики та виконання законних вимог."],
            ["p", "Сайт також містить посилання на FACEIT, Twitch, YouTube, Telegram, Discord, Steam, Instagram та інші зовнішні сервіси. Після переходу на такі сервіси діють їхні власні правила обробки даних."],
          ],
        },
        {
          id: "shop",
          title: "6. Заявки ISTe Wear",
          blocks: [
            ["p", "Форма ISTe Wear може використовуватися для попередньої заявки та оцінки попиту. Надсилання форми саме по собі не є оплатою і не означає автоматичне укладення договору купівлі продажу."],
            ["p", "Контактні дані із заявки використовуються для зв’язку щодо обраного товару. Сайт не запитує дані банківської картки через форму попередньої заявки."],
          ],
        },
        {
          id: "sharing",
          title: "7. Передача даних",
          blocks: [
            ["p", "ISTe не продає персональні дані рекламодавцям. Дані можуть передаватися технічним постачальникам лише в обсязі, необхідному для роботи сервісу, або у випадках, передбачених застосовним законодавством."],
          ],
        },
        {
          id: "security",
          title: "8. Безпека",
          blocks: [
            ["p", "ISTe застосовує серверну перевірку прав, двофакторну автентифікацію для привілейованих акаунтів, захищені cookies, обмеження частоти операцій, перевірку походження запитів, політики доступу до бази даних і перевірку підписів Discord interactions."],
            ["p", "Водночас жоден спосіб передавання або зберігання інформації в інтернеті не може гарантувати абсолютну безпеку."],
          ],
        },
        {
          id: "rights",
          title: "9. Права користувача та видалення даних",
          blocks: [
            ["p", "Користувач може звернутися до ISTe з проханням уточнити, виправити або видалити дані, які стосуються його акаунта або були добровільно передані через сервіси ISTe, якщо зберігання цих даних не вимагається з міркувань безпеки чи законом."],
            ["p", "Адміністратор Discord сервера також може звернутися щодо видалення технічних даних про сервер після видалення ISTe Bot з цього сервера."],
            ["contact", "Для такого звернення використовуйте сторінку"],
          ],
        },
        {
          id: "updates",
          title: "10. Зміни політики",
          blocks: [
            ["p", "Політика може оновлюватися при зміні функцій сайту, ISTe Bot, технічної інфраструктури або вимог законодавства. Актуальна версія завжди розміщується на цій сторінці."],
          ],
        },
      ],
    },
    terms: {
      eyebrow: "Terms of use",
      title: "Умови використання",
      description:
        "Основні правила використання сайту ISTe, акаунтів, ISTe Wear та офіційного Discord застосунку ISTe Bot.",
      sections: [
        { id: "acceptance", title: "1. Прийняття умов", blocks: [["p", "Використовуючи сайт ISTe або ISTe Bot, користувач погоджується дотримуватися цих умов. У разі незгоди слід припинити використання відповідного сервісу."]] },
        { id: "services", title: "2. Сервіси ISTe", blocks: [["p", "ISTe надає офіційний сайт кіберспортивної команди, інформацію про склад, матчі, новини, історію клубу, партнерів, ISTe Wear та Discord застосунок ISTe Bot з інформаційними, спільнотними й модераційними командами."]] },
        { id: "accounts", title: "3. Акаунти користувачів", blocks: [["ul", [
          "користувач повинен вказувати коректні дані та зберігати пароль і другий фактор автентифікації в таємниці;",
          "заборонено передавати акаунт для обходу обмежень або видавати себе за іншу людину;",
          "адміністрація може обмежити доступ у разі порушення правил, зловживань або загрози безпеці;",
          "користувач несе відповідальність за дії, виконані через його акаунт.",
        ]]] },
        { id: "bot", title: "4. Правила використання ISTe Bot", blocks: [["ul", [
          "ISTe Bot можна встановлювати лише на Discord сервери, де користувач має право керувати сервером або встановлювати застосунки;",
          "користувач не повинен використовувати бота для спаму, шахрайства, переслідування, обходу Discord правил або іншої незаконної діяльності;",
          "модераційні команди можуть виконувати лише користувачі, яким Discord надав відповідні права;",
          "адміністратор сервера відповідає за налаштування ролі ISTe Bot і наданих їй дозволів;",
          "ISTe може тимчасово обмежити роботу бота на сервері у випадку зловживань, технічної загрози або порушення цих умов.",
        ]]] },
        { id: "moderation", title: "5. Модераційні команди", blocks: [["p", "Команди на кшталт очищення повідомлень або тимчасового обмеження учасника є інструментами адміністратора Discord сервера. ISTe не визначає правила конкретного сервера та не несе відповідальності за рішення його модераторів, якщо інше не передбачено застосовним законодавством."]] },
        { id: "wear", title: "6. ISTe Wear і попередні заявки", blocks: [
          ["p", "До підключення повноцінної системи замовлень ISTe Wear може приймати попередні заявки. Така заявка показує інтерес до товару і сама по собі не є оплатою."],
          ["p", "Ціна, фінальні характеристики, доступність розмірів, спосіб доставки та інші комерційні умови можуть бути уточнені до запуску продажів."],
        ] },
        { id: "content", title: "7. Матеріали та інтелектуальні права", blocks: [
          ["p", "Дизайн сайту, фірмові матеріали ISTe, тексти, оригінальна графіка та інші матеріали ISTe захищені застосовними нормами щодо інтелектуальної власності."],
          ["p", "Назви, зображення, API та логотипи Discord, FACEIT, Twitch, YouTube, Steam, Instagram та інших сторонніх сервісів належать відповідним власникам."],
        ] },
        { id: "prohibited", title: "8. Заборонені дії", blocks: [["ul", [
          "втручання в роботу сайту, ISTe Bot або серверної інфраструктури;",
          "спроби обійти обмеження доступу, rate limits, перевірки прав або заходи безпеки;",
          "автоматизований збір даних, що створює надмірне навантаження;",
          "масове надсилання неправдивих заявок, команд або запитів;",
          "поширення шкідливого коду, спаму, шахрайського чи незаконного контенту;",
          "копіювання фірмових матеріалів ISTe без дозволу правовласника.",
        ]]] },
        { id: "thirdparty", title: "9. Сторонні сервіси", blocks: [["p", "ISTe використовує та посилається на сторонні платформи, включно з Discord, Supabase, Vercel, FACEIT та іншими сервісами. Їхні власні умови та політики застосовуються до взаємодії користувача з відповідними платформами."]] },
        { id: "availability", title: "10. Доступність і відповідальність", blocks: [["p", "ISTe прагне підтримувати сайт і ISTe Bot у робочому стані, але не гарантує безперервну доступність, відсутність технічних помилок або незмінність функцій. Частина даних залежить від сторонніх сервісів."]] },
        { id: "changes", title: "11. Зміни умов", blocks: [["p", "Умови можуть оновлюватися разом із розвитком сайту та ISTe Bot. Нова редакція набирає чинності після публікації на цій сторінці."]] },
        { id: "contact", title: "12. Зворотний зв’язок", blocks: [["contact", "Питання щодо сервісів ISTe можна надіслати через офіційні канали на сторінці"]] },
      ],
    },
  },

  ru: {
    updatedLabel: "Последнее обновление:",
    updatedDate: "4 сентября 2026 года",
    contents: "Содержание",
    contentsAria: (title) => `Содержание документа «${title}»`,
    contactLink: "контактов ISTe",
    contactButton: "Связаться с командой",
    homeButton: "Вернуться на главную",
    privacy: {
      eyebrow: "Privacy policy",
      title: "Политика конфиденциальности",
      description:
        "Правила обработки данных при использовании официального сайта ISTe и ISTe Bot в Discord.",
      sections: [
        { id: "general", title: "1. Общие положения", blocks: [
          ["p", "Настоящая политика описывает, какие данные могут обрабатываться при использовании сайта ISTe и официального Discord приложения ISTe Bot, для чего они нужны и какие возможности есть у пользователя."],
          ["p", "Используя сайт или взаимодействуя с ISTe Bot, пользователь подтверждает, что ознакомился с этой политикой."],
        ] },
        { id: "data", title: "2. Какие данные могут обрабатываться", blocks: [
          ["p", "При использовании сервисов ISTe могут обрабатываться:"],
          ["ul", [
            "адрес электронной почты, необходимый для регистрации и входа на сайт;",
            "имя пользователя, отображаемое имя, аватар, описание профиля и публичный ID аккаунта;",
            "роль аккаунта, статус доступа и сведения о блокировке;",
            "технические данные сессии, необходимые для авторизации, безопасности и стабильной работы сайта;",
            "имя, email, выбранный товар, размер и количество, если пользователь добровольно отправляет заявку ISTe Wear;",
            "Discord User ID, Discord Guild ID, Channel ID, название сервера, локаль сервера и технические метаданные взаимодействия с ISTe Bot;",
            "параметры slash команд, которые пользователь добровольно передаёт ISTe Bot;",
            "для модерационных команд могут обрабатываться ID модератора, ID целевого участника, длительность тайм аута, причина модерационного действия, количество удалённых сообщений и ID канала;",
            "при выполнении команды очистки ISTe Bot может временно получать через Discord API ID и временные метки последних сообщений, необходимые для их удаления; содержимое таких сообщений намеренно не сохраняется ISTe;",
            "информация, которую пользователь добровольно передаёт при обращении к команде ISTe.",
          ]],
        ] },
        { id: "purpose", title: "3. Для чего используются данные", blocks: [["ul", [
          "создание аккаунта, вход и работа личного кабинета;",
          "поиск публичного профиля по точному ID;",
          "разграничение прав пользователей, редакторов, администраторов и владельца;",
          "защита сайта от злоупотреблений и несанкционированного доступа;",
          "работа slash команд ISTe Bot, отображение информации о пользователе, сервере, составе, матчах и новостях;",
          "выполнение опросов и разрешённых модерационных действий в Discord;",
          "ведение технического журнала важных действий ISTe Bot для безопасности, диагностики и расследования злоупотреблений;",
          "учёт предварительного спроса на ISTe Wear и связь с пользователем по его заявке;",
          "обработка обращений и улучшение сервисов ISTe.",
        ]]] },
        { id: "discord", title: "4. ISTe Bot и Discord", blocks: [
          ["p", "ISTe Bot работает как официальное Discord приложение ISTe. Команды передаются Discord в серверную инфраструктуру ISTe через Interactions Endpoint. Входящие interactions проверяются криптографической подписью Discord."],
          ["p", "ISTe Bot использует только те разрешения Discord, которые нужны для активированных функций. Команды модерации дополнительно проверяют права пользователя и права самого бота на конкретном сервере или канале."],
          ["p", "ISTe не просит пользователей передавать Bot Token, пароль Discord или другие секретные учётные данные. Серверные секреты хранятся отдельно от клиентского кода."],
        ] },
        { id: "storage", title: "5. Хранение и сторонняя инфраструктура", blocks: [
          ["p", "Для авторизации, базы данных, журналов и серверной логики ISTe использует Supabase. Сайт разворачивается через Vercel. Взаимодействие ISTe Bot с Discord выполняется через официальный Discord API."],
          ["p", "Технические записи об установленных Discord серверах и важных действиях бота могут храниться столько, сколько обоснованно необходимо для работы сервиса, безопасности, диагностики и выполнения законных требований."],
          ["p", "Сайт также содержит ссылки на FACEIT, Twitch, YouTube, Telegram, Discord, Steam, Instagram и другие внешние сервисы. После перехода на такие сервисы действуют их собственные правила обработки данных."],
        ] },
        { id: "shop", title: "6. Заявки ISTe Wear", blocks: [
          ["p", "Форма ISTe Wear может использоваться для предварительной заявки и оценки спроса. Отправка формы сама по себе не является оплатой и не означает автоматическое заключение договора купли продажи."],
          ["p", "Контактные данные из заявки используются для связи по выбранному товару. Сайт не запрашивает данные банковской карты через форму предварительной заявки."],
        ] },
        { id: "sharing", title: "7. Передача данных", blocks: [["p", "ISTe не продаёт персональные данные рекламодателям. Данные могут передаваться техническим поставщикам только в объёме, необходимом для работы сервиса, либо в случаях, предусмотренных применимым законодательством."]] },
        { id: "security", title: "8. Безопасность", blocks: [
          ["p", "ISTe применяет серверную проверку прав, двухфакторную аутентификацию для привилегированных аккаунтов, защищённые cookies, ограничения частоты операций, проверку происхождения запросов, политики доступа к базе данных и проверку подписей Discord interactions."],
          ["p", "При этом ни один способ передачи или хранения информации в интернете не может гарантировать абсолютную безопасность."],
        ] },
        { id: "rights", title: "9. Права пользователя и удаление данных", blocks: [
          ["p", "Пользователь может обратиться в ISTe с просьбой уточнить, исправить или удалить данные, относящиеся к его аккаунту или добровольно переданные через сервисы ISTe, если хранение этих данных не требуется из соображений безопасности или по закону."],
          ["p", "Администратор Discord сервера также может обратиться по поводу удаления технических данных о сервере после удаления ISTe Bot с этого сервера."],
          ["contact", "Для такого обращения используйте страницу"],
        ] },
        { id: "updates", title: "10. Изменения политики", blocks: [["p", "Политика может обновляться при изменении функций сайта, ISTe Bot, технической инфраструктуры или требований законодательства. Актуальная версия всегда размещается на этой странице."]] },
      ],
    },
    terms: {
      eyebrow: "Terms of use",
      title: "Условия использования",
      description:
        "Основные правила использования сайта ISTe, аккаунтов, ISTe Wear и официального Discord приложения ISTe Bot.",
      sections: [
        { id: "acceptance", title: "1. Принятие условий", blocks: [["p", "Используя сайт ISTe или ISTe Bot, пользователь соглашается соблюдать настоящие условия. При несогласии следует прекратить использование соответствующего сервиса."]] },
        { id: "services", title: "2. Сервисы ISTe", blocks: [["p", "ISTe предоставляет официальный сайт киберспортивной команды, информацию о составе, матчах, новостях, истории клуба, партнёрах, ISTe Wear и Discord приложение ISTe Bot с информационными, общественными и модерационными командами."]] },
        { id: "accounts", title: "3. Аккаунты пользователей", blocks: [["ul", [
          "пользователь должен указывать корректные данные и сохранять пароль и второй фактор аутентификации в тайне;",
          "запрещено передавать аккаунт для обхода ограничений или выдавать себя за другого человека;",
          "администрация может ограничить доступ при нарушении правил, злоупотреблениях или угрозе безопасности;",
          "пользователь несёт ответственность за действия, выполненные через его аккаунт.",
        ]]] },
        { id: "bot", title: "4. Правила использования ISTe Bot", blocks: [["ul", [
          "ISTe Bot можно устанавливать только на Discord серверы, где пользователь имеет право управлять сервером или устанавливать приложения;",
          "пользователь не должен использовать бота для спама, мошенничества, преследования, обхода правил Discord или иной незаконной деятельности;",
          "модерационные команды могут выполнять только пользователи, которым Discord предоставил соответствующие права;",
          "администратор сервера отвечает за настройку роли ISTe Bot и предоставленных ей разрешений;",
          "ISTe может временно ограничить работу бота на сервере в случае злоупотреблений, технической угрозы или нарушения настоящих условий.",
        ]]] },
        { id: "moderation", title: "5. Модерационные команды", blocks: [["p", "Команды наподобие очистки сообщений или временного ограничения участника являются инструментами администратора Discord сервера. ISTe не определяет правила конкретного сервера и не несёт ответственности за решения его модераторов, если иное не предусмотрено применимым законодательством."]] },
        { id: "wear", title: "6. ISTe Wear и предварительные заявки", blocks: [
          ["p", "До подключения полноценной системы заказов ISTe Wear может принимать предварительные заявки. Такая заявка показывает интерес к товару и сама по себе не является оплатой."],
          ["p", "Цена, финальные характеристики, доступность размеров, способ доставки и другие коммерческие условия могут быть уточнены до запуска продаж."],
        ] },
        { id: "content", title: "7. Материалы и интеллектуальные права", blocks: [
          ["p", "Дизайн сайта, фирменные материалы ISTe, тексты, оригинальная графика и другие материалы ISTe защищены применимыми нормами об интеллектуальной собственности."],
          ["p", "Названия, изображения, API и логотипы Discord, FACEIT, Twitch, YouTube, Steam, Instagram и других сторонних сервисов принадлежат соответствующим владельцам."],
        ] },
        { id: "prohibited", title: "8. Запрещённые действия", blocks: [["ul", [
          "вмешательство в работу сайта, ISTe Bot или серверной инфраструктуры;",
          "попытки обойти ограничения доступа, rate limits, проверки прав или меры безопасности;",
          "автоматизированный сбор данных, создающий чрезмерную нагрузку;",
          "массовая отправка ложных заявок, команд или запросов;",
          "распространение вредоносного кода, спама, мошеннического или незаконного контента;",
          "копирование фирменных материалов ISTe без разрешения правообладателя.",
        ]]] },
        { id: "thirdparty", title: "9. Сторонние сервисы", blocks: [["p", "ISTe использует и ссылается на сторонние платформы, включая Discord, Supabase, Vercel, FACEIT и другие сервисы. Их собственные условия и политики применяются к взаимодействию пользователя с соответствующими платформами."]] },
        { id: "availability", title: "10. Доступность и ответственность", blocks: [["p", "ISTe стремится поддерживать сайт и ISTe Bot в рабочем состоянии, но не гарантирует непрерывную доступность, отсутствие технических ошибок или неизменность функций. Часть данных зависит от сторонних сервисов."]] },
        { id: "changes", title: "11. Изменения условий", blocks: [["p", "Условия могут обновляться вместе с развитием сайта и ISTe Bot. Новая редакция вступает в силу после публикации на этой странице."]] },
        { id: "contact", title: "12. Обратная связь", blocks: [["contact", "Вопросы о сервисах ISTe можно отправить через официальные каналы на странице"]] },
      ],
    },
  },

  en: {
    updatedLabel: "Last updated:",
    updatedDate: "September 4, 2026",
    contents: "Contents",
    contentsAria: (title) => `${title} contents`,
    contactLink: "ISTe contacts page",
    contactButton: "Contact the team",
    homeButton: "Back to home",
    privacy: {
      eyebrow: "Privacy policy",
      title: "Privacy Policy",
      description:
        "Rules for processing data when using the official ISTe website and ISTe Bot on Discord.",
      sections: [
        { id: "general", title: "1. General information", blocks: [
          ["p", "This policy explains what data may be processed when using the ISTe website and the official Discord application ISTe Bot, why it is needed and what choices users have."],
          ["p", "By using the website or interacting with ISTe Bot, the user acknowledges this policy."],
        ] },
        { id: "data", title: "2. Data that may be processed", blocks: [
          ["p", "When using ISTe services, the following data may be processed:"],
          ["ul", [
            "email address required for website registration and sign in;",
            "username, display name, avatar, profile description and public account ID;",
            "account role, access status and blocking information;",
            "technical session data required for authentication, security and stable website operation;",
            "name, email, selected product, size and quantity when a user voluntarily submits an ISTe Wear request;",
            "Discord User ID, Discord Guild ID, Channel ID, server name, server locale and technical interaction metadata;",
            "slash command parameters voluntarily submitted to ISTe Bot;",
            "for moderation commands, moderator ID, target member ID, timeout duration, moderation reason, deleted message count and channel ID may be processed;",
            "when the clear command is used, ISTe Bot may temporarily receive recent message IDs and timestamps from the Discord API as needed for deletion; message content is not intentionally retained by ISTe;",
            "information voluntarily provided when contacting the ISTe team.",
          ]],
        ] },
        { id: "purpose", title: "3. How data is used", blocks: [["ul", [
          "creating accounts, signing in and operating the account area;",
          "finding a public profile by its exact ID;",
          "separating permissions for users, editors, administrators and the owner;",
          "protecting the website against abuse and unauthorized access;",
          "operating ISTe Bot slash commands and displaying user, server, roster, match and news information;",
          "creating polls and performing authorized Discord moderation actions;",
          "maintaining technical audit records of important ISTe Bot actions for security, diagnostics and abuse investigation;",
          "measuring preliminary demand for ISTe Wear and contacting users about their request;",
          "processing inquiries and improving ISTe services.",
        ]]] },
        { id: "discord", title: "4. ISTe Bot and Discord", blocks: [
          ["p", "ISTe Bot operates as the official Discord application of ISTe. Commands are delivered by Discord to ISTe server infrastructure through an Interactions Endpoint. Incoming interactions are validated using Discord cryptographic signatures."],
          ["p", "ISTe Bot uses only the Discord permissions required for enabled features. Moderation commands also verify the user permissions and bot permissions available in the relevant server or channel."],
          ["p", "ISTe does not ask users to provide a Bot Token, Discord password or other secret credentials. Server secrets are stored separately from client side code."],
        ] },
        { id: "storage", title: "5. Storage and third party infrastructure", blocks: [
          ["p", "ISTe uses Supabase for authentication, database storage, audit records and server logic. The website is deployed through Vercel. ISTe Bot communicates with Discord through the official Discord API."],
          ["p", "Technical records about installed Discord servers and important bot actions may be retained for as long as reasonably necessary to operate the service, maintain security, diagnose problems and satisfy lawful requirements."],
          ["p", "The website also links to FACEIT, Twitch, YouTube, Telegram, Discord, Steam, Instagram and other external services. Their own data processing rules apply when users interact with those services."],
        ] },
        { id: "shop", title: "6. ISTe Wear requests", blocks: [
          ["p", "The ISTe Wear form may be used for preliminary requests and demand assessment. Submitting the form is not a payment and does not automatically create a purchase agreement."],
          ["p", "Contact details from a request are used to communicate about the selected product. The website does not request bank card details through the preliminary request form."],
        ] },
        { id: "sharing", title: "7. Data sharing", blocks: [["p", "ISTe does not sell personal data to advertisers. Data may be shared with technical service providers only to the extent required to operate the service, or when required by applicable law."]] },
        { id: "security", title: "8. Security", blocks: [
          ["p", "ISTe uses server side permission checks, two factor authentication for privileged accounts, secure cookies, operation rate limits, request origin validation, database access policies and Discord interaction signature validation."],
          ["p", "However, no method of transmitting or storing information on the internet can guarantee absolute security."],
        ] },
        { id: "rights", title: "9. User rights and data deletion", blocks: [
          ["p", "A user may contact ISTe to request clarification, correction or deletion of data relating to their account or voluntarily provided through ISTe services, unless retention is required for security or by law."],
          ["p", "A Discord server administrator may also contact ISTe regarding deletion of technical server data after ISTe Bot has been removed from that server."],
          ["contact", "To make such a request, use the"],
        ] },
        { id: "updates", title: "10. Policy changes", blocks: [["p", "This policy may be updated when the website, ISTe Bot, technical infrastructure or legal requirements change. The current version is always published on this page."]] },
      ],
    },
    terms: {
      eyebrow: "Terms of use",
      title: "Terms of Use",
      description:
        "Main rules for using the ISTe website, accounts, ISTe Wear and the official Discord application ISTe Bot.",
      sections: [
        { id: "acceptance", title: "1. Acceptance of terms", blocks: [["p", "By using the ISTe website or ISTe Bot, the user agrees to follow these terms. If the user does not agree, they should stop using the relevant service."]] },
        { id: "services", title: "2. ISTe services", blocks: [["p", "ISTe provides the official website of the esports team, roster, match, news, club history and partner information, ISTe Wear features, and the Discord application ISTe Bot with informational, community and moderation commands."]] },
        { id: "accounts", title: "3. User accounts", blocks: [["ul", [
          "users must provide accurate information and keep their password and second authentication factor confidential;",
          "accounts may not be transferred to bypass restrictions or used to impersonate another person;",
          "the administration may restrict access for rule violations, abuse or security threats;",
          "users are responsible for actions performed through their account.",
        ]]] },
        { id: "bot", title: "4. ISTe Bot usage rules", blocks: [["ul", [
          "ISTe Bot may only be installed on Discord servers where the installing user has permission to manage the server or install applications;",
          "the bot may not be used for spam, fraud, harassment, evasion of Discord rules or other unlawful activity;",
          "moderation commands may only be executed by users who have the relevant Discord permissions;",
          "server administrators are responsible for configuring the ISTe Bot role and the permissions granted to it;",
          "ISTe may temporarily restrict bot operation on a server in cases of abuse, technical risk or violation of these terms.",
        ]]] },
        { id: "moderation", title: "5. Moderation commands", blocks: [["p", "Commands such as message clearing or temporarily restricting a member are tools of the Discord server administrator. ISTe does not define the rules of a specific server and is not responsible for moderation decisions made by its moderators except where applicable law provides otherwise."]] },
        { id: "wear", title: "6. ISTe Wear and preliminary requests", blocks: [
          ["p", "Until a full order system is available, ISTe Wear may accept preliminary requests. Such a request indicates interest in a product and is not itself a payment."],
          ["p", "Price, final specifications, size availability, delivery method and other commercial terms may be clarified before sales begin."],
        ] },
        { id: "content", title: "7. Materials and intellectual property", blocks: [
          ["p", "The website design, ISTe brand materials, texts, original graphics and other ISTe materials are protected by applicable intellectual property rules."],
          ["p", "Names, images, APIs and logos of Discord, FACEIT, Twitch, YouTube, Steam, Instagram and other third party services belong to their respective owners."],
        ] },
        { id: "prohibited", title: "8. Prohibited actions", blocks: [["ul", [
          "interfering with the website, ISTe Bot or server infrastructure;",
          "attempting to bypass access restrictions, rate limits, permission checks or security measures;",
          "automated data collection that creates excessive load;",
          "mass submission of false requests, commands or forms;",
          "distribution of malicious code, spam, fraudulent or illegal content;",
          "copying ISTe brand materials without permission from the rights holder.",
        ]]] },
        { id: "thirdparty", title: "9. Third party services", blocks: [["p", "ISTe uses and links to third party platforms including Discord, Supabase, Vercel, FACEIT and other services. Their own terms and policies apply to the user relationship with those platforms."]] },
        { id: "availability", title: "10. Availability and liability", blocks: [["p", "ISTe aims to keep the website and ISTe Bot operational but does not guarantee uninterrupted availability, absence of technical errors or that features will remain unchanged. Some information depends on third party services."]] },
        { id: "changes", title: "11. Changes to the terms", blocks: [["p", "These terms may be updated as the website and ISTe Bot evolve. A new version takes effect after publication on this page."]] },
        { id: "contact", title: "12. Contact", blocks: [["contact", "Questions about ISTe services can be sent through the official channels on the"]] },
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
          <time dateTime={LEGAL_UPDATED_AT}>{copy.updatedDate}</time>
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
