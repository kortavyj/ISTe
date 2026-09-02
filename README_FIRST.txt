ISTe — FIX VERCEL HOBBY LIMIT + RESTORE INDEX + UA DEFAULT

ПРОБЛЕМА
Сейчас в /api находится 15 JavaScript-файлов.
Vercel Hobby допускает максимум 12 Serverless Functions.

После этого исправления в /api останется 11 JS-файлов.
То есть deployment снова укладывается в лимит, остаётся 1 запасной слот.

ЗАГРУЗИТЬ / ЗАМЕНИТЬ В GITHUB

1. index.html
2. api/auth/login.js
3. api/auth/recover.js
4. server/lib/authSecurity.js
5. server/lib/supabaseAdmin.js

ОБЯЗАТЕЛЬНО УДАЛИТЬ ИЗ GITHUB ПОСЛЕ ЗАГРУЗКИ

1. api/lib/authSecurity.js
2. api/lib/supabaseAdmin.js
3. api/health.js
4. api/security/check.js

ПОЧЕМУ УДАЛЯЕМ health.js И security/check.js
Это диагностические endpoints. Для работы сайта, логина, магазина,
новостей, owner-панели и Supabase они не нужны.
Они занимают 2 Serverless Function слота.

ЧТО СОХРАНЯЕТСЯ
- login
- logout
- register
- recovery password
- session
- owner API
- shop через owner.js
- rate limit
- auth security events
- Supabase secret key остаётся только на сервере
- украинский язык по умолчанию
- красивый переключатель UA/RU/EN из предыдущего localization update

ПОСЛЕ COMMIT
1. Vercel должен запустить новый deployment.
2. Ошибка "No more than 12 Serverless Functions..." должна исчезнуть.
3. Vite снова увидит корневой index.html.
4. Дождаться статуса Ready.
5. Проверить https://istesport.com
6. Проверить /login
7. Проверить /forgot-password
8. Проверить /owner/shop
9. Проверить UA/RU/EN.

ВАЖНО НА БУДУЩЕЕ
При текущей схеме остаётся 1 свободный Serverless Function слот.
Новый endpoint в /api нельзя добавлять просто новым файлом:
сначала объединяем его с существующим handler либо переносим helper вне /api.
