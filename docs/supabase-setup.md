# Supabase Setup

## 1. Цель документа

Этот документ описывает **практическую ручную настройку Supabase** для будущего cloud-этапа Life Progress OS:

- создание Supabase project;
- настройка Auth;
- настройка Redirect URLs;
- создание таблиц;
- включение RLS;
- создание policies;
- создание индексов;
- подготовка env-переменных;
- чеклисты перед реализацией этапов 21.4+.

Важно:

- на этапе 21.3 **код приложения не меняется**;
- Supabase client появится на этапе **21.4**;
- AuthProvider/AuthPage появятся на этапе **21.5**;
- SQL в этом файле — стартовый baseline для ручного выполнения в Supabase SQL Editor.

---

## 2. Создание Supabase project

1. Зайти в [Supabase](https://supabase.com/) и создать новый organization/project (если ещё нет).
2. Нажать **New Project**.
3. Выбрать регион (ближе к пользователям).
4. Задать database password (сохранить в надёжном месте).
5. Дождаться инициализации проекта.
6. Открыть **Project Settings -> API**.
7. Скопировать:
   - **Project URL**
   - **anon public key**

Будущие env-переменные:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Важно по ключам:

- `anon` key можно использовать во frontend;
- `service_role` key **нельзя** использовать во frontend и **нельзя** коммитить в репозиторий.

---

## 3. Auth settings

Минимальная конфигурация на старт:

- **Email/password**: enabled.
- **Email confirmation**:
  - для быстрой разработки можно временно отключить;
  - для production-like режима лучше включить.
- **Google OAuth**: отложить (не обязателен на первом шаге).
- **Public signup**: продуктовый выбор (см. open questions).

Для старта с 2–3 пользователями:

1. Отключить публичную регистрацию и создать пользователей вручную; **или**
2. Временно включить signup, но не публиковать ссылку широко; **или**
3. Включить signup и позже ограничить allowlist/roles.

Рекомендация первого закрытого запуска:

- email/password;
- минимум внешних провайдеров;
- контроль круга пользователей через операционный процесс.

---

## 4. Redirect URLs

Нужно заранее добавить URL для локальной разработки и будущего прод-URL.

Local:

- `http://localhost:5173`

Future technical hosting URL (один из):

- `https://life-progress-os.vercel.app`
- `https://life-progress-os.pages.dev`

Future custom domain:

- `https://app.<domain>`

В Supabase Auth настроить:

- **Site URL**
- **Additional Redirect URLs**

Важно:

- точный production URL будет известен после выбора хостинга;
- после покупки домена redirect URLs нужно обновить.

---

## 5. SQL setup overview

Ниже SQL, который выполняется в **Supabase SQL Editor**.

Рекомендуемый порядок:

1. extensions + helper function;
2. create tables;
3. triggers `updated_at`;
4. indexes;
5. enable RLS;
6. create policies.

Примечания:

- SQL ниже — стартовая схема по `docs/database-schema-plan.md`;
- это не отдельные migration-файлы;
- если SQL обновляется, нужно обновить и этот документ.

---

## 6. SQL: extensions and helper trigger

```sql
create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```

Пояснение:

- `pgcrypto` нужен для `gen_random_uuid()`;
- `set_updated_at()` используется триггерами перед `update`.

---

## 7. SQL: tables

```sql
-- profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  target_date date,
  status text not null default 'active',
  show_on_dashboard boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_status_check
    check (status in ('active', 'later', 'archived'))
);

-- projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete restrict,
  title text not null,
  description text,
  stat_type text,
  phase text,
  target_date date,
  show_on_dashboard boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_phase_check
    check (phase in ('active', 'later', 'strategic') or phase is null)
);

-- project_groups
create table if not exists public.project_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  group_id uuid not null references public.project_groups(id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  deadline date,
  notes text,
  priority text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_priority_check
    check (priority in ('low', 'medium', 'high') or priority is null)
);

-- habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  schedule jsonb,
  goal_id uuid references public.goals(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- habit_logs
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_logs_habit_date_unique unique (habit_id, date)
);

-- milestones
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid references public.goals(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null,
  target_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint milestones_scope_check
    check (
      (goal_id is not null and project_id is null) or
      (goal_id is null and project_id is not null)
    )
);

-- user_settings
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Примечание:

- `tasks.priority` в текущем коде соответствует `low|medium|high`, поэтому `check` добавлен сразу.
- `milestones_scope_check` можно временно ослабить, если на первых данных нужен только `project_id`-режим.

---

## 8. SQL: updated_at triggers

```sql
drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_goals_updated_at on public.goals;
create trigger set_goals_updated_at
before update on public.goals
for each row
execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

drop trigger if exists set_project_groups_updated_at on public.project_groups;
create trigger set_project_groups_updated_at
before update on public.project_groups
for each row
execute function public.set_updated_at();

drop trigger if exists set_tasks_updated_at on public.tasks;
create trigger set_tasks_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

drop trigger if exists set_habits_updated_at on public.habits;
create trigger set_habits_updated_at
before update on public.habits
for each row
execute function public.set_updated_at();

drop trigger if exists set_habit_logs_updated_at on public.habit_logs;
create trigger set_habit_logs_updated_at
before update on public.habit_logs
for each row
execute function public.set_updated_at();

drop trigger if exists set_milestones_updated_at on public.milestones;
create trigger set_milestones_updated_at
before update on public.milestones
for each row
execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row
execute function public.set_updated_at();
```

---

## 9. SQL: indexes

```sql
-- profiles
create index if not exists idx_profiles_id on public.profiles(id);

-- goals
create index if not exists idx_goals_user_id on public.goals(user_id);
create index if not exists idx_goals_user_status on public.goals(user_id, status);
create index if not exists idx_goals_user_target_date on public.goals(user_id, target_date);

-- projects
create index if not exists idx_projects_user_id on public.projects(user_id);
create index if not exists idx_projects_goal_id on public.projects(goal_id);
create index if not exists idx_projects_user_goal on public.projects(user_id, goal_id);
create index if not exists idx_projects_user_phase on public.projects(user_id, phase);
create index if not exists idx_projects_user_stat_type on public.projects(user_id, stat_type);
create index if not exists idx_projects_user_target_date on public.projects(user_id, target_date);

-- project_groups
create index if not exists idx_project_groups_user_id on public.project_groups(user_id);
create index if not exists idx_project_groups_project_id on public.project_groups(project_id);
create index if not exists idx_project_groups_project_sort on public.project_groups(project_id, sort_order);

-- tasks
create index if not exists idx_tasks_user_id on public.tasks(user_id);
create index if not exists idx_tasks_project_id on public.tasks(project_id);
create index if not exists idx_tasks_group_id on public.tasks(group_id);
create index if not exists idx_tasks_user_completed on public.tasks(user_id, completed);
create index if not exists idx_tasks_user_deadline on public.tasks(user_id, deadline);
create index if not exists idx_tasks_project_completed on public.tasks(project_id, completed);
create index if not exists idx_tasks_group_sort on public.tasks(group_id, sort_order);

-- habits
create index if not exists idx_habits_user_id on public.habits(user_id);
create index if not exists idx_habits_user_goal on public.habits(user_id, goal_id);
create index if not exists idx_habits_user_project on public.habits(user_id, project_id);

-- habit_logs
create index if not exists idx_habit_logs_user_id on public.habit_logs(user_id);
create index if not exists idx_habit_logs_habit_id on public.habit_logs(habit_id);
create index if not exists idx_habit_logs_user_date on public.habit_logs(user_id, date);
create index if not exists idx_habit_logs_habit_date on public.habit_logs(habit_id, date);

-- milestones
create index if not exists idx_milestones_user_id on public.milestones(user_id);
create index if not exists idx_milestones_goal_id on public.milestones(goal_id);
create index if not exists idx_milestones_project_id on public.milestones(project_id);
create index if not exists idx_milestones_user_target_date on public.milestones(user_id, target_date);
create index if not exists idx_milestones_user_completed on public.milestones(user_id, completed);

-- user_settings
create index if not exists idx_user_settings_user_id on public.user_settings(user_id);
```

---

## 10. SQL: enable RLS

```sql
alter table public.profiles enable row level security;
alter table public.goals enable row level security;
alter table public.projects enable row level security;
alter table public.project_groups enable row level security;
alter table public.tasks enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.milestones enable row level security;
alter table public.user_settings enable row level security;
```

---

## 11. SQL: RLS policies

```sql
-- profiles
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- goals
drop policy if exists "Users can read own goals" on public.goals;
create policy "Users can read own goals"
on public.goals
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own goals" on public.goals;
create policy "Users can insert own goals"
on public.goals
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own goals" on public.goals;
create policy "Users can update own goals"
on public.goals
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own goals" on public.goals;
create policy "Users can delete own goals"
on public.goals
for delete
using (auth.uid() = user_id);

-- projects
drop policy if exists "Users can read own projects" on public.projects;
create policy "Users can read own projects"
on public.projects
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
on public.projects
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
on public.projects
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
on public.projects
for delete
using (auth.uid() = user_id);

-- project_groups
drop policy if exists "Users can read own project_groups" on public.project_groups;
create policy "Users can read own project_groups"
on public.project_groups
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own project_groups" on public.project_groups;
create policy "Users can insert own project_groups"
on public.project_groups
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own project_groups" on public.project_groups;
create policy "Users can update own project_groups"
on public.project_groups
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own project_groups" on public.project_groups;
create policy "Users can delete own project_groups"
on public.project_groups
for delete
using (auth.uid() = user_id);

-- tasks
drop policy if exists "Users can read own tasks" on public.tasks;
create policy "Users can read own tasks"
on public.tasks
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own tasks" on public.tasks;
create policy "Users can insert own tasks"
on public.tasks
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own tasks" on public.tasks;
create policy "Users can update own tasks"
on public.tasks
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own tasks" on public.tasks;
create policy "Users can delete own tasks"
on public.tasks
for delete
using (auth.uid() = user_id);

-- habits
drop policy if exists "Users can read own habits" on public.habits;
create policy "Users can read own habits"
on public.habits
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own habits" on public.habits;
create policy "Users can insert own habits"
on public.habits
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own habits" on public.habits;
create policy "Users can update own habits"
on public.habits
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own habits" on public.habits;
create policy "Users can delete own habits"
on public.habits
for delete
using (auth.uid() = user_id);

-- habit_logs
drop policy if exists "Users can read own habit_logs" on public.habit_logs;
create policy "Users can read own habit_logs"
on public.habit_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own habit_logs" on public.habit_logs;
create policy "Users can insert own habit_logs"
on public.habit_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own habit_logs" on public.habit_logs;
create policy "Users can update own habit_logs"
on public.habit_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own habit_logs" on public.habit_logs;
create policy "Users can delete own habit_logs"
on public.habit_logs
for delete
using (auth.uid() = user_id);

-- milestones
drop policy if exists "Users can read own milestones" on public.milestones;
create policy "Users can read own milestones"
on public.milestones
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own milestones" on public.milestones;
create policy "Users can insert own milestones"
on public.milestones
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own milestones" on public.milestones;
create policy "Users can update own milestones"
on public.milestones
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own milestones" on public.milestones;
create policy "Users can delete own milestones"
on public.milestones
for delete
using (auth.uid() = user_id);

-- user_settings
drop policy if exists "Users can read own user_settings" on public.user_settings;
create policy "Users can read own user_settings"
on public.user_settings
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own user_settings" on public.user_settings;
create policy "Users can insert own user_settings"
on public.user_settings
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own user_settings" on public.user_settings;
create policy "Users can update own user_settings"
on public.user_settings
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own user_settings" on public.user_settings;
create policy "Users can delete own user_settings"
on public.user_settings
for delete
using (auth.uid() = user_id);
```

Примечание:

- `service_role` key не нужен и не должен участвовать во frontend потоке.

---

## 12. Optional: profile creation strategy

Два рабочих варианта:

### Вариант A: trigger после signup

- после создания пользователя в `auth.users` автоматически создавать `public.profiles`.
- плюс: всегда есть профиль;
- минус: дополнительная SQL-логика и обслуживание триггера.

### Вариант B: lazy-create в приложении

- при первом успешном входе приложение делает upsert `profiles`.
- плюс: проще старт;
- минус: профиль создаётся не в момент signup, а при первом app-flow.

Рекомендация первого шага: **lazy-create** в приложении (этап 21.5/21.7), триггер можно добавить позже.

Опциональный SQL (если захотите trigger):

```sql
-- OPTIONAL, не обязателен на первом этапе
create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (new.id, new.email, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row
execute function public.handle_new_user_profile();
```

---

## 13. Initial user data strategy

После первого входа пользователь может иметь пустую БД — это нормально.

Варианты:

1. Создавать пустой набор данных (минимализм).
2. Автоматически создавать default goal `Канада`.
3. Предлагать импорт seed JSON.
4. Предлагать импорт backup JSON.

Рекомендация на первом cloud-шаге:

- не создавать много данных автоматически;
- корректные empty states в UI;
- импорт JSON реализовать позже (этапы 21.8/21.9).

---

## 14. Data migration from AppState JSON

На этапе 21.3 миграция **не реализуется**, только фиксируется маппинг:

- `AppState.goals` -> `goals`
- `AppState.projects` -> `projects`
- `project.groups` -> `project_groups`
- `group.tasks` -> `tasks`
- `AppState.habits` -> `habits`
- `habit.dailyStatus` -> `habit_logs`
- `AppState.milestones` -> `milestones`
- `AppState.settings` / UI settings -> `user_settings` или `localStorage` (по решению)

Реальная реализация миграции: этапы **21.8 / 21.9**.

---

## 15. Environment variables

Будущие env-переменные:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Важно:

- `.env` не коммитить;
- `.env.example` будет добавлен на этапе 21.4;
- `service_role` key не использовать во frontend.

---

## 16. Local development checklist

- [ ] Supabase project создан.
- [ ] SQL schema выполнена в SQL Editor.
- [ ] RLS включён на пользовательских таблицах.
- [ ] RLS policies созданы.
- [ ] Auth email/password настроен.
- [ ] Redirect URL `http://localhost:5173` добавлен.
- [ ] `VITE_SUPABASE_URL` известен.
- [ ] `VITE_SUPABASE_ANON_KEY` известен.
- [ ] `service_role` key не добавлялся во frontend.
- [ ] `npm run build` и `npm run lint` проходят.

---

## 17. Production hosting checklist

- [ ] Выбран hosting: Vercel или Cloudflare Pages.
- [ ] Получен technical URL.
- [ ] Technical URL добавлен в Supabase redirect URLs.
- [ ] Env variables добавлены в hosting dashboard.
- [ ] Проверен login flow.
- [ ] Проверена работа RLS из браузера.
- [ ] Проверено, что пользователь видит только свои данные.
- [ ] Кастомный домен необязателен для первого запуска.
- [ ] После покупки домена обновлены redirect URLs.

---

## 18. Security checklist

- [ ] RLS включён на всех пользовательских таблицах.
- [ ] Нет таблиц с user data без RLS.
- [ ] Policies используют `auth.uid()`.
- [ ] `service_role` key не попадает во frontend.
- [ ] `.env` не коммитится.
- [ ] Во frontend используется только `anon` key.
- [ ] Нет публичного доступа к чужим данным.
- [ ] Delete операции в UI требуют подтверждения.
- [ ] Replace import в UI требует подтверждения.

---

## 19. Open questions

1. Vercel или Cloudflare Pages для первого hosting?
2. Включать ли email confirmation сразу?
3. Разрешать ли public signup?
4. Нужен ли Google OAuth на первом auth-этапе?
5. Профиль создавать trigger'ом или lazy-create в приложении?
6. Создавать ли default goal `Канада` автоматически при первом входе?
7. Держать `goal_id`/`project_id` в habits сразу или позже?
8. Milestones сразу goal/project-level или только project-level?
9. Нужен ли `legacy_id` в таблицах для импорта старого AppState?
10. Нужны ли SQL views/RPC для progress analytics сразу?
11. Разделять Supabase dev/prod projects на старте?
12. Какой technical URL будет первым production URL?

---

## 20. Связь с roadmap

- **21.3 — Supabase Setup Docs**  
  Текущий этап. Только документация.

- **21.4 — Supabase Client + env**  
  Добавить `.env.example` и `src/shared/lib/supabase.ts`.

- **21.5 — AuthProvider + AuthPage**  
  Добавить session management и UI входа.

- **21.6 — Protected App**  
  Закрыть приложение для неавторизованных.

- **21.7 — Repository Layer**  
  Добавить repository/API слой.

- **21.8 — Cloud Persistence Migration**  
  Перенести данные в Supabase.

- **21.9 — Import JSON into Cloud**  
  Импорт AppState JSON в DB.

- **21.10 — Sync / Loading / Error UX**  
  Добавить статусы сохранения и обработку ошибок.

- **21.11 — Hosting**  
  Разместить frontend на Vercel или Cloudflare Pages.

---

## 21. Проверки

После создания документа выполнить:

- `npm run build`
- `npm run lint`

Код на этом этапе не должен меняться, поэтому проверки должны быть зелёными.
