# Database Schema Plan

## 1. Цель документа

Настоящий документ фиксирует **целевую нормализованную схему PostgreSQL** для развёртывания **Life Progress OS** на **Supabase** (Auth + Database + RLS).

**Зафиксировано:**

- приложение переходит от единого `AppState` в `localStorage` к **облачной** базе данных;
- данные пользователя хранятся в **нормализованных таблицах**, а не как один JSONB «весь AppState на пользователя»;
- у каждой пользовательской сущности, которую изолирует RLS, есть связь с **`user_id`** (через прямой столбец и/или однозначно выводимый из владельца родителя);
- **безопасность** обеспечивается **Row Level Security (RLS)** в PostgreSQL, опираясь на `auth.uid()`;
- **TypeScript-типы фронтенда** (camelCase) и **строки БД** (snake_case) сопоставляются через **mapper** в **repository / API** слое;
- этот документ — **план схемы** перед этапом настройки Supabase и написанием **реального SQL**; **не** является готовой executable migration.

См. также: `docs/auth-cloud-architecture-plan.md` (блок 21.1).

---

## 2. Основные принципы схемы

1. **`auth.users`** — единственный источник учётных записей (Supabase Auth).
2. **`profiles.id`** ссылается на **`auth.users.id`** (1:1).
3. Все **пользовательские** таблицы из списка §3 содержат **`user_id uuid not null`**, ссылающийся на **`auth.users(id)`** (кроме `user_settings`, где PK = `user_id`), для единообразных RLS-политик.
4. Все **персональные** данные защищены **RLS**: по умолчанию доступ только к строкам, где **`user_id = auth.uid()`** (см. §13, исключения для `profiles`).
5. Первичные ключи сущностей — **`uuid`** (генерация: см. открытые вопросы в §19).
6. **Даты без времени** (дедлайн задачи, целевая дата цели) — тип **`date`** (и ISO-строка `YYYY-MM-DD` в JSON/AppState).
7. **Временные метки** — **`timestamptz`**, `created_at` / `updated_at` с `default now()` (на бою — при необходимости триггеры `updated_at`).
8. **Порядок** вложенных списков (группы в проекте, задачи в группе) — **`sort_order integer`** (в AppState v2: `order` у группы; порядок задач в массиве можно отразить в `sort_order`).
9. **Мягкое удаление** (`deleted_at`) **на первом cloud-этапе не вводится** — по необходимости отдельный этап (открытый вопрос §19).
10. **Основной домен** не кладётся в один большой **JSONB AppState** на пользователя.
11. **JSONB** допустим **точечно**: `user_settings.settings`, опционально `habits.schedule`; не как замена нормализации всего графа сущностей.

---

## 3. Список таблиц

| Таблица | Назначение |
|--------|------------|
| **`profiles`** | Публично/служебно значимый профиль пользователя, привязанный к `auth.users`. |
| **`goals`** | Крупные жизненные цели (аналог `Goal` во фронтенде). |
| **`projects`** | Проекты внутри цели (аналог `Project` с `goal_id`). |
| **`project_groups`** | Группы задач внутри проекта (аналог `TaskGroup`). |
| **`tasks`** | Задачи внутри групп (аналог `Task`). |
| **`habits`** | Привычки пользователя (аналог `Habit`); на первом этапе UI может оставлять привычки «глобальными» по смыслу, без обязательного `goal_id` / `project_id`. |
| **`habit_logs`** | Выполнение привычки в конкретный день; замена `Habit.dailyStatus` в виде key-value в одной записи. |
| **`milestones`** | Вехи; в AppState v2 в основном **привязка к проекту** (`project_id`); goal-level — расширение на будущее. |
| **`user_settings`** | Настройки, которые **нужно синхронизировать** между устройствами; подмножество того, что сейчас в `AppSettings` + тяжёлые UI-флаги по решению продукта. |

---

## 4. Таблица `profiles`

**Назначение:** хранит данные профиля, **не** пароль и не секреты Auth.

**Поля (черновик):**

| Колонка | Тип | Описание |
|--------|-----|----------|
| `id` | `uuid` | PK, **`references auth.users(id) on delete cascade`** |
| `email` | `text` | Копия/отображаемая почта; синхронизация с `auth.users` — политикой/триггерами Supabase (уточнить в 21.3) |
| `display_name` | `text` | Отображаемое имя |
| `created_at` | `timestamptz` | `not null default now()` |
| `updated_at` | `timestamptz` | `not null default now()` |

**RLS (идея):**

- `SELECT` / `UPDATE` только для **`id = auth.uid()`**;
- `INSERT` — один раз (при первом входе) или **через trigger** после регистрации (варианты в §19).

**Открытый вопрос:** создавать строку `profiles` **автоматически** после signup (триггер) или **lazy** при первом запросе из приложения.

---

## 5. Таблица `goals`

**Соответствие фронтенду:** тип **`Goal`**, `GoalStatus`.

**Поля (черновик):**

| Колонка | Тип | Описание |
|--------|-----|----------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `title` | `text` | `not null` (непустой title после trim — на уровне приложения) |
| `description` | `text` | |
| `target_date` | `date` | Аналог `targetDate` (date-only) |
| `status` | `text` | `not null` — в БД: **`check`**: `status in ('active', 'later', 'archived')`** (см. `GoalStatus`) |
| `show_on_dashboard` | `boolean` | `not null default true` — аналог `showOnDashboard` |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()` |

**Mapping:** `targetDate` ↔ `target_date`, `showOnDashboard` ↔ `show_on_dashboard`.

**Delete behavior:**

- при удалении **пользователя** — цели удаляются **cascade** вместе с `user_id`;
- **бизнес-логика:** предпочтительно **архивирование** (`status = 'archived'`), а не `DELETE`.
- физическое удаление `goal` конфликтует с `projects.goal_id`: в §6 для `projects` заложен **`on delete restrict`**; тогда `DELETE` из `goals` без переноса/удаления проектов **запрещён** на уровне FK — что **желательно** для дисциплины: удалять цель только через сценарий «перенос проектов» или **soft** — на будущее.

**Рекомендация на первом cloud-релизе:** не удалять `goals` физически; только `UPDATE status`.

**Индексы (рекомендации):**

- `goals(user_id)`
- `goals(user_id, status)`
- `goals(user_id, target_date)` (если много выборок по дате)

---

## 6. Таблица `projects`

**Соответствие фронтенду:** тип **`Project`**, вложенные `groups` хранятся в других таблицах.

**Поля (черновик):**

| Колонка | Тип | Описание |
|--------|-----|----------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `goal_id` | `uuid` | `not null references goals(id) on delete restrict` |
| `title` | `text` | `not null` |
| `description` | `text` | |
| `stat_type` | `text` | nullable; соответствует **`CharacterStatType`** (список в `appState.types.ts` / `src/shared/lib/characterStats.ts` — **сверить перед SQL**) |
| `phase` | `text` | nullable; в текущем коде **`ProjectPhase`**: **`'active' | 'later' | 'strategic'`** (не `now` / `strategy` — **это важно сверить** с UI и seed) |
| `target_date` | `date` | |
| `show_on_dashboard` | `boolean` | `not null default true` |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()` |

**Constraints:**

- `phase`: либо `check (phase in ('active','later','strategic') or phase is null)`, либо **PostgreSQL enum** — открытый вопрос §19.
- `stat_type`: `check` по допустимым значениям **или** отдельный **enum** в БД.

**Delete behavior:**

- `on delete restrict` на `goals` — **нельзя** удалить цель, пока есть проекты (согласуется с рекомендацией «не удалять цели физически»);
- при удалении **пользователя** — проекты уходят **cascade** вместе с `user_id`;
- при удалении **проекта** — `project_groups` / `tasks` (см. §7–8) — **cascade** с родителем `project_id`.

**Индексы:** см. §14.

---

## 7. Таблица `project_groups`

**Соответствие фронтенду:** `TaskGroup` (поле `order` → `sort_order` в БД).

**Поля (черновик):**

| Колонка | Тип | Описание |
|--------|-----|----------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `project_id` | `uuid` | `not null references projects(id) on delete cascade` |
| `title` | `text` | `not null` |
| `sort_order` | `integer` | `not null default 0` — аналог `order` |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()` |

**Индексы:** `project_groups(project_id, sort_order)` и пр. (§14).

---

## 8. Таблица `tasks`

**Соответствие фронтенду:** `Task` — поля `notes`, `priority` **есть** в `appState.types.ts`; в схеме их нужно включить.

**Поля (черновик):**

| Колонка | Тип | Описание |
|--------|-----|----------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `project_id` | `uuid` | `not null references projects(id) on delete cascade` |
| `group_id` | `uuid` | `not null references project_groups(id) on delete cascade` |
| `title` | `text` | `not null` |
| `completed` | `boolean` | `not null default false` |
| `deadline` | `date` | |
| `notes` | `text` | |
| `priority` | `text` | nullable; `check` в `('low','medium','high')` по **`TaskPriority`** |
| `sort_order` | `integer` | `not null default 0` — порядок внутри группы |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()` |

**Дублирование `project_id`:** `group_id` логически однозначно определяет проект через `project_groups.project_id`, но **`project_id` в `tasks`** ускоряет выборки «все задачи проекта» и дашборды. **Консистентность** (`tasks.project_id` = `project_groups.project_id` для данной `group_id`) — обязанность **repository** или **триггера** (открытый вопрос §19).

**Индексы:** §14.

---

## 9. Таблица `habits`

**Текущий фронтенд:** `Habit` с полями `name` (не `title`), `description`, `dailyStatus` — в БД `dailyStatus` **не** дублируем в `habits`, а переносим в **`habit_logs`**.

**Поля (черновик, расширенно по плану 21.1):**

| Колонка | Тип | Описание |
|--------|-----|----------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `title` | `text` | `not null` — **маппинг** с `Habit.name` |
| `description` | `text` | |
| `schedule` | `jsonb` | гибкое будущее расписание; сейчас в AppState нет — может быть `null` |
| `goal_id` | `uuid` | **nullable**, `references goals(id) on delete set null` — **опционально** с первой же миграции, UI может не заполнять |
| `project_id` | `uuid` | **nullable**, `references projects(id) on delete set null` — аналогично |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()` |

**Семантика:** привычка **глобальная**, если `goal_id` и `project_id` оба `null`.

**Открытый вопрос:** вводить `goal_id` / `project_id` **сразу** в схеме (nullable) или **отдельной** миграцией позже (меньше полей, но потом `ALTER`).

---

## 10. Таблица `habit_logs`

| Колонка | Тип | Описание |
|--------|-----|----------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `habit_id` | `uuid` | `not null references habits(id) on delete cascade` |
| `date` | `date` | `not null` — один день |
| `completed` | `boolean` | `not null default false` |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()` |

**Constraint:** **`unique (habit_id, date)`** — не более одной строки на пару привычка+день.

**Миграция с `Habit.dailyStatus`:** для каждой пары `(date, true/false)` — upsert в `habit_logs`.

---

## 11. Таблица `milestones`

**AppState v2:** `Milestone` с `projectId?`, `date`, `title`, `completed`.

**Поля (черновик, нацеленность на goal-level в будущем):**

| Колонка | Тип | Описание |
|--------|-----|----------|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | `not null references auth.users(id) on delete cascade` |
| `goal_id` | `uuid` | nullable, `references goals(id) on delete cascade` |
| `project_id` | `uuid` | nullable, `references projects(id) on delete cascade` |
| `title` | `text` | `not null` |
| `target_date` | `date` | аналог `Milestone.date` (date-only) |
| `completed` | `boolean` | `not null default false` |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()` |

**Constraint (целевой):** **ровно одно** из `goal_id`, `project_id` не null:

```text
check (
  (goal_id is not null and project_id is null) or
  (project_id is not null and goal_id is null)
)
```

**Упрощение для первого релиза:** только **`project_id not null`**, `goal_id` добавить позже — допустимо; тогда `check` проще. Это **открытый вопрос** §19.

**Mapping:** `Milestone.date` → `target_date` (или `date` как имя колонки — на усмотрение SQL; в документе единообразно `target_date` для целей/вех).

---

## 12. Таблица `user_settings`

| Колонка | Тип | Описание |
|--------|-----|----------|
| `user_id` | `uuid` | PK, `references auth.users(id) on delete cascade` |
| `settings` | `jsonb` | `not null default '{}'` — структура совместимая с частью `AppSettings` + dashboard widgets / stat visibility (как в локальных ключах) |
| `created_at` / `updated_at` | `timestamptz` | `not null default now()` |

**Что обычно **не** кладём в `user_settings` (остаётся localStorage / session):**

- `selectedGoal` / `selectedProject`;
- `sidebarCollapsed`;
- чисто **transient** UI.

**Открытый вопрос:** точный **список** полей, которые синхронизируются (§19).

---

## 13. RLS-модель

**Общий шаблон** для таблиц с `user_id`:

- `SELECT` — `using (auth.uid() = user_id)`
- `INSERT` — `with check (auth.uid() = user_id)`
- `UPDATE` — `using` + `with check` (оба = `user_id`)
- `DELETE` — `using (auth.uid() = user_id)`

**`profiles`:** `using (id = auth.uid())` (и аналогично для update).

**Включение RLS:** `alter table ... enable row level security` для: `goals`, `projects`, `project_groups`, `tasks`, `habits`, `habit_logs`, `milestones`, `user_settings`, `profiles`.

**Пример (псевдо-SQL, не финальный):**

```sql
create policy "goals_select_own"
on goals for select
using (auth.uid() = user_id);

create policy "goals_insert_own"
on goals for insert
with check (auth.uid() = user_id);

create policy "goals_update_own"
on goals for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "goals_delete_own"
on goals for delete
using (auth.uid() = user_id);
```

**Правила безопасности:** во фронтенде только **anon key**; **service role** не вшивать в клиент. Финальные policy и `grant` — этап **21.3**.

---

## 14. Сводка индексов

**`profiles`:** PK = индекс по `id`.

**`goals`:** `user_id`; `(user_id, status)`; `(user_id, target_date)`.

**`projects`:** `user_id`; `goal_id`; `(user_id, goal_id)`; `(user_id, phase)`; `(user_id, stat_type)`; `(user_id, target_date)`; при необходимости `(user_id, show_on_dashboard)`.

**`project_groups`:** `user_id`; `project_id`; `(user_id, project_id)`; `(project_id, sort_order)`.

**`tasks`:** `user_id`; `project_id`; `group_id`; `(user_id, completed)`; `(user_id, deadline)`; `(project_id, completed)`; `(group_id, sort_order)`.

**`habits`:** `user_id`; `(user_id, goal_id)`; `(user_id, project_id)` (если колонки есть).

**`habit_logs`:** `user_id`; `habit_id`; `(user_id, date)`; `(habit_id, date)`; **unique `(habit_id, date)`**.

**`milestones`:** `user_id`; `goal_id`; `project_id`; `(user_id, target_date)`; `(user_id, completed)`.

**`user_settings`:** PK `user_id` достаточно для точечного доступа.

---

## 15. Mapping frontend types ↔ DB rows

**Соглашения:**

- API к БД отдаёт/принимает **snake_case** на уровне DTO, либо ORM-объекты; **UI** работает с **camelCase** как сейчас.
- Маппинг живёт в **repositories** (например, `goalRowToGoal`, `goalToGoalInsert`).

| Frontend | DB / колонка |
|----------|----------------|
| `goalId` | `goal_id` |
| `targetDate` | `target_date` |
| `showOnDashboard` | `show_on_dashboard` |
| `statType` | `stat_type` |
| `order` (группа) | `sort_order` |
| `Habit.name` | `habits.title` (или `name` в БД — **единый выбор** на этапе SQL) |
| `Milestone.date` | `target_date` (или `date`) |

**Правило:** компоненты **не** импортируют сырой `Row` из Postgrest; только доменные типы после маппинга.

---

## 16. Миграция AppState v2 → таблицы БД

**Вход:** валидный `AppState` v2 (из localStorage, экспорта или seed после sanitization/migrate).

**Алгоритм (логический):**

1. Пропустить через существующие **sanitize + migrate** (как при импорте сегодня).
2. **Пользователь** уже в `auth.users` после login; **upsert** `profiles` для `auth.uid()`.
3. Для каждой **goal** → `insert` в `goals` (новые `uuid` или сопоставление **legacy id** — §19).
4. Для каждого **project** → `insert` в `projects` с `goal_id` (обязателен после валидации).
5. Для каждой **TaskGroup** → `insert` в `project_groups` с `sort_order = order`.
6. Для каждой **Task** в группе → `insert` в `tasks` с `project_id`, `group_id`, `sort_order` по индексу в массиве (или существующему порядку).
7. Для каждой **Habit** → `insert` в `habits`; **разнести** `dailyStatus` по дням в `habit_logs`.
8. Для **Milestone** → `insert` в `milestones` с `project_id` (и `user_id`).
9. **Settings:** сопоставимые с облаком части в `user_settings.settings`; остальное/чисто локальное — оставить в браузере.

**Важно:** первый **cloud import** в пользовательскую БД — чаще всего **replace** с **подтверждением** (как в 21.1). Merge — отдельное решение.

**Идентификаторы:** при переходе `string` → `uuid` — стратегия: **новые uuid в БД** + опциональная колонка **`legacy_id text`** в каждой таблице **только для миграции/отладки** — вопрос §19.

---

## 17. Query patterns (типовые сценарии)

- **Дашборд / цель «все»:** `goals` + `projects` + агрегаты задач по `tasks` (или подсчёт на клиенте после загрузки scope).
- **Проекты в цели:** `projects` по `user_id` + `goal_id`.
- **Проект целиком:** `project_groups` + `tasks` по `project_id`.
- **Аналитика:** агрегаты по `tasks`, `projects.target_date`, `habit_logs` за период.
- **Цели (страница):** `goals` + count проектов / задач (через join или view позже).

Часть отчётов на **первом этапе** — на клиенте после загрузки; позже **views / RPC** в Supabase.

---

## 18. Delete / archive — правила

- **Goals:** в приложении **архив**; физическое удаление **не** приоритет; FK `projects → goals` **restrict** стимулирует корректный сценарий.
- **Projects:** удаление каскадом **groups** и **tasks**; в UI — подтверждение.
- **Groups:** каскад на **tasks**.
- **Tasks:** удаление одной строки.
- **Habits:** удаление → **cascade** на `habit_logs`.
- **Milestones:** независимая сущность.
- **Account delete** в Supabase: **cascade** с `auth.users` на все `user_id` (проверить цепочки FK в финальном SQL).

---

## 19. Открытые вопросы перед написанием SQL

1. **Enum в PostgreSQL** для `goals.status`, `projects.phase`, `stat_type`, `task.priority` **или** `text` + `check`?
2. Добавлять **`goal_id` / `project_id` в `habits` сразу** (nullable) или отдельной миграцией?
3. **Milestones:** сразу **xor** goal/project + `check`, или **только `project_id`** в v1 cloud?
4. Оставляем ли **`project_id` в `tasks`** при наличии `group_id`? Триггер проверки согласованности или только repository?
5. Какие настройки в **`user_settings`**, что оставить в **localStorage**?
6. Нужен ли **`deleted_at` (soft delete)**?
7. Нужны ли **`created_by` / `updated_by`**, если владелец всегда один `user_id`?
8. Вводим ли **views/materialized** для прогресса **сразу**?
9. **UUID:** `gen_random_uuid()` в БД по default **или** генерация на клиенте?
10. Стратегия **миграции string id → uuid**: одноразовый mapping, колонка `legacy_id`?
11. **Replace import:** транзакция, порядок delete старых строк пользователя, идемпотентность.
12. **dev/prod** — один проект Supabase на старте или два?
13. Триггер **`updated_at`** на всех таблицах: единый шаблон?

---

## 20. План следующих этапов (связь с roadmap)

| Этап | Содержание |
|------|------------|
| **21.2** | Database Schema Plan (этот документ) |
| **21.3** | Supabase setup: фактические `CREATE TABLE`, RLS, индексы, trigger profiles |
| **21.4** | Supabase client + env (`.env.example`) |
| **21.5** | AuthProvider, AuthPage |
| **21.6** | Protected app |
| **21.7** | Repository layer |
| **21.8** | Перенос данных AppState → БД |
| **21.9** | Import JSON в облако |
| **21.10** | Sync / loading / error UX |
| **21.11** | Hosting (Vercel / Cloudflare Pages) |

---

## 21. Проверки репозитория

После добавления **только** `docs/database-schema-plan.md` ожидается:

- `npm run build` — успех  
- `npm run lint` — успех  

**Исполняемые SQL-файлы миграций в этом этапе не создаются** — см. этап 21.3.
