# Production Launch Checklist

Чеклист фиксирует **текущее состояние** production-окружения Life Progress OS после этапа **21.12** и служит опорой для ручных проверок и планирования.

**Дата фиксации документа:** 26 апреля 2026 г.

---

## 1. Current production status

- Приложение **задеплоено на Vercel** (статический хостинг + CDN).
- **Production URL:** `https://surround-eta.vercel.app`
- **Backend / BaaS:** Supabase (Auth + PostgreSQL + REST).
- **Database:** Supabase **PostgreSQL** (схема `public` с доменными таблицами).
- **Auth:** Supabase Auth — **email / password**.
- **Источник деплоя:** репозиторий **GitHub**, ветка **`main`**.
- **Auto-deploy:** включён — push в `main` запускает production deployment в Vercel.

---

## 2. URLs

### Production

- `https://surround-eta.vercel.app`

### Local

- `http://localhost:5173`

### Supabase (API / Dashboard)

- `https://dlhkkrhtoppjstxtmdiq.supabase.co`

### Важные маршруты приложения

| Маршрут | Назначение (кратко) |
|---------|---------------------|
| `/` | Главная (дашборд) |
| `/auth` | Вход / регистрация |
| `/goals` | Цели |
| `/projects` | Проекты |
| `/routine` | Рутина (привычки) |
| `/analytics` | Аналитика |
| `/settings` | Настройки |

---

## 3. Environment variables

Имена переменных (**значения не документируются** в этом файле).

### Локально (`.env.local`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Vercel (Project → Settings → Environment Variables)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

### Security note

- **`service_role`** — **нельзя** использовать во frontend и в Vite env для клиента.
- **Пароль БД** — **нельзя** во frontend.
- **JWT secret** (и прочие секреты подписи) — **нельзя** во frontend.
- **`.env.local`** — в git **не коммитить** (см. `.gitignore`).

---

## 4. Supabase configuration

### Таблицы в `public`

- `profiles`
- `goals`
- `projects`
- `project_groups`
- `tasks`
- `habits`
- `habit_logs`
- `milestones`
- `user_settings`

### RLS и policies

- **RLS** включён на перечисленных таблицах.
- **Policies** — доступ к своим строкам по `auth.uid()` / `user_id` (см. миграции проекта).

### Auth

- Включён **email/password** (настройки в Supabase Dashboard → Authentication).

### Authentication → URL Configuration

**Site URL**

- `https://surround-eta.vercel.app`

**Redirect URLs** (ожидаемый набор)

- `https://surround-eta.vercel.app`
- `https://surround-eta.vercel.app/auth`
- `http://localhost:5173`
- `http://localhost:5173/auth`

*(При смене production URL обновить Site URL и redirect в Supabase.)*

---

## 5. Vercel configuration

| Параметр | Значение |
|----------|----------|
| Framework | **Vite** |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |

### SPA rewrites (`vercel.json`)

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- Прямые заходы и refresh на вложенных путях (`/projects`, `/settings`, `/auth` и т.д.) отдают SPA.

### Git

- Push в **`main`** → production deployment в Vercel (при включённой интеграции).

---

## 6. Verified production checks

Следующие пункты **отмечены как проверенные** на момент фиксации чеклиста:

- [x] Production homepage открывается.
- [x] Страница Auth открывается.
- [x] Вход (login) работает.
- [x] Сессия Supabase сохраняется между действиями.
- [x] Данные из облака загружаются после входа.
- [x] Seed / импортированные данные видны в UI.
- [x] Прямой маршрут `/projects` открывается (без 404).
- [x] Прямой маршрут `/settings` открывается.
- [x] Прямой маршрут `/auth` открывается.
- [x] Refresh страницы не «теряет» приложение (SPA + сессия).
- [x] Проекты / группы / задачи отображаются.
- [x] В сайдбаре виден **SaveStatusIndicator**.
- [x] Push в GitHub запускает деплой на Vercel.

---

## 7. App functionality checklist

Ручные проверки **на будущее** (регрессия перед релизами / после крупных изменений).

### Auth

- [ ] Регистрация нового пользователя
- [ ] Подтверждение email (если включено в проекте)
- [ ] Вход
- [ ] Выход
- [ ] Refresh будучи залогиненным

### Goals

- [ ] Создание цели
- [ ] Редактирование цели
- [ ] Архивация цели
- [ ] Переключение выбранной цели (GoalSwitcher)

### Projects

- [ ] Создание проекта
- [ ] Редактирование проекта
- [ ] Удаление проекта
- [ ] Фильтрация по выбранной цели

### Groups

- [ ] Создание группы
- [ ] Переименование группы
- [ ] Удаление группы
- [ ] Сворачивание / разворачивание группы

### Tasks

- [ ] Создание задачи
- [ ] Редактирование задачи
- [ ] Переключение выполнения (toggle)
- [ ] Удаление задачи
- [ ] Проверка после refresh

### Habits

- [ ] Создание привычки
- [ ] Редактирование привычки
- [ ] Toggle даты
- [ ] Удаление привычки
- [ ] Проверка после refresh

### Milestones

- [ ] Создание вехи
- [ ] Редактирование вехи
- [ ] Переключение выполнения
- [ ] Удаление вехи

### Settings

- [ ] Смена theme / accentColor (если доступно в UI)
- [ ] Export JSON
- [ ] Import JSON (облачный replace)
- [ ] Убедиться, что **локальные** preferences остаются в localStorage и не переносятся в cloud без решения продукта

---

## 8. Data and backup

- **Import JSON в облако** — режим **replace**, не merge; перед импортом рекомендуется **export backup**.
- **Export JSON** — выгружает текущий **AppState из памяти** (после успешного cloud import — с нормализованными UUID и т.д.).
- **Seed-файл:** `docs/canada-life-progress-seed.json`.
- **Cloud import** нормализует не-UUID идентификаторы в **UUID** для согласованности с БД.

---

## 9. Known risks

1. **Cloud import (replace) не транзакционный.**  
   Если этап удаления в Supabase прошёл, а вставка упала, данные могут оказаться **частично** перезаписанными.  
   **Будущее улучшение:** RPC / транзакция в Postgres.

2. **Optimistic cloud save без полного rollback.**  
   При ошибке сохранения UI может оставаться в оптимистичном состоянии; ошибка отображается в **SaveStatusIndicator**.

3. **Mobile UX** не финализирован; ориентир — **bottom navigation** в следующих этапах.

4. **PWA** пока не включён.

5. **Custom domain** пока не подключён (используется `*.vercel.app`).

6. **Email confirmation / Auth settings** могут потребовать донастройки перед публичным массовым запуском.

---

## 10. Security checklist

- [x] RLS включён на пользовательских таблицах.
- [x] Policies на «свои» строки по `user_id` / `id`.
- [x] Нет `service_role` во frontend.
- [x] Нет пароля БД во frontend.
- [x] `.env.local` в `.gitignore`, не в репозитории.
- [x] Переменные Vercel задаются через dashboard (не хардкод в коде).
- [x] Supabase Redirect URLs включают production и localhost.
- [x] Прямой доступ к строкам ограничен политиками по владельцу.

---

## 11. Deployment workflow

**Схема:** Cursor → GitHub → Vercel → Production

**Шаги:**

1. Изменения в коде / доках в Cursor (или другом редакторе).
2. Локально: `npm run build`
3. Локально: `npm run lint`
4. `git add` только нужных файлов (без `.env.local`, без `node_modules`).
5. `git commit -m "..."` осмысленное сообщение.
6. `git push origin main`
7. Vercel выполняет **auto-deploy** production.
8. Проверка `https://surround-eta.vercel.app` и ключевых маршрутов.

---

## 12. Rollback

### Vercel

- **Dashboard → Deployments** → выбрать предыдущий рабочий deployment → **Promote to Production** / **Rollback** (в зависимости от UI Vercel).

### Данные Supabase

- Автоматического «отката схемы/данных» нет; восстановление — через **резервные копии** (export JSON, бэкапы БД вне приложения) и осознанный re-import при необходимости.

---

## 13. Next roadmap

Вероятные следующие этапы (номера ориентировочные):

- **22.1** — аудит mobile layout  
- **22.2** — bottom navigation  
- **22.3** — доработки mobile dashboard  
- **22.4** — mobile UX проектов / задач  
- **22.5** — PWA setup  

**Дальше по продукту:**

- Custom domain + обновление Auth URL в Supabase  
- Транзакционный cloud import через **RPC**  
- Улучшенный **onboarding** для пустого аккаунта  

---

## 14. Final launch status

**Life Progress OS production v1** развёрнут и пригоден к использованию по адресу:

**https://surround-eta.vercel.app**

Backend и данные пользователей — в проекте Supabase `https://dlhkkrhtoppjstxtmdiq.supabase.co`. Дальнейшие изменения конфигурации и домена фиксировать в этом чеклисте или в отдельном changelog.

---

*Документ: этап 21.12 — Production Launch Checklist.*
