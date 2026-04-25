# Auth + Cloud + Hosting Architecture Plan

## 1. Цель документа

Настоящий документ фиксирует архитектуру следующего крупного этапа развития **Life Progress OS**: переход от локального веб‑приложения с основным хранилищем в `localStorage` к полноценному облачному веб‑приложению, доступному с любого устройства.

**Что делаем дальше (целевое состояние):**

- Пользователь открывает приложение в браузере (сначала с технического URL), входит в аккаунт.
- Данные пользователя хранятся в облачной реляционной базе, а не как единый JSON в `localStorage`.
- `localStorage` **перестаёт быть источником истины** для сущностей (цели, проекты, группы, задачи, привычки, вехи) и остаётся **только** для UI‑настроек и локальных предпочтений, где это оправдано.
- Остаётся **веб‑приложение** (Vite + React + TypeScript); **нативные** desktop/mobile оболочки в этом плане **не** рассматриваются.
- **PWA** и расширенный mobile web UX — **отдельные будущие** этапы (см. раздел 17).

Текущая кодовая база (в т.ч. `AppState` v2, миграции, Goals) **не** меняется в рамках только этого документа: здесь — архитектурные решения на будущее.

---

## 2. Итоговая целевая архитектура

**Frontend**

- Vite + React + TypeScript (текущий стек сохраняется).
- **Hosting:** [Vercel](https://vercel.com) **или** [Cloudflare Pages](https://pages.cloudflare.com) — окончательный выбор на этап 21.11 (см. открытые вопросы).
- На старте — **технический URL** (например, `*.vercel.app` или `*.pages.dev`), **без** обязательного собственного домена.
- Кастомный домен — позже, после стабилизации deploy и настроек Auth.

**Auth**

- **Supabase Auth** (логин/регистрация, сессия).
- Первый вариант: **email + password**.
- **Google OAuth** (и при необходимости другие провайдеры) — **позже**, отдельным этапом.
- **Protected routes:** всё основное приложение доступно только после успешной аутентификации (см. раздел 8).

**Database**

- **Supabase PostgreSQL** (managed).
- **Нормализованные таблицы** (см. раздели 5–6), **не** «один JSON на пользователя» как конечная модель.
- **Row Level Security (RLS):** у каждой пользовательской строки — `user_id`; политики на чтение/запись только «свои» данные.
- `user_id` на всех сущностях, относящихся к данным пользователя.

**Хранение**

- **Источник истины** для бизнес‑данных: PostgreSQL.
- `localStorage`: только **UI preferences** / локальный кэш, не смысл приложения (см. раздел 9).

**Схема использования (упрощённо)**

1. Пользователь открывает Life Progress OS по **техническому URL** deploy.
2. Проходит **Supabase Auth** (логин/регистрация).
3. Клиент с **anon key** запрашивает данные из PostgreSQL; **RLS** ограничивает выдачу строк текущему `auth.uid()`.
4. Изменения (создание/обновление задачи и т.д.) пишутся **в нормализованные таблицы**.
5. На другом устройстве после входа **те же** данные подтягиваются из БД.

---

## 3. Почему не Selectel / VPS на текущем этапе

**Для доступа с любого устройства** достаточно:

- публично размещённого **frontend** (статика + SPA);
- **облачной аутентификации**;
- **облачной** базы данных с API к ней.

**VPS (Selectel и аналоги)** уместен, если требуется:

- полностью **свой** backend;
- **свой** PostgreSQL и администрирование;
- Docker, Nginx, кастомная сеть, полный контроль над инфраструктурой.

**На старте** рациональнее **managed**‑стек:

| Слой | Вариант |
|------|---------|
| Frontend | Vercel или Cloudflare Pages |
| Auth + API к БД + PostgreSQL | Supabase |

**Причины:**

- быстрее выйти в прод для личного/узкого круга пользователей;
- меньше **DevOps**;
- **HTTPS** из коробки у хостинга;
- удобный **deploy из Git**;
- **Auth, БД, RLS** в одной экосистеме.

VPS не исключён **навсегда** — это возможный вариант при росте требований, но **не** обязателен для «войти с телефона и с ноутбука».

---

## 4. Почему не AppState JSONB как финальная модель

**Вариант A — `app_state JSONB` на пользователя**

| Плюсы | Минусы |
|--------|--------|
| Быстро внедрить MVP | Крупный документ на каждое мелкое изменение (например, одна задача) |
| Близко к текущему `AppState` | Хуже масштабирование и аналитика на сервере |
| Один `UPDATE` вместо многих джоинов | Сложнее поиск, индексы по полям внутри JSON, частичные обновления в конкурентных сценариях |
| | Сложнее сценарии совместной работы в будущем |
| | Синхронизация с мобильным клиентом громоздче |

**Вариант B — нормализованная схема PostgreSQL**

| Плюсы |
|--------|
| Каждая сущность — отдельные строки; обновление задачи = одна строка в `tasks` |
| Предсказуемая модель для индексов, отчётов, поиска |
| Естественный путь к аналитике и к будущему нативному/PWA-клиенту |
| Проще контроль целостности (FK) и RLS по строкам |

**Решение для Life Progress OS:** целевая архитектура данных — **нормализованная PostgreSQL**, а **не** хранение полного `AppState` в одном JSONB как **финальная** модель. JSONB внутри отдельных полей (например, `user_settings`) допустим точечно, но не как замена нормализации всего домена.

---

## 5. Нормализованная модель данных

| Таблица | Назначение |
|--------|------------|
| `profiles` | Профиль пользователя, связь с `auth.users`, отображаемое имя и т.д. |
| `goals` | Верхний уровень Life Progress OS; аналог текущей сущности `Goal`. |
| `projects` | Проекты внутри цели; ссылка на `goal_id`. |
| `project_groups` | Группы задач внутри проекта. |
| `tasks` | Задачи внутри групп. |
| `habits` | Привычки; на первом cloud‑этапе могут оставаться **глобальными** (только `user_id`). |
| `habit_logs` | Факты выполнения привички по датам. |
| `milestones` | Вехи; сначала **project-level**; позже возможно goal-level. |
| `user_settings` | Синхронизируемые между устройствами настройки (виджеты, видимость статов и т.д.). |

**Примечания:**

- Часть «UI только локально» может остаться в `localStorage` (см. раздел 9).
- Соответствие текущему `AppState` v2 — через **маппинг** и **миграционные** скрипты, не через копипасту JSON в прод как единственный источник.

---

## 6. Черновик SQL-схемы

Ниже — **черновик** полей; типы и ограничения уточняются на этапе 21.2.

**`profiles`**

- `id` — `uuid`, PK, `references auth.users(id)`
- `email` — `text` (копия/синхронизация с auth — по политике Supabase)
- `display_name` — `text`
- `created_at` — `timestamptz`
- `updated_at` — `timestamptz`

**`goals`**

- `id` — `uuid`, PK
- `user_id` — `uuid`, `references auth.users(id)` — **и для RLS**
- `title` — `text not null`
- `description` — `text`
- `target_date` — `date`
- `status` — `text not null` (ограничение: active / later / archived)
- `show_on_dashboard` — `boolean not null default true`
- `created_at` / `updated_at` — `timestamptz`

**`projects`**

- `id` — `uuid`, PK
- `user_id` — `uuid`
- `goal_id` — `uuid`, `references goals(id)`
- `title` — `text not null`
- `description` — `text`
- `stat_type` — `text` (аналог `CharacterStatType`)
- `phase` — `text`
- `target_date` — `date`
- `show_on_dashboard` — `boolean not null default true`
- `created_at` / `updated_at` — `timestamptz`

**`project_groups`**

- `id` — `uuid`, PK
- `user_id` — `uuid`
- `project_id` — `uuid`, `references projects(id)`
- `title` — `text not null`
- `sort_order` — `integer`
- `created_at` / `updated_at` — `timestamptz`

**`tasks`**

- `id` — `uuid`, PK
- `user_id` — `uuid`
- `project_id` — `uuid`, `references projects(id)`
- `group_id` — `uuid`, `references project_groups(id)`
- `title` — `text not null`
- `completed` — `boolean not null default false`
- `deadline` — `date`
- `notes` — `text`
- `priority` — `text`
- `sort_order` — `integer`
- `created_at` / `updated_at` — `timestamptz`

**`habits`**

- `id` — `uuid`, PK
- `user_id` — `uuid`
- `title` — `text not null`
- `description` — `text`
- `schedule` — `jsonb` (если появится формализованный график; иначе nullable)
- `created_at` / `updated_at` — `timestamptz`

**`habit_logs`**

- `id` — `uuid`, PK
- `user_id` — `uuid`
- `habit_id` — `uuid`, `references habits(id)`
- `date` — `date not null`
- `completed` — `boolean not null default false`
- `created_at` / `updated_at` — `timestamptz`
- (опционально) уникальность `(habit_id, date)`.

**`milestones`**

- `id` — `uuid`, PK
- `user_id` — `uuid`
- `project_id` — `uuid`, `references projects(id)`
- `title` — `text not null`
- `target_date` / `date` в зависимости от семантики
- `completed` — `boolean not null default false`
- `created_at` / `updated_at` — `timestamptz`

**`user_settings`**

- `user_id` — `uuid` PK, `references auth.users(id)`
- `settings` — `jsonb not null` (например, структура, совместимая с текущими dashboard widgets / stat visibility)
- `updated_at` — `timestamptz`

**Идентификаторы в клиенте:** сейчас во многих местах `string`. В БД **предпочтительны `uuid`**. Потребуется **mapper** «строка/UUID в TS ↔ row в БД» и план миграции id при переносе (этап 21.2 / 21.8).

---

## 7. Row Level Security (RLS)

**Принцип:** у каждой «пользовательской» таблицы есть `user_id` (прямо или через родителя; для `tasks` / `project_groups` удобно дублировать `user_id` для простых политик).

**Базовое правило (идея):** пользователь может `SELECT/INSERT/UPDATE/DELETE` только строки, где

`user_id = auth.uid()`

(для `profiles` — где `id = auth.uid()`).

**Таблицы, к которым применяется RLS (минимум):** `goals`, `projects`, `project_groups`, `tasks`, `habits`, `habit_logs`, `milestones`, `user_settings`, `profiles` (с уточнёнными политиками на insert/update).

**Безопасность:**

- Во **frontend** — только **anon (public) key**; запросы идут с JWT пользователя после логина.
- **Service role** key **нельзя** встраивать в клиент; только сервер/Edge Functions/админ-скрипты, если появятся.
- **Доверие к БД** через RLS, а не к «скрытым» фильтрам только в React.

---

## 8. Auth UX

**Не авторизован:**

- Показ **страницы входа/регистрации** (`AuthPage` или маршрут `/login`).
- Email + password, обработка ошибок, `loading` при отправке.
- (Позже) «Войти через Google».

**Авторизован:**

- Основной **AppLayout** (как сейчас по структуре роутов).
- Загрузка данных из Supabase (с индикаторами).
- **Выход** (sign out) из сессии.

**Состояния (концептуально):**

- загрузка сессии / проверка токена;
- `unauthenticated` / `authenticated`;
- загрузка данных;
- ошибка загрузки;
- сохранение: `saving` → `saved` или `error`.

**Маршрутизация:** защищённые маршруты закрывают **всё** приложение, кроме публичных (Auth, legal при необходимости).

---

## 9. Что остаётся в localStorage

После перехода на cloud **нельзя** считать `localStorage` местом жизни **goals / projects / groups / tasks / habits / milestones**.

**Допустимо** хранить локально (по согласованию на этапе 21.8+):

- `selectedGoal` (уже `canada-progress-os-selected-goal` и смысловой scope `all` / goal id)
- `selectedProject`
- `sidebarCollapsed`
- настройки виджетов / видимости статов — **либо** в `user_settings` в БД, **либо** локально (решение в открытых вопросах)
- режим сворачивания групп проекта и «запомненные» collapse‑состояния

**Совместимость:** существующие ключи `canada-progress-os-*` **намеренно не переименовывать** в коде, пока нет миграции; это снижает риск для уже сохранённых данных.

---

## 10. Repository / API layer

**Правило:** React‑компоненты **не** вызывают `supabase.from(...)` напрямую (кроме редких исключений, которые лучше не вводить).

**Предпочтительная структура:**

- `src/shared/api/` **или** `src/features/<domain>/api/`

**Примеры модулей:**

- `goalsRepository`, `projectsRepository`, `projectGroupsRepository`, `tasksRepository`
- `habitsRepository`, `milestonesRepository`, `userSettingsRepository`

Компоненты и страницы работают через **hooks** / **use cases** / существующий **dispatch** (после рефакторинга) поверх repository.

**Зачем:** смена backend, тесты, единообразные ошибки, опционально optimistic UI без размазанной логики по view.

---

## 11. Что делать с текущим AppStateProvider

**Сейчас:** единый `AppState` + `localStorage` как persistence.

**Варианты после cloud:**

| Подход | Суть |
|--------|------|
| **A** | Сохранить **reducer** как клиентский кэш, но **запись** в БД вместо полного снимка в `localStorage` |
| **B** | Постепенно заменить монолит на **hooks** по сущностям (React Query / собственные подписки) |

**Рекомендуемый путь:** не ломать всё сразу: начальная загрузка из Supabase → заполнение client state; мутации через repository → обновление state; позже — декомпозиция `AppStateProvider`.

---

## 12. Import / export JSON после cloud

**Export:** собрать снимок из таблиц пользователя в формат, **совместимый** с существующим импортом (идея — «AppState‑подобный» JSON для backup.

**Import:** пользователь в аккаунте выбирает файл → валидация через **существующие** `sanitize` / `migrate` → **раскладка** по таблицам.

**На первом этапе** проще **replace** с явным подтверждением («текущие облачные данные будут заменены»), чем сложный merge. Merge — открытый вопрос (см. раздел 19).

---

## 13. Hosting strategy

- **Frontend:** Vercel **или** Cloudflare Pages.
- **Сначала** технический URL, например:
  - `life-progress-os.vercel.app`
  - или `*.pages.dev`
- **Домен** подключается позже: DNS + кастомный hostname у хостинга + **обновление Redirect URLs** в Supabase Auth.

**Почему не нужен сразу домен:** для личного использования и доверия к стеку достаточно HTTPS на техническом URL; смена домена не требует переписывания приложения (только env и Supabase настройки).

**Desktop/mobile shell** (Capacitor, Tauri и т.д.) **не** входит в этот план: сначала стабильный **cloud web app**.

---

## 14. Deployment environments

| Окружение | Описание |
|-----------|----------|
| **Local** | `http://localhost:5173` (Vite); Supabase: отдельный dev project **или** один project на ранней фазе (см. вопросы) |
| **Production** | Технический URL фронта + **production** Supabase project (рекомендуется при росте) |

**Переменные (будущие, не создавать в рамке только 21.1):**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Секреты **не** коммитить. Файл `.env.example` — **отдельный этап (21.4)**.

---

## 15. Доступ для 2–3 человек на старте

Архитектура **сразу** production‑like: Supabase Auth + RLS, без «Basic Auth» перед приложением.

Ограничение аудитории:

- не публиковать ссылку публично;
- по возможности отключить открытую регистрацию в Supabase и создать пользователей вручную;
- позже — allowlist email / роли в `profiles`.

---

## 16. Масштабирование

Нормализованная схема плюс индексы по `user_id`, `goal_id`, `project_id`, датам в `tasks` и `habit_logs` даёт:

- дешёвые обновления одной задачи;
- предсказуемые запросы аналитики;
- подготовку к мобильным клиентам и (при необходимости) collaboration.

**Ориентиры индексов:** `goals(user_id)`, `projects(user_id, goal_id)`, `project_groups(project_id)`, `tasks(user_id, project_id, group_id)`, `tasks(deadline)`, `habits(user_id)`, `habit_logs(user_id, date)`, `milestones(user_id, project_id)`.

---

## 17. Mobile / PWA (связь с планом)

- **Сейчас:** не нативное приложение; фокус на **облачном вебе**.
- Порядок (логичный):
  1. Cloud web + Auth + БД
  2. Адаптивный mobile web
  3. PWA
  4. Нативные оболочки — только при необходимости

Связь с планом продукта: **22.x** — Mobile Web UX, **22.9** — PWA (условные номера этапов).

---

## 18. План внедрения (этапы 21.x)

| Этап | Содержание |
|------|------------|
| **21.1** | Auth + Cloud + Hosting Architecture Plan (этот документ) |
| **21.2** | Детальный план SQL‑схемы, RLS, индексов, маппинга к TypeScript |
| **21.3** | Документация настройки Supabase (проект, SQL, RLS, Auth, redirect URL) |
| **21.4** | Клиент Supabase + `env` + `.env.example` (без смены UI) |
| **21.5** | `AuthProvider`, `AuthPage`, sign in / up / out |
| **21.6** | Protected app для неаутентифицированных |
| **21.7** | Repository layer |
| **21.8** | Перенос persistence целей/проектов/задач/привычек/вех/настроек в Supabase |
| **21.9** | Импорт JSON в cloud (replace + подтверждение) |
| **21.10** | UX: loading, save, retry, ошибки |
| **21.11** | Hosting: Vercel или Cloudflare Pages, технический URL |

---

## 19. Открытые вопросы

1. **Vercel** или **Cloudflare Pages** для фронтенда?
2. Один Supabase project на всё **или** раздельно dev/prod?
3. Публичная регистрация **или** только приглашённые/созданные вручную пользователи?
4. Достаточно email/password **или** сразу нужен **Google OAuth**?
5. Какие настройки в **`user_settings`**, а какие оставить в `localStorage`?
6. Import JSON: **replace** vs **merge**?
7. Нужен ли **offline** и как его моделировать?
8. **Optimistic updates** в первом cloud‑релизе?
9. Когда вводить **PWA**?
10. Когда покупать **домен**?
11. Поддерживать ли **legacy** режим «только localStorage» параллельно с cloud?
12. Как оформить **export** из cloud в AppState‑совместимый JSON (формат, версия)?

---

## 20. Проверки после появления документа

Код **не** меняется; ожидается успешное выполнение:

- `npm run build`
- `npm run lint`

(проверки запускаются в репозитории после добавления файла `docs/auth-cloud-architecture-plan.md`).
