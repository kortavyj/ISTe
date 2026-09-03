import "./DiscordBot.css";

const DISCORD_CLIENT_ID = "1545183724218359848";
const DISCORD_INSTALL_URL =
  `https://discord.com/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}`;

const commands = [
  ["/site", "Официальный сайт ISTe"],
  ["/rules", "Правила сервера"],
  ["/team", "Текущий состав ISTe"],
  ["/matches", "Последние матчи"],
  ["/news", "Последние новости"],
  ["/help", "Список команд"],
];

export default function DiscordBot() {
  return (
    <section className="discord-bot-page">
      <div className="discord-bot-shell">
        <div className="discord-bot-hero">
          <div className="discord-bot-copy">
            <h1>ISTe Bot для вашего Discord</h1>
            <p>
              Добавьте официального бота ISTe на свой сервер. Discord сам
              предложит выбрать сервер, где у вас есть необходимые права.
            </p>

            <div className="discord-bot-actions">
              <a
                className="discord-bot-primary"
                href={DISCORD_INSTALL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Добавить ISTe Bot
              </a>

              <a
                className="discord-bot-secondary"
                href="https://istesport.com"
              >
                На сайт ISTe
              </a>
            </div>

            <p className="discord-bot-note">
              Для установки на сервер Discord потребует право управления
              сервером. Токен бота пользователю не передаётся.
            </p>
          </div>

          <div className="discord-bot-mark" aria-hidden="true">
            <div className="discord-bot-mark-ring">
              <span>ISTe</span>
            </div>
            <strong>DISCORD BOT</strong>
          </div>
        </div>

        <div className="discord-bot-command-section">
          <h2>Команды V1</h2>

          <div className="discord-bot-command-list">
            {commands.map(([command, description]) => (
              <div className="discord-bot-command" key={command}>
                <code>{command}</code>
                <span>{description}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="discord-bot-info">
          <div>
            <strong>Один бот — много серверов</strong>
            <p>
              ISTe Bot не привязан к одному Discord-серверу. Его можно
              устанавливать на разные сообщества и команды.
            </p>
          </div>

          <div>
            <strong>Безопасная установка</strong>
            <p>
              Авторизация проходит непосредственно на discord.com через
              официальную ссылку приложения.
            </p>
          </div>

          <div>
            <strong>Связан с ISTe</strong>
            <p>
              Состав, матчи и новости бот получает из инфраструктуры
              ISTesport.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
