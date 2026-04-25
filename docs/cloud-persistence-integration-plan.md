# Cloud Persistence Integration Plan

## 1. Цель документа

Этот документ фиксирует безопасный план перехода Life Progress OS от локальной persistence-модели к облачной persistence-модели на Supabase **без big bang переключения** и без риска молчаливой потери пользовательских данных.

Текущая модель:

- `AppStateProvider` + reducer + context.
- Хранение доменных данных в `localStorage`.
- `AppState` v2 (включая goals).
- Импорт/экспорт JSON как рабочий backup-механизм.

Будущая модель:

- Supabase Auth как обязательный вход.
- Supabase PostgreSQL (нормализованные таблицы) как источник истины для доменных данных.
- Repository layer (уже добавлен) как единственная точка работы с БД.
- Загрузка state пользователя из cloud после auth.
- Сохранение изменений в cloud через repository layer.
- `localStorage` как локальные UI preferences, временный fallback/cache и backup-сигналы.

Ключевые ограничения перехода:

- Нельзя одним релизом «переключить всё на облако».
- Нужно сохранить экспорт JSON и стратегию бэкапа.
- Нельзя допустить молчаливое перетирание существующего `localStorage`.
- Cloud loading/save подключаются поэтапно.

---

## 2. Текущая архитектура persistence

Текущее состояние приложения:

- `AppStateProvider` держит `AppState` в reducer-состоянии.
- Основные сущности сохраняются и читаются из `localStorage`.
- При старте выполняется чтение локального state и миграции до актуальной версии.
- Import/export работает с `AppState` JSON.
- UI работает через context/reducer, не зависит от SQL-структуры.

Сущности `AppState`:

- `goals`
- `projects`
- `groups` (внутри `projects`)
- `tasks` (внутри groups)
- `habits`
- `milestones`
- `settings`

Важно:

- После блока 20 основной state — `AppState` version 2.
- Механизм goals уже интегрирован в текущую локальную модель.

---

## 3. Целевая cloud persistence архитектура

Целевая схема после входа пользователя:

1. `AuthProvider` предоставляет `user/session`.
2. Cloud persistence слой загружает данные пользователя через repositories.
3. Загруженные данные собираются в `AppState`-совместимую структуру.
4. `AppStateProvider` получает initial cloud state.
5. UI продолжает работать через context/reducer без прямой SQL-связности.
6. Изменения из reducer сохраняются в cloud через persistence adapter + repositories.

Ключевое архитектурное решение:

- На первом этапе **не** переписывать UI на прямые data hooks к Supabase.
- Оставить reducer/AppState как client-side cache и compatibility layer.

Поток чтения:

Supabase tables (normalized) -> repositories -> cloud state assembler -> `AppStateProvider` -> UI

Поток записи:

UI dispatch -> reducer (`AppState`) -> cloud persistence adapter -> repositories -> Supabase

---

## 4. Почему нужен промежуточный AppState-like слой

Причина:

- Текущий UI глубоко завязан на `AppState`, selectors и reducer actions.
- Прямой переход к «каждый экран сам ходит в Supabase» потребует большого рефактора и сильно повысит риск регрессий.

Плюсы промежуточного слоя:

- Минимум изменений UI на первом cloud-этапе.
- Ниже риск поломок и потери данных.
- Проще сохранить import/export JSON.
- Можно подключать cloud постепенно по сущностям/actions.
- Переиспользуются существующие selectors.

Минусы (осознанные):

- Временная двойная модель: normalized DB + `AppState` cache.
- Появляется задача корректной синхронизации client state и cloud state.

---

## 5. Cloud state assembler

Для чтения нужен отдельный слой сборки cloud-данных в `AppState`.

Планируемый файл:

- `src/shared/api/cloudStateAssembler.ts`

Назначение:

- Получить данные через repositories.
- Собрать `AppState` v2 в типах фронтенда.
- Сохранить совместимость существующего UI.

Базовая функция:

- `loadCloudAppState(userId: string): Promise<RepositoryResult<AppState>>`

Целевой порядок загрузки:

1. `listGoals(userId)`
2. `listProjects(userId)`
3. `listHabits(userId)`
4. `listMilestones(userId)`
5. `getUserSettings(userId)`

Сборка `AppState`:

- `version: 2`
- `settings`: из cloud (`user_settings`) или default initial settings
- `goals`, `projects`, `habits`, `milestones`: из repository-слоя

Зафиксировано:

- `projectsRepository.listProjects` уже собирает nested groups/tasks.
- `habitsRepository.listHabits` уже собирает `dailyStatus` из `habit_logs`.
- Отсутствие `user_settings` — допустимый случай, используется default.
- Пустой `goals` — допустимый сценарий пустого cloud аккаунта (детали в разделе 10).

---

## 6. Cloud state writer / persistence adapter

Для записи нужен отдельный слой адаптации reducer-изменений к repository API.

Планируемый файл:

- `src/shared/api/cloudStateWriter.ts`

Подходы:

### Подход A: action-based saving (рекомендованный)

- Каждому важному action соответствует конкретная repository-операция.
- Примеры:
  - `ADD_GOAL` -> `createGoal`
  - `UPDATE_GOAL` -> `updateGoal`
  - `ADD_PROJECT` -> `createProject`
  - `UPDATE_TASK`/`TOGGLE_TASK` -> `updateTask`/`toggleTaskCompleted`

Плюсы:

- Точечные и понятные изменения в БД.
- Лучше контролируется ошибка по конкретной операции.
- Лучше масштабируется.

Минусы:

- Нужно покрывать много actions.
- Требует аккуратной карты соответствий reducer -> repository.

### Подход B: snapshot sync (не рекомендуется как основной)

- После каждого изменения пытаться синхронизировать весь `AppState`.

Плюсы:

- Простой mental model.

Минусы:

- Высокий риск перезаписи и конфликтов.
- Сложно безопасно делать replace в нормализованной схеме.
- Лишняя нагрузка на сеть/БД.

Решение для 21.8:

- Выбирать action-based saving и включать его постепенно.

---

## 7. Почему не сохранять весь AppState JSONB

Зафиксировано архитектурно:

- Целевая модель данных для Life Progress OS — нормализованные таблицы (`goals`, `projects`, `project_groups`, `tasks`, `habits`, `habit_logs`, `milestones`, `user_settings`).
- Сохранение «весь AppState в JSONB» как основной путь не соответствует целям масштабируемости и аналитики.

Итог:

- Не вводить `app_states` JSONB как основной слой persistence.
- Не строить основной cloud sync на одном JSON-поле.
- Использовать только repository + normalized schema.

---

## 8. Основные риски cloud persistence

1. Потеря `localStorage` данных при первом cloud-подключении.
2. Пустой cloud state может ошибочно заменить наполненный local state.
3. Конфликты при двойной записи (local + cloud) без стратегии.
4. Некорректный autosave может отправить повреждённый state.
5. Недостаточная прозрачность loading/error для пользователя.
6. Некорректная реакция на ошибки Supabase/network.
7. Нечёткий момент отказа от `localStorage` как source of truth.
8. Риск некорректной работы с импортированным seed/backups.
9. Ошибки user isolation без строгого RLS-контроля.
10. Потеря backup-канала при выключении export JSON.

---

## 9. Защита localStorage данных

Правило перехода:

- До завершения миграции `localStorage` нельзя молча очищать или перетирать.

Сценарии:

### Сценарий A

- Локальные данные есть, cloud пустой.
- Рекомендация:
  - показывать migration prompt;
  - предложить отправить локальные данные в cloud;
  - до этого предложить экспорт JSON backup.

### Сценарий B

- Локальные данные пусты, cloud содержит данные.
- Рекомендация:
  - загружать cloud state.

### Сценарий C

- Локальные данные есть и cloud тоже содержит данные.
- Рекомендация:
  - **не** делать auto-merge и auto-overwrite;
  - предложить выбор:
    1) использовать cloud;
    2) заменить cloud локальными данными (с подтверждением);
    3) сначала экспортировать локальный backup.

Зафиксировано:

- Молчаливый overwrite запрещён.

---

## 10. Empty cloud account strategy

Проблема:

- Пользователь вошёл, но в Supabase нет доменных данных.

Варианты:

1. Показать пустое приложение.
2. Автосоздать default goal.
3. Предложить импорт seed/backup.
4. Предложить вручную создать первую цель.

Рекомендация на первом cloud-этапе:

- Не создавать автоматически полный Canada seed.
- Допустить пустое cloud-состояние.
- Показать empty-state с понятным CTA: создать первую цель / импортировать позже.
- Импорт JSON в cloud — отдельный этап 21.9.

Открытый вопрос:

- Нужен ли автосоздаваемый goal «Канада» для новых пользователей.

---

## 11. Что остаётся в localStorage после cloud

В cloud уходят (источник истины):

- goals
- projects
- groups
- tasks
- habits
- milestones

В `localStorage` могут остаться локальные UI preferences:

- `selectedGoal`
- `selectedProject`
- `sidebarCollapsed`
- dashboard widgets visibility (если решено локально)
- dashboard stat visibility (если решено локально)
- project groups collapse mode
- collapsed project groups
- migration flags / dismissed prompts
- временные backup markers

Открытый вопрос:

- Точный split между `user_settings` (cloud) и локальными preferences.

---

## 12. Loading states

Состояния после авторизации:

1. Auth loading
   - Уже закрыт `ProtectedApp` (`Проверяем сессию...`).

2. Cloud data loading
   - После подтверждённого `user` загружается cloud `AppState`.
   - До завершения показывается screen `Загружаем данные...`.

3. Cloud load error
   - Показывается error screen + `Retry`.
   - Нельзя молча открывать пустой state.

4. Cloud empty
   - Приложение открывается в empty state, без неявного seed.

5. Saving states (после подключения save)
   - subtle status: `Сохраняем...`, `Сохранено`, `Ошибка сохранения`.

---

## 13. Error handling

Правила:

- Repository layer возвращает `RepositoryResult`; ошибки нельзя игнорировать.
- При load error нельзя автоматически подменять cloud state «пустым».
- При save error локальный client state не стирается.
- Retry обязателен как UX-путь.
- Критические ошибки не должны приводить к silent data loss.

---

## 14. Предлагаемое разбиение этапа 21.8

### 21.8.0 — Cloud Persistence Integration Plan

- Текущий этап: только документация.

### 21.8.1 — Cloud AppState loading

- Загружать cloud state после auth.
- Собирать `AppState`-совместимую структуру.
- Подключить loading/error gate.
- Пока без autosave.

### 21.8.2 — Cloud Save Adapter (action-based)

- Подключать сохранение по actions.
- Начать с goals/projects/tasks.
- Показ ошибок сохранения.

### 21.8.3 — User settings split

- Разделить настройки на cloud (`user_settings`) и local UI prefs.

### 21.8.4 — Local data migration prompt

- Детектировать локальные данные и cloud presence.
- Запрещать silent overwrite.

### 21.8.5 — Save status UX

- Единый индикатор сохранения + retry-поведение.

### 21.9 — Import JSON into Cloud

- Нормализованный импорт JSON в cloud с подтверждением replace.

---

## 15. Подэтап 21.8.1 — Cloud AppState loading (детализация)

Что сделать:

- Создать `cloudStateAssembler`.
- Подключить async initial загрузку cloud state после auth.
- Добавить отдельный loading экран для cloud data.
- Добавить retry-сценарий на load error.
- Определить поведение для empty cloud account.

Что не делать:

- Не включать cloud autosave.
- Не удалять localStorage persistence.
- Не запускать import JSON в cloud.

Технический вариант подключения:

- Предпочтительно добавить отдельный `CloudStateGate` вокруг `AppStateProvider`.
- Альтернатива: расширение `AppStateProvider` пропами для async initial state.

Выбор варианта должен делаться после анализа текущей реализации `AppStateProvider` с приоритетом минимального риска.

---

## 16. Подэтап 21.8.2 — Cloud Save Adapter (детализация)

Цель:

- Не ломая reducer-подход, добавить адаптер сохранения actions в cloud.

Стартовый scope actions:

- goals: add/update/archive
- projects: add/update/delete
- tasks: add/update/toggle/delete

Ключевой вопрос синхронизации:

- Что считать «моментом успешного сохранения» и как показывать ошибку пользователю.

Ограничения первого шага:

- Не делать «сохранить весь state целиком».
- Не включать агрессивный autosave без понятного error UX.

---

## 17. ID strategy

Проблема:

- Текущий frontend использует строковые id в локальном state.
- БД использует `uuid` как PK.

Варианты:

### A. Client-generated UUID (рекомендовано)

- Клиент генерирует UUID до dispatch/insert.
- В reducer и в БД используется один и тот же id.
- Упрощается синхронизация и optimistic flow.

### B. DB-generated UUID

- UI ждёт ответ insert, затем маппит полученный id назад в client state.
- Усложняет архитектуру reducers/actions и UX.

Рекомендация:

- Для cloud persistence перейти к client-generated UUID (`crypto.randomUUID`) без новых зависимостей.

Дополнительно:

- Для старых импортируемых ids (не UUID) нужен mapping в этапе импорта (см. раздел 18).

---

## 18. Replace import strategy (этап 21.9)

Импорт JSON в cloud должен выполняться как подтверждённый replace-сценарий:

1. Validate/migrate JSON до `AppState` v2.
2. Явное подтверждение replace от пользователя.
3. Удаление текущих пользовательских строк в правильном порядке зависимостей:
   - `habit_logs`
   - `tasks`
   - `project_groups`
   - `milestones`
   - `projects`
   - `habits`
   - `goals`
   - `user_settings` (по политике replace/upsert)
4. Insert нормализованных строк из JSON.
5. Обновление client state.
6. Явный success/error результат.

Технический риск:

- Межтабличная транзакционность на чистом client-side batched API ограничена.

Рекомендация:

- Рассмотреть RPC-функцию в Supabase для atomic replace.

---

## 19. Offline mode

На первых cloud-подэтапах полноценный offline-first режим не включается.

При offline/network error:

- Показывать load/save ошибку.
- Не стирать локальный state.
- Предлагать retry.

PWA/offline cache — отдельный будущий блок после базовой cloud-стабилизации.

---

## 20. Security considerations

- Все repository-операции работают в контексте `userId`.
- RLS является обязательным уровнем защиты пользовательской изоляции.
- `service_role` ключ не используется на клиенте.
- Опасные операции (`delete`, `replace import`) всегда с подтверждением.
- Импорт JSON всегда проходит валидацию и миграции перед записью в БД.

---

## 21. Open questions

1. Как безопаснее подключить async cloud loading к `AppStateProvider`?
2. Делать ли отдельный `CloudStateGate`?
3. Что делать при конфликте: cloud empty + local non-empty?
4. Когда именно показывать migration prompt?
5. Финальная ID strategy: client UUID vs DB UUID?
6. Нужен ли `legacy_id` для импорта старых JSON?
7. Делать replace import через client batch или RPC?
8. Какие actions подключать к cloud save в первую очередь?
9. Нужен ли manual save до autosave?
10. Какие settings синхронизировать в `user_settings`?
11. Какой UX статусов сохранения выбрать (глобальный/локальный)?
12. Нужен ли постоянный local cache после стабилизации cloud?
13. При save error делать rollback UI или оставлять optimistic state?
14. Нужен ли optimistic update на первом cloud-шаге?
15. Как тестировать RLS и multi-user isolation в CI/manual QA?

---

## 22. Проверки этапа 21.8.0

После добавления документа:

- `npm run build` — должен проходить.
- `npm run lint` — должен проходить.

Ограничение этапа:

- На 21.8.0 меняется только документация, без изменений `src/**`.
