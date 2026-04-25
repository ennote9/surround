# Life Progress OS

Life Progress OS — персональная система управления жизненными целями, проектами, задачами, привычками, прогрессом и аналитикой.

Канада теперь рассматривается как первая seed-цель внутри Life Progress OS, а не как граница всего продукта.

## Возможности

- Архитектура верхнего уровня: `Goal -> Project -> Group -> Task`.
- Управление целями: создание, редактирование, архивирование на странице `Цели`.
- `GoalSwitcher` в сайдбаре для выбора контекста (`all` или конкретная цель).
- Контекстная Главная: прогресс, карточки проектов и статы считаются по выбранной цели.
- Проекты внутри целей, включая выбор цели в форме проекта.
- Контекстная Аналитика по выбранной цели (project/task блоки).
- Глобальные привычки (на текущем этапе не привязаны к цели).
- Экспорт/импорт состояния приложения в JSON и reset данных.

## Стек

- Vite
- React
- TypeScript
- React Router
- Tailwind CSS v4
- shadcn/ui / Radix
- Recharts
- date-fns
- Sonner
- localStorage persistence

## Запуск

```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## Deployment

- First production target: **Vercel**
- Build command: `npm run build`
- Output directory: `dist`
- Required env variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Full guide: [docs/deployment-vercel.md](docs/deployment-vercel.md)

## Структура проекта

- `src/app` - инициализация приложения и провайдеры.
- `src/pages` - страничные контейнеры.
- `src/layouts` - общий layout и навигация.
- `src/features` - функциональные модули (`dashboard`, `projects`, `goals`, `analytics`, `settings` и др.).
- `src/store` - типы состояния, reducer, миграции, провайдер состояния.
- `src/shared` - общие хуки, утилиты и доменная логика.
- `src/components/ui` - базовые UI-компоненты.
- `docs` - документация и seed-данные.

## Данные и localStorage

- Основное состояние приложения сохраняется в localStorage.
- Поддерживаются экспорт и импорт JSON-резервной копии.
- Часть storage-ключей намеренно сохраняет префикс `canada-progress-os-*` для совместимости с уже существующими пользовательскими данными.
- Текущее переименование storage keys не выполняется; отдельная миграция может быть сделана позже.

## Seed

- `docs/canada-life-progress-seed.json` - seed для первой цели `Канада`.
- Файл намеренно не переименован на этом этапе.
- Seed уже соответствует `AppState v2` и содержит `goal-canada`.
- Импорт выполняется через `Настройки -> Данные приложения`.

## Roadmap

- Дальнейшая полировка UX для Goals и GoalSwitcher.
- Возможная привязка привычек к целям.
- Goal-level milestones и расширенная аналитика целей.
- Возможная будущая миграция naming для storage keys и `docs/canada-*`.
