# Data Management Hardening

## Контекст (блок 24.7)

Этап фиксирует cloud-first поведение раздела Settings -> Data Management.

Раньше часть кнопок была ориентирована на локальный сценарий (in-memory/localStorage),
из-за чего после refresh данные могли вернуться из Supabase.

## Что изменено

### 1) Очистить текущие данные

Кнопка теперь выполняет явную cloud-операцию удаления данных пользователя:

1. `habit_logs`
2. `tasks`
3. `project_groups`
4. `milestones`
5. `projects`
6. `habits`
7. `goals`
8. `user_settings`

Удаление идет строго по `user_id` текущего пользователя.

После успешной очистки:

- в памяти приложения применяется пустой `AppState`:
  - `version: 2`
  - `goals: []`
  - `projects: []`
  - `habits: []`
  - `milestones: []`
  - `settings: initialAppState.settings`
- сбрасываются безопасные локальные выборы:
  - `selectedGoal = "all"`
  - `selectedProject = ""`

### 2) Сбросить данные

Кнопка теперь cloud-aware:

- берет `initialAppState` как reset-state;
- выполняет replace-операцию через `importAppStateIntoCloud(userId, resetState)`;
- после успеха применяет в память нормализованный state из результата импорта;
- сбрасывает `selectedGoal`/`selectedProject` в safe values.

### 3) Импорт JSON

Flow импорта не менялся по смыслу:

- JSON валидируется/мигрируется;
- есть явное подтверждение replace;
- выполняется `importAppStateIntoCloud`;
- локальный state обновляется через `IMPORT_STATE`.

## Что не изменялось

- Supabase schema / RLS.
- Профиль пользователя (`profiles`) и auth-данные.
- Полная очистка localStorage.
- Cloud save adapters для обычных reducer actions (`RESET_STATE`/`IMPORT_STATE` не стали обычными cloud actions).

## UX и безопасность

- Деструктивные действия требуют явного подтверждения.
- Есть состояния загрузки кнопок (`Очищаем...`, `Сбрасываем...`).
- Ошибки показываются пользователю через toast c деталями.

## Известное ограничение

Операции clear/reset/import выполняются серией клиентских запросов (multi-table),
без серверной транзакции. При частичном сбое возможно промежуточное состояние.
Дальнейшее усиление: RPC/транзакционный replace на стороне Postgres.
