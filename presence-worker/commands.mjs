const DISCORD_API = "https://discord.com/api/v10";

const GUILD_INSTALL = [0];
const GUILD_CONTEXT = [0];

const MANAGE_MESSAGES = "8192";
const MODERATE_MEMBERS = "1099511627776";

const locale = (ru, uk) => ({
  ru,
  uk,
});

const descriptionLocale = (ru, uk) => ({
  ru,
  uk,
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
  description_localizations: descriptionLocale(
    ruDescription,
    ukDescription,
  ),
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
  description_localizations: descriptionLocale(
    ruDescription,
    ukDescription,
  ),
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
  description_localizations: descriptionLocale(
    ruDescription,
    ukDescription,
  ),
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
  description_localizations: descriptionLocale(
    ruDescription,
    ukDescription,
  ),
  required,
});

function command({
  name,
  description,
  ruName,
  ukName,
  ruDescription,
  ukDescription,
  options = [],
  defaultMemberPermissions,
}) {
  return {
    type: 1,
    name,
    description,
    name_localizations: locale(ruName, ukName),
    description_localizations: descriptionLocale(
      ruDescription,
      ukDescription,
    ),
    integration_types: GUILD_INSTALL,
    contexts: GUILD_CONTEXT,
    ...(options.length ? { options } : {}),
    ...(defaultMemberPermissions
      ? { default_member_permissions: defaultMemberPermissions }
      : {}),
  };
}

export const ISTE_COMMANDS = [
  command({
    name: "help",
    description: "Show ISTe Bot commands",
    ruName: "помощь",
    ukName: "допомога",
    ruDescription: "Показать команды ISTe Bot",
    ukDescription: "Показати команди ISTe Bot",
  }),

  command({
    name: "matches",
    description: "Show recent ISTe matches",
    ruName: "матчи",
    ukName: "матчі",
    ruDescription: "Показать последние матчи ISTe",
    ukDescription: "Показати останні матчі ISTe",
  }),

  command({
    name: "team",
    description: "Show the current ISTe roster",
    ruName: "состав",
    ukName: "склад",
    ruDescription: "Показать текущий состав ISTe",
    ukDescription: "Показати поточний склад ISTe",
  }),

  command({
    name: "news",
    description: "Show the latest ISTe news",
    ruName: "новости",
    ukName: "новини",
    ruDescription: "Показать последние новости ISTe",
    ukDescription: "Показати останні новини ISTe",
  }),

  command({
    name: "site",
    description: "Open the official ISTe website",
    ruName: "сайт",
    ukName: "сайт",
    ruDescription: "Открыть официальный сайт ISTe",
    ukDescription: "Відкрити офіційний сайт ISTe",
  }),

  command({
    name: "rules",
    description: "Show ISTe Discord rules",
    ruName: "правила",
    ukName: "правила",
    ruDescription: "Показать правила Discord ISTe",
    ukDescription: "Показати правила Discord ISTe",
  }),

  command({
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
    name: "bot",
    description: "Show information about ISTe Bot",
    ruName: "бот",
    ukName: "бот",
    ruDescription: "Показать информацию об ISTe Bot",
    ukDescription: "Показати інформацію про ISTe Bot",
  }),

  command({
    name: "invite",
    description: "Get the official ISTe Bot install link",
    ruName: "пригласить",
    ukName: "запросити",
    ruDescription: "Получить ссылку установки ISTe Bot",
    ukDescription: "Отримати посилання для встановлення ISTe Bot",
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
