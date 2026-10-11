# ISTe Tournaments: бесплатное тестирование

## GitHub Actions

Ветка: `feature/cs2-tournaments-full-preview`. В PR #13 выполняется workflow `ISTe Tournaments CI` (если GitHub Actions разрешены репозиторию). Workflow использует временный контейнер PostgreSQL 16. Платные облачные базы не создаются.

Этапы: `npm ci`, `npm test`, `npm run lint`, `npm run build`, применение четырёх миграций на изолированном PostgreSQL и транзакционное моделирование турниров с 2 до 64 команд.

Проверка результата: GitHub → Actions → ISTe Tournaments CI. Отсутствие запуска или зелёной проверки **не** означает, что интеграционные тесты прошли.

## Windows / Docker Desktop

Из корня клонированного репозитория:

```powershell
npm ci
npm test
powershell -ExecutionPolicy Bypass -File tests/pg/run-local.ps1
docker compose -f tests/pg/compose.yml down
```

Только локальный Docker-контейнер на `127.0.0.1:55432`. Никаких реальных ключей Supabase, данных ISTe или оплат. Не направлять эти SQL-скрипты в production.

## Условия допуска в production

Не объединять PR #13, пока не подтверждены успешные интеграционные тесты PostgreSQL, проверка RLS, работа всех турниров через API и корректная ролевая модель. Подключение MatchZy выполняется отдельно на тестовом CS2 сервере; сейчас игровой плагин отсутствует.
