const DISCORD_API = "https://discord.com/api/v10";

const GUILD_INSTALL = [0];
const GUILD_CONTEXT = [0];

const KICK_MEMBERS = "2";
const BAN_MEMBERS = "4";
const ADMINISTRATOR = "8";
const MANAGE_CHANNELS = "16";
const MANAGE_MESSAGES = "8192";
const MODERATE_MEMBERS = "1099511627776";

const locale = (ru, uk) => ({ ru, uk });

const command = ({
  name,
  description,
  ruName,
  ukName,
  ruDescription,
  ukDescription,
  options = [],
  defaultMemberPermissions,
  userInstall = false,
}) => ({
  type: 1,
  name,
  description,
  name_localizations: locale(ruName, ukName),
  description_localizations: locale(ruDescription, ukDescription),
  integration_types: userInstall ? [0, 1] : GUILD_INSTALL,
  contexts: userInstall ? [0, 1, 2] : GUILD_CONTEXT,
  ...(options.length ? { options } : {}),
  ...(defaultMemberPermissions
    ? { default_member_permissions: defaultMemberPermissions }
    : {}),
});

const stringOption = ({
  name,
  description,
  ruName,
  ukName,
  ruDescription,
  ukDescription,
  required = false,
  minLength,
  maxLength,
}) => ({
  type: 3,
  name,
  description,
  name_localizations: locale(ruName, ukName),
  description_localizations: locale(ruDescription, ukDescription),
  required,
  ...(Number.isInteger(minLength) ? { min_length: minLength } : {}),
  ...(Number.isInteger(maxLength) ? { max_length: maxLength } : {}),
});

const integerOption = ({
  name,
  description,
  ruName,
  ukName,
  ruDescription,
  ukDescription,
  required = false,
  minValue,
  maxValue,
}) => ({
  type: 4,
  name,
  description,
  name_localizations: locale(ruName, ukName),
  description_localizations: locale(ruDescription, ukDescription),
  required,
  ...(Number.isInteger(minValue) ? { min_value: minValue } : {}),
  ...(Number.isInteger(maxValue) ? { max_value: maxValue } : {}),
});

const booleanOption = ({
  name,
  description,
  ruName,
  ukName,
  ruDescription,
  ukDescription,
  required = false,
}) => ({
  type: 5,
  name,
  description,
  name_localizations: locale(ruName, ukName),
  description_localizations: locale(ruDescription, ukDescription),
  required,
});

const userOption = ({
  name,
  description,
  ruName,
  ukName,
  ruDescription,
  ukDescription,
  required = false,
}) => ({
  type: 6,
  name,
  description,
  name_localizations: locale(ruName, ukName),
  description_localizations: locale(ruDescription, ukDescription),
  required,
});

const channelOption = ({
  name,
  description,
  ruName,
  ukName,
  ruDescription,
  ukDescription,
  required = false,
}) => ({
  type: 7,
  name,
  description,
  name_localizations: locale(ruName, ukName),
  description_localizations: locale(ruDescription, ukDescription),
  required,
});

const roleOption = ({
  name,
  description,
  ruName,
  ukName,
  ruDescription,
  ukDescription,
  required = false,
}) => ({
  type: 8,
  name,
  description,
  name_localizations: locale(ruName, ukName),
  description_localizations: locale(ruDescription, ukDescription),
  required,
});

const subcommand = ({
  name,
  description,
  ruName,
  ukName,
  ruDescription,
  ukDescription,
  options = [],
}) => ({
  type: 1,
  name,
  description,
  name_localizations: locale(ruName, ukName),
  description_localizations: locale(ruDescription, ukDescription),
  ...(options.length ? { options } : {}),
});

export const ISTE_COMMANDS = [
  command({
    name: "apply",
    description: "Submit an application to join ISTe",
    ruName: "заявка",
    ukName: "заявка",
    ruDescription: "Подать заявку в команду проекта ISTe",
    ukDescription: "Подати заявку в команду проєкту ISTe",
  }),

  command({
    name: "recruitment",
    description: "Configure and publish the ISTe recruitment panel",
    ruName: "набор",
    ukName: "набір",
    ruDescription: "Настроить и опубликовать панель набора ISTe",
    ukDescription: "Налаштувати та опублікувати панель набору ISTe",
    options: [
      channelOption({
        name: "review_channel",
        description: "Private channel where staff reviews applications",
        ruName: "канал_заявок",
        ukName: "канал_заявок",
        ruDescription: "Закрытый канал для рассмотрения заявок",
        ukDescription: "Закритий канал для розгляду заявок",
        required: true,
      }),
      roleOption({
        name: "member_role",
        description: "Role granted after an application is accepted",
        ruName: "роль",
        ukName: "роль",
        ruDescription: "Роль, которая выдаётся после принятия заявки",
        ukDescription: "Роль, яка видається після прийняття заявки",
      }),
    ],
  }),

  command({
    name: "applications",
    description: "Show active ISTe recruitment applications",
    ruName: "заявки",
    ukName: "заявки",
    ruDescription: "Показать активные заявки ISTe",
    ukDescription: "Показати активні заявки ISTe",
  }),

  command({
    userInstall: true,
    name: "help",
    description: "Show ISTe Bot commands",
    ruName: "помощь",
    ukName: "допомога",
    ruDescription: "Показать команды ISTe Bot",
    ukDescription: "Показати команди ISTe Bot",
  }),

  command({
    userInstall: true,
    name: "matches",
    description: "Show recent ISTe matches",
    ruName: "матчи",
    ukName: "матчі",
    ruDescription: "Показать последние матчи ISTe",
    ukDescription: "Показати останні матчі ISTe",
  }),

  command({
    userInstall: true,
    name: "team",
    description: "Show the current ISTe roster",
    ruName: "состав",
    ukName: "склад",
    ruDescription: "Показать текущий состав ISTe",
    ukDescription: "Показати поточний склад ISTe",
  }),

  command({
    userInstall: true,
    name: "news",
    description: "Show the latest ISTe news",
    ruName: "новости",
    ukName: "новини",
    ruDescription: "Показать последние новости ISTe",
    ukDescription: "Показати останні новини ISTe",
  }),

  command({
    userInstall: true,
    name: "site",
    description: "Open the official ISTe website",
    ruName: "сайт",
    ukName: "сайт",
    ruDescription: "Открыть официальный сайт ISTe",
    ukDescription: "Відкрити офіційний сайт ISTe",
  }),

  command({
    userInstall: true,
    name: "rules",
    description: "Show ISTe Discord rules",
    ruName: "правила",
    ukName: "правила",
    ruDescription: "Показать правила Discord ISTe",
    ukDescription: "Показати правила Discord ISTe",
  }),

  command({
    userInstall: true,
    name: "ping",
    description: "Check whether ISTe Bot is online",
    ruName: "пинг",
    ukName: "пінг",
    ruDescription: "Проверить доступность ISTe Bot",
    ukDescription: "Перевірити доступність ISTe Bot",
  }),

  command({
    name: "server",
    description: "Show information about this Discord server",
    ruName: "сервер",
    ukName: "сервер",
    ruDescription: "Показать информацию об этом сервере",
    ukDescription: "Показати інформацію про цей сервер",
  }),

  command({
    userInstall: true,
    name: "user",
    description: "Show information about a Discord user",
    ruName: "пользователь",
    ukName: "користувач",
    ruDescription: "Показать информацию о пользователе",
    ukDescription: "Показати інформацію про користувача",
    options: [
      userOption({
        name: "member",
        description: "Member to inspect",
        ruName: "участник",
        ukName: "учасник",
        ruDescription: "Участник для просмотра",
        ukDescription: "Учасник для перегляду",
      }),
    ],
  }),

  command({
    userInstall: true,
    name: "avatar",
    description: "Show a Discord user's avatar",
    ruName: "аватар",
    ukName: "аватар",
    ruDescription: "Показать аватар пользователя",
    ukDescription: "Показати аватар користувача",
    options: [
      userOption({
        name: "member",
        description: "Member whose avatar will be shown",
        ruName: "участник",
        ukName: "учасник",
        ruDescription: "Участник, чей аватар нужно показать",
        ukDescription: "Учасник, чий аватар потрібно показати",
      }),
    ],
  }),

  command({
    userInstall: true,
    name: "bot",
    description: "Show information about ISTe Bot",
    ruName: "бот",
    ukName: "бот",
    ruDescription: "Показать информацию об ISTe Bot",
    ukDescription: "Показати інформацію про ISTe Bot",
  }),

  command({
    userInstall: true,
    name: "invite",
    description: "Get the official ISTe Bot install link",
    ruName: "пригласить",
    ukName: "запросити",
    ruDescription: "Получить ссылку установки ISTe Bot",
    ukDescription: "Отримати посилання для встановлення ISTe Bot",
  }),

  command({
    name: "subscription",
    description: "Manage your ISTe Bot subscription",
    ruName: "подписка",
    ukName: "підписка",
    ruDescription: "Посмотреть статус и запросить подписку ISTe Bot",
    ukDescription: "Переглянути статус і запросити підписку ISTe Bot",
  }),

  command({
    name: "subscriptions",
    description: "Review ISTe Bot subscription requests",
    ruName: "подписки",
    ukName: "підписки",
    ruDescription: "Просмотреть заявки на подписку ISTe Bot",
    ukDescription: "Переглянути заявки на підписку ISTe Bot",
    defaultMemberPermissions: ADMINISTRATOR,
  }),

  command({
    name: "poll",
    description: "Create a Discord poll",
    ruName: "опрос",
    ukName: "опитування",
    ruDescription: "Создать опрос в Discord",
    ukDescription: "Створити опитування в Discord",
    options: [
      stringOption({
        name: "question",
        description: "Poll question",
        ruName: "вопрос",
        ukName: "питання",
        ruDescription: "Вопрос опроса",
        ukDescription: "Питання опитування",
        required: true,
        minLength: 1,
        maxLength: 300,
      }),
      stringOption({
        name: "option1",
        description: "First answer",
        ruName: "вариант1",
        ukName: "варіант1",
        ruDescription: "Первый вариант ответа",
        ukDescription: "Перший варіант відповіді",
        required: true,
        minLength: 1,
        maxLength: 55,
      }),
      stringOption({
        name: "option2",
        description: "Second answer",
        ruName: "вариант2",
        ukName: "варіант2",
        ruDescription: "Второй вариант ответа",
        ukDescription: "Другий варіант відповіді",
        required: true,
        minLength: 1,
        maxLength: 55,
      }),
      stringOption({
        name: "option3",
        description: "Third answer",
        ruName: "вариант3",
        ukName: "варіант3",
        ruDescription: "Третий вариант ответа",
        ukDescription: "Третій варіант відповіді",
        maxLength: 55,
      }),
      stringOption({
        name: "option4",
        description: "Fourth answer",
        ruName: "вариант4",
        ukName: "варіант4",
        ruDescription: "Четвёртый вариант ответа",
        ukDescription: "Четвертий варіант відповіді",
        maxLength: 55,
      }),
      stringOption({
        name: "option5",
        description: "Fifth answer",
        ruName: "вариант5",
        ukName: "варіант5",
        ruDescription: "Пятый вариант ответа",
        ukDescription: "Пʼятий варіант відповіді",
        maxLength: 55,
      }),
      integerOption({
        name: "hours",
        description: "Poll duration in hours",
        ruName: "часы",
        ukName: "години",
        ruDescription: "Продолжительность опроса в часах",
        ukDescription: "Тривалість опитування у годинах",
        minValue: 1,
        maxValue: 768,
      }),
      booleanOption({
        name: "multiselect",
        description: "Allow multiple answers",
        ruName: "мультивыбор",
        ukName: "мультивибір",
        ruDescription: "Разрешить выбирать несколько ответов",
        ukDescription: "Дозволити обирати кілька відповідей",
      }),
    ],
  }),

  command({
    name: "room",
    description: "Manage a temporary private voice room",
    ruName: "комната",
    ukName: "кімната",
    ruDescription: "Управление временной приватной голосовой комнатой",
    ukDescription: "Керування тимчасовою приватною голосовою кімнатою",
    options: [
      subcommand({
        name: "setup",
        description: "Create the private voice room system",
        ruName: "настроить",
        ukName: "налаштувати",
        ruDescription: "Создать систему приватных голосовых комнат",
        ukDescription: "Створити систему приватних голосових кімнат",
      }),
      subcommand({
        name: "invite",
        description: "Give a member access to your room",
        ruName: "пригласить",
        ukName: "запросити",
        ruDescription: "Дать участнику доступ к вашей комнате",
        ukDescription: "Надати учаснику доступ до вашої кімнати",
        options: [
          userOption({
            name: "member",
            description: "Member to invite",
            ruName: "участник",
            ukName: "учасник",
            ruDescription: "Кому дать доступ",
            ukDescription: "Кому надати доступ",
            required: true,
          }),
        ],
      }),
      subcommand({
        name: "remove",
        description: "Remove a member from your room",
        ruName: "удалить",
        ukName: "видалити",
        ruDescription: "Забрать доступ к вашей комнате",
        ukDescription: "Забрати доступ до вашої кімнати",
        options: [
          userOption({
            name: "member",
            description: "Member to remove",
            ruName: "участник",
            ukName: "учасник",
            ruDescription: "У кого забрать доступ",
            ukDescription: "У кого забрати доступ",
            required: true,
          }),
        ],
      }),
      subcommand({
        name: "rename",
        description: "Rename your private room",
        ruName: "переименовать",
        ukName: "перейменувати",
        ruDescription: "Изменить название вашей комнаты",
        ukDescription: "Змінити назву вашої кімнати",
        options: [
          stringOption({
            name: "name",
            description: "New room name",
            ruName: "название",
            ukName: "назва",
            ruDescription: "Новое название комнаты",
            ukDescription: "Нова назва кімнати",
            required: true,
            minLength: 1,
            maxLength: 80,
          }),
        ],
      }),
      subcommand({
        name: "limit",
        description: "Set the room member limit",
        ruName: "лимит",
        ukName: "ліміт",
        ruDescription: "Установить лимит участников",
        ukDescription: "Встановити ліміт учасників",
        options: [
          integerOption({
            name: "amount",
            description: "0 means unlimited",
            ruName: "количество",
            ukName: "кількість",
            ruDescription: "0 означает без лимита",
            ukDescription: "0 означає без ліміту",
            required: true,
            minValue: 0,
            maxValue: 99,
          }),
        ],
      }),
      subcommand({
        name: "transfer",
        description: "Transfer room ownership",
        ruName: "передать",
        ukName: "передати",
        ruDescription: "Передать комнату другому участнику",
        ukDescription: "Передати кімнату іншому учаснику",
        options: [
          userOption({
            name: "member",
            description: "New room owner",
            ruName: "участник",
            ukName: "учасник",
            ruDescription: "Новый владелец комнаты",
            ukDescription: "Новий власник кімнати",
            required: true,
          }),
        ],
      }),
      subcommand({
        name: "info",
        description: "Show your private room information",
        ruName: "инфо",
        ukName: "інфо",
        ruDescription: "Показать состояние вашей комнаты",
        ukDescription: "Показати стан вашої кімнати",
      }),
      subcommand({
        name: "delete",
        description: "Delete your private room",
        ruName: "закрыть",
        ukName: "закрити",
        ruDescription: "Удалить вашу приватную комнату",
        ukDescription: "Видалити вашу приватну кімнату",
      }),
    ],
  }),

  command({
    name: "warn",
    description: "Warn a Discord member",
    ruName: "варн",
    ukName: "варн",
    ruDescription: "Выдать предупреждение участнику",
    ukDescription: "Видати попередження учаснику",
    defaultMemberPermissions: MODERATE_MEMBERS,
    options: [
      userOption({
        name: "member",
        description: "Member to warn",
        ruName: "участник",
        ukName: "учасник",
        ruDescription: "Участник для предупреждения",
        ukDescription: "Учасник для попередження",
        required: true,
      }),
      stringOption({
        name: "reason",
        description: "Warning reason",
        ruName: "причина",
        ukName: "причина",
        ruDescription: "Причина предупреждения",
        ukDescription: "Причина попередження",
        maxLength: 256,
      }),
    ],
  }),

  command({
    name: "warnings",
    description: "Show active warnings for a member",
    ruName: "варны",
    ukName: "варни",
    ruDescription: "Показать активные предупреждения участника",
    ukDescription: "Показати активні попередження учасника",
    defaultMemberPermissions: MODERATE_MEMBERS,
    options: [
      userOption({
        name: "member",
        description: "Member whose warnings will be shown",
        ruName: "участник",
        ukName: "учасник",
        ruDescription: "Участник для просмотра предупреждений",
        ukDescription: "Учасник для перегляду попереджень",
        required: true,
      }),
    ],
  }),

  command({
    name: "unwarn",
    description: "Revoke an active warning by case number",
    ruName: "снять_варн",
    ukName: "зняти_варн",
    ruDescription: "Снять предупреждение по номеру кейса",
    ukDescription: "Зняти попередження за номером кейса",
    defaultMemberPermissions: MODERATE_MEMBERS,
    options: [
      integerOption({
        name: "case",
        description: "Moderation case number",
        ruName: "кейс",
        ukName: "кейс",
        ruDescription: "Номер кейса предупреждения",
        ukDescription: "Номер кейса попередження",
        required: true,
        minValue: 1,
        maxValue: 2147483647,
      }),
      stringOption({
        name: "reason",
        description: "Reason for revoking the warning",
        ruName: "причина",
        ukName: "причина",
        ruDescription: "Причина снятия предупреждения",
        ukDescription: "Причина зняття попередження",
        maxLength: 256,
      }),
    ],
  }),

  command({
    name: "kick",
    description: "Kick a Discord member",
    ruName: "кик",
    ukName: "кік",
    ruDescription: "Выгнать участника с сервера",
    ukDescription: "Вигнати учасника із сервера",
    defaultMemberPermissions: KICK_MEMBERS,
    options: [
      userOption({
        name: "member",
        description: "Member to kick",
        ruName: "участник",
        ukName: "учасник",
        ruDescription: "Участник для исключения",
        ukDescription: "Учасник для виключення",
        required: true,
      }),
      stringOption({
        name: "reason",
        description: "Kick reason",
        ruName: "причина",
        ukName: "причина",
        ruDescription: "Причина исключения",
        ukDescription: "Причина виключення",
        maxLength: 256,
      }),
    ],
  }),

  command({
    name: "ban",
    description: "Ban a Discord member",
    ruName: "бан",
    ukName: "бан",
    ruDescription: "Заблокировать участника на сервере",
    ukDescription: "Заблокувати учасника на сервері",
    defaultMemberPermissions: BAN_MEMBERS,
    options: [
      userOption({
        name: "member",
        description: "Member to ban",
        ruName: "участник",
        ukName: "учасник",
        ruDescription: "Участник для блокировки",
        ukDescription: "Учасник для блокування",
        required: true,
      }),
      integerOption({
        name: "delete_days",
        description: "Delete messages from the last N days",
        ruName: "удалить_дней",
        ukName: "видалити_днів",
        ruDescription: "Удалить сообщения за последние N дней",
        ukDescription: "Видалити повідомлення за останні N днів",
        minValue: 0,
        maxValue: 7,
      }),
      stringOption({
        name: "reason",
        description: "Ban reason",
        ruName: "причина",
        ukName: "причина",
        ruDescription: "Причина блокировки",
        ukDescription: "Причина блокування",
        maxLength: 256,
      }),
    ],
  }),

  command({
    name: "unban",
    description: "Unban a Discord user by ID",
    ruName: "разбан",
    ukName: "розбан",
    ruDescription: "Разблокировать пользователя по Discord ID",
    ukDescription: "Розблокувати користувача за Discord ID",
    defaultMemberPermissions: BAN_MEMBERS,
    options: [
      stringOption({
        name: "user_id",
        description: "Discord user ID",
        ruName: "id",
        ukName: "id",
        ruDescription: "Discord ID пользователя",
        ukDescription: "Discord ID користувача",
        required: true,
        minLength: 17,
        maxLength: 20,
      }),
      stringOption({
        name: "reason",
        description: "Unban reason",
        ruName: "причина",
        ukName: "причина",
        ruDescription: "Причина разблокировки",
        ukDescription: "Причина розблокування",
        maxLength: 256,
      }),
    ],
  }),

  command({
    name: "slowmode",
    description: "Set slowmode for a text channel",
    ruName: "слоумод",
    ukName: "слоумод",
    ruDescription: "Установить задержку сообщений в канале",
    ukDescription: "Встановити затримку повідомлень у каналі",
    defaultMemberPermissions: MANAGE_CHANNELS,
    options: [
      integerOption({
        name: "seconds",
        description: "Delay in seconds, 0 disables slowmode",
        ruName: "секунды",
        ukName: "секунди",
        ruDescription: "Задержка в секундах, 0 отключает",
        ukDescription: "Затримка в секундах, 0 вимикає",
        required: true,
        minValue: 0,
        maxValue: 21600,
      }),
      channelOption({
        name: "channel",
        description: "Channel to update, current channel by default",
        ruName: "канал",
        ukName: "канал",
        ruDescription: "Канал, по умолчанию текущий",
        ukDescription: "Канал, за замовчуванням поточний",
      }),
    ],
  }),

  command({
    name: "clear",
    description: "Delete recent messages from this channel",
    ruName: "очистить",
    ukName: "очистити",
    ruDescription: "Удалить последние сообщения из канала",
    ukDescription: "Видалити останні повідомлення з каналу",
    defaultMemberPermissions: MANAGE_MESSAGES,
    options: [
      integerOption({
        name: "amount",
        description: "Number of messages to delete",
        ruName: "количество",
        ukName: "кількість",
        ruDescription: "Количество сообщений для удаления",
        ukDescription: "Кількість повідомлень для видалення",
        required: true,
        minValue: 1,
        maxValue: 100,
      }),
    ],
  }),

  command({
    name: "timeout",
    description: "Temporarily timeout a Discord member",
    ruName: "таймаут",
    ukName: "таймаут",
    ruDescription: "Временно ограничить участника сервера",
    ukDescription: "Тимчасово обмежити учасника сервера",
    defaultMemberPermissions: MODERATE_MEMBERS,
    options: [
      userOption({
        name: "member",
        description: "Member to timeout",
        ruName: "участник",
        ukName: "учасник",
        ruDescription: "Участник для таймаута",
        ukDescription: "Учасник для таймауту",
        required: true,
      }),
      integerOption({
        name: "minutes",
        description: "Timeout duration in minutes",
        ruName: "минуты",
        ukName: "хвилини",
        ruDescription: "Длительность таймаута в минутах",
        ukDescription: "Тривалість таймауту у хвилинах",
        required: true,
        minValue: 1,
        maxValue: 40320,
      }),
      stringOption({
        name: "reason",
        description: "Moderation reason",
        ruName: "причина",
        ukName: "причина",
        ruDescription: "Причина таймаута",
        ukDescription: "Причина таймауту",
        maxLength: 256,
      }),
    ],
  }),
];

function compactCommandForLog(command) {
  return {
    name: command.name,
    ru: command.name_localizations?.ru ?? null,
    uk: command.name_localizations?.uk ?? null,
  };
}

export const ISTE_SUBSCRIPTION_COMMANDS =
  ISTE_COMMANDS.filter(
    (command) =>
      command.name ===
        "subscription" ||
      command.name ===
        "subscriptions",
  );

async function upsertGuildCommand(
  token,
  applicationId,
  guildId,
  command,
) {
  const response = await fetch(
    `${DISCORD_API}/applications/${applicationId}/guilds/${guildId}/commands`,
    {
      method: "POST",
      headers: {
        Authorization:
          `Bot ${token}`,
        "Content-Type":
          "application/json",
        Accept:
          "application/json",
      },
      body:
        JSON.stringify(
          command,
        ),
    },
  );

  const payload =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      `Discord guild command sync failed with HTTP ${response.status}`;

    throw new Error(
      `${message}: ${JSON.stringify(
        payload,
      ).slice(0, 1500)}`,
    );
  }

  return payload;
}

export async function syncDiscordGuildSubscriptionCommands(
  token,
  applicationId,
  guildIds,
) {
  const cleanToken =
    String(token || "")
      .trim();
  const cleanApplicationId =
    String(
      applicationId ||
        "",
    ).trim();
  const cleanGuildIds =
    [
      ...new Set(
        (
          Array.isArray(
            guildIds,
          )
            ? guildIds
            : []
        )
          .map((value) =>
            String(
              value ||
                "",
            ).trim(),
          )
          .filter((value) =>
            /^[0-9]{17,20}$/.test(
              value,
            ),
          ),
      ),
    ];

  if (!cleanToken) {
    throw new Error(
      "DISCORD_BOT_TOKEN is missing",
    );
  }

  if (!cleanApplicationId) {
    throw new Error(
      "Discord application id is missing",
    );
  }

  const synced = [];

  for (
    const guildId
    of cleanGuildIds
  ) {
    for (
      const command
      of ISTE_SUBSCRIPTION_COMMANDS
    ) {
      const result =
        await upsertGuildCommand(
          cleanToken,
          cleanApplicationId,
          guildId,
          command,
        );

      synced.push({
        guildId,
        name:
          result?.name ||
          command.name,
        id:
          result?.id ||
          null,
      });
    }
  }

  return {
    guildCount:
      cleanGuildIds.length,
    commandCount:
      synced.length,
    commands:
      synced,
  };
}

export async function syncDiscordCommands(token, applicationId) {
  const cleanToken = String(token || "").trim();
  const cleanApplicationId = String(applicationId || "").trim();

  if (!cleanToken) {
    throw new Error("DISCORD_BOT_TOKEN is missing");
  }

  if (!cleanApplicationId) {
    throw new Error("Discord application id is missing");
  }

  const response = await fetch(
    `${DISCORD_API}/applications/${cleanApplicationId}/commands`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${cleanToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(ISTE_COMMANDS),
    },
  );

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.message ||
      `Discord command sync failed with HTTP ${response.status}`;

    throw new Error(
      `${message}: ${JSON.stringify(payload).slice(0, 1500)}`,
    );
  }

  const commands = Array.isArray(payload) ? payload : [];

  return {
    count: commands.length,
    commands: commands.map(compactCommandForLog),
  };
}
