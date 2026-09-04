# ISTe Discord Presence Worker

Постоянный Railway worker для статуса ISTe Bot.

Что делает:

1. Подключает ISTe Bot к Discord Gateway.
2. Держит bot account онлайн.
3. Раз в минуту читает текущие данные матчей ISTe.
4. Если есть матч со статусом `ongoing`, показывает activity вида:
   `ISTe vs Opponent • 1:0 • BO3 • LIVE`
5. Когда live матча нет, показывает:
   `ISTe Esports • istesport.com`
6. Не хранит Discord Bot Token в GitHub.
7. Имеет `/health` endpoint для Railway healthcheck.

## Railway

Source repository: `kortavyj/ISTe`

Root Directory:

`/presence-worker`

Required variable:

`DISCORD_BOT_TOKEN`

После добавления переменной Railway должен автоматически перезапустить deployment.

В логах успешный запуск выглядит примерно так:

`discord_ready`
`presence_updated`

## Важно

Не добавляйте реальный Bot Token в `.env.example`, GitHub, Vercel или клиентский React код.
