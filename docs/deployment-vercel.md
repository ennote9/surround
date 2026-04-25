# Vercel Deployment Guide

Руководство по первому **production**-хостингу **Life Progress OS** (Vite + React + TypeScript + Supabase) на **Vercel**.

## 1. Почему Vercel для первого деплоя

- **Простой путь** от репозитория GitHub до работающего URL (`*.vercel.app`) без собственного сервера.
- **Хорошая интеграция** с Vite: статическая сборка (`dist/`), глобальная CDN, HTTPS по умолчанию.
- **Переменные окружения** в UI, превью для PR (Preview) и отдельные настройки для Production.
- **Быстрые откаты** между задеплоенными версиями в dashboard.

## 2. Тип проекта

Это **одностраничное приложение (SPA)** на **Vite + React** с **React Router** (клиентский роутинг). Сервер рендерит не HTML-страницы по маршрутам, а отдаёт `index.html` + статические `assets` из `dist/`.

## 3. Необходимые переменные окружения (frontend / public)

| Переменная | Назначение |
|------------|------------|
| `VITE_SUPABASE_URL` | URL проекта Supabase (API) |
| `VITE_SUPABASE_ANON_KEY` | **Публичный** anon (publishable) ключ для Supabase client в браузере |

Имена **должны** начинаться с `VITE_`, чтобы Vite встроил значения в клиентскую сборку (см. [Vite env](https://vitejs.dev/guide/env-and-mode.html)).

## 4. Где взять значения в Supabase

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard) → ваш проект.
2. **Settings → API**:
   - **Project URL** → скопируйте в `VITE_SUPABASE_URL` (например `https://xxxx.supabase.co`).
   - **Project API keys**:
     - используйте **anon** / **publishable (public)** ключ → `VITE_SUPABASE_ANON_KEY`.
3. **Не** копируйте в env фронтенда секреты из других разделов (см. §5).

## 5. Что нельзя класть во frontend (и в Vercel env для клиентской сборки)

| Секрет | Почему |
|--------|--------|
| `service_role` | Обходит RLS, полный доступ к БД — **только** на доверенном бэкенде. |
| Пароль БД (database password) | Только для прямого подключения к Postgres, не в браузер. |
| `JWT` secret (legacy / custom) | Секрет подписи, не в клиент. |
| Любой ключ с пометкой **secret** / **service** | В клиенте не оказывается. |

В репозитории держите пример в **`.env.example`**, локально — **`.env.local`**, который **в git не коммитится** (см. `.gitignore`).

## 6. Подключение репозитория GitHub к Vercel

1. [vercel.com](https://vercel.com) → **Log in** (удобно через GitHub).
2. **Add New… → Project** → **Import** нужный репозиторий.
3. Подтвердите доступ Vercel к репо (one-time), выберите ветку по умолчанию (часто `main` / `master`).

## 7. Build settings (рекомендуемые)

| Параметр | Значение |
|----------|----------|
| Framework Preset | **Vite** (или «Other» с командами ниже) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node | по умолчанию LTS, при необходимости зафиксировать в `package.json` → `engines` (опционально) |

Корень проекта — там, где лежат `package.json` и `vite.config.*`.

## 8. Добавление env variables в Vercel

1. Проект в Vercel → **Settings → Environment Variables**.
2. Добавьте:
   - `VITE_SUPABASE_URL` — URL из Supabase.
   - `VITE_SUPABASE_ANON_KEY` — anon / publishable ключ.
3. Включите нужные **окружения**:
   - **Production** — основной production URL;
   - **Preview** — деплои из PR / других веток;
   - **Development** — `vercel dev` (если используете).
4. Сохраните и **заново задеплойте** проект (Redeploy), чтобы новые переменные попали в сборку.

> Без `VITE_*` в env production-сборка не подключит Supabase: возможен «белый экран» или страница «Supabase не настроен».

## 9. Технический URL после деплоя

После успешного деплоя Vercel выдаёт URL вида **`https://<project-name>.vercel.app`** (и при необходимости веткозависимые preview URL). Их нужно **скопировать** для настройки Supabase Auth (§10).

## 10. Supabase: Auth — URL Configuration

После появления **production** URL:

1. Supabase → **Authentication → URL Configuration**:
   - **Site URL**: например `https://your-app.vercel.app` (главный URL продукта).
2. **Redirect URLs** (добавьте по одной строке, свои значения):
   - `https://your-app.vercel.app`
   - `https://your-app.vercel.app/**` (если в UI Supabase требуется wildcard — ориентируйтесь на подсказки панели)
   - `https://your-app.vercel.app/auth` (если используется явный маршрут входа/редирект)
   - Для разработки оставьте, например: `http://localhost:5173` и при необходимости `http://localhost:5173/**`

Сохраните. Неверные redirect URL часто ломают **OAuth/redirect** после логина в production.

## 11. Проверка production (чек-лист)

1. Открыть **Vercel production URL** в браузере.
2. Должна открываться **страница входа** (Auth), если сессии нет.
3. **Войти** (email/password или ваш способ).
4. Дождаться **загрузки cloud state** (без бесконечного лоадера).
5. **Обновить страницу (F5)** — сессия и данные должны подтянуться.
6. Создать **тестовую задачу** (или сущность в вашем сценарии) и убедиться, что **сохраняется** (Supabase, индикатор «Сохранено» в сайдбаре при настроенном cloud save).
7. **Save status** (индикатор в сайдбаре) — при операциях не должно залипать в ошибке без причины.

## 12. Белый экран после деплоя

1. **DevTools → Console** — ошибки `import`, `404` на `assets`, `undefined` env.
2. **Vercel → Deployments → Build Logs** — упала ли сборка / не те env.
3. **Settings → Environment Variables** — заданы ли `VITE_SUPABASE_*` для **Production** и сделан ли **Redeploy** после правок.
4. **Network** — нет ли 404 на `*.js` / `*.css` (тогда смотрите `base` в Vite и путь к статике).
5. **Supabase redirect** — если падает только после auth (см. §10).

## 13. Не работает login

1. **Authentication → URL Configuration** (Site URL, Redirect URLs) — production URL и `/auth` при необходимости.
2. **Email confirmation** — если в проекте включено подтверждение email, пользователь должен подтвердить почту.
3. CORS/redirect: снова **Redirect URLs** и точный `Site URL` без опечаток.

## 14. Данные не грузятся

1. **RLS** — политики не должны блокировать `select` для `auth.uid() = user_id`.
2. В таблицах **user_id** должен совпадать с текущим пользователем.
3. **Network** — ответы Supabase REST, коды 401/403/404.
4. **Table Editor** в Supabase — есть ли строки для `user_id` тестового пользователя.

## 15. Rollback (откат)

В **Vercel → Deployments** выберите предыдущий успешный деплой → **… → Promote to Production** (или **Instant Rollback** в зависимости от UI). Откат быстрый, без git revert.

## 16. Security checklist (перед/после go-live)

- [ ] В клиенте и в Vercel **нет** `service_role`, пароля БД, JWT secret.
- [ ] **`.env.local` не в git**; секреты не в публичных issues.
- [ ] В Supabase **RLS включён** на пользовательских таблицах; **policies** на свои строки.
- [ ] **Production URL** (и при необходимости preview) добавлены в **Supabase Auth** redirect.
- [ ] Anon key — только **публичный** ключ, как в **Project Settings → API**.

## 17. Open questions / дальше

- Собственный **домен** (CNAME в Vercel, обновить Site URL / Redirect в Supabase).
- **Cloudflare Pages** (или иной static host) как альтернатива — отдельная настройка rewrites/headers.
- **Транзакционный** импорт в облако (например, через **RPC** в Postgres) — отдельный этап.
- **PWA / mobile** — отдельный этап.

---

*Документ относится к этапу «21.11: Deploy to Vercel — Production Hosting Setup».*
