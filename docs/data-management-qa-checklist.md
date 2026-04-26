# Data Management QA Checklist

## 1. Scope

Этот чеклист покрывает проверки блока Data Management Hardening:

- delete goal only;
- delete goal with projects;
- unassigned projects visibility;
- selected goal cleanup;
- clear current data;
- reset data;
- import JSON;
- export JSON;
- refresh persistence;
- production checks.

В этот чеклист не входят:

- load testing;
- transaction/RPC implementation;
- account deletion;
- offline mode.

## 2. Test environments

- Local: `http://localhost:5173`
- Production: `https://surround-eta.vercel.app`
- Supabase project: `https://dlhkkrhtoppjstxtmdiq.supabase.co`
- Viewports: desktop + mobile

## 3. Pre-checks

- [ ] Пользователь может войти в аккаунт.
- [ ] Данные пользователя отображаются в UI.
- [ ] Сессия Supabase активна.
- [ ] В консоли браузера нет runtime-ошибок.
- [ ] Перед деструктивными тестами сделан export backup.
- [ ] На Vercel доступен актуальный deployment.

## 4. Goal-only delete checklist

- [ ] Создать тестовую цель.
- [ ] Создать проект внутри цели.
- [ ] Добавить группу.
- [ ] Добавить задачу.
- [ ] Добавить project-level milestone (если UI позволяет).
- [ ] Выбрать эту цель в GoalSwitcher.
- [ ] Нажать `Удалить`.
- [ ] Выбрать `Удалить только цель`.
- [ ] Подтвердить удаление.
- [ ] Цель исчезла из UI.
- [ ] Selected goal сбросился на `Все активные цели`.
- [ ] Проект остался.
- [ ] Группа осталась.
- [ ] Задача осталась.
- [ ] Project-level milestone остался.
- [ ] Goal-level milestone удален (если был).
- [ ] Проект отображается как `Без цели`.
- [ ] Проект виден в режиме `Все активные цели`.
- [ ] Проект не виден при выборе другой конкретной цели.
- [ ] После refresh удаленная цель не возвращается.

## 5. Goal with projects delete checklist

- [ ] Создать тестовую цель.
- [ ] Создать 1-2 проекта внутри цели.
- [ ] Добавить группы и задачи.
- [ ] Добавить milestones (если UI позволяет).
- [ ] Нажать `Удалить`.
- [ ] Выбрать `Удалить вместе с проектами и задачами`.
- [ ] Подтвердить удаление.
- [ ] Цель исчезла.
- [ ] Проекты исчезли.
- [ ] Группы и задачи исчезли.
- [ ] Milestones по goal/project исчезли.
- [ ] Habits не удалились.
- [ ] Unrelated goals/projects не затронуты.
- [ ] После refresh удаленные данные не возвращаются.

## 6. Unassigned projects checklist

- [ ] Проект без цели виден в `ProjectsPage` в режиме `all`.
- [ ] Dashboard в режиме `all` включает проект без цели.
- [ ] Analytics в режиме `all` включает проект без цели.
- [ ] Лейбл `Без цели` виден там, где реализован.
- [ ] Редактирование unassigned проекта сохраняет выбор `Без цели`.
- [ ] Привязка unassigned проекта к конкретной цели работает (если UI позволяет).
- [ ] В режиме конкретной цели unassigned проекты не отображаются.

## 7. Selected goal/project cleanup

- [ ] Если удалена выбранная цель, selected goal становится `all`.
- [ ] Если удален выбранный проект, selection уходит в безопасный fallback.
- [ ] После clear/reset selected project становится безопасным пустым значением.
- [ ] После удаления нет битого состояния в project detail.
- [ ] Локальные ключи localStorage не очищаются полностью.

## 8. Settings clear current data checklist

- [ ] Нажать `Очистить текущие данные`.
- [ ] Confirm-текст явно предупреждает об удалении cloud-данных.
- [ ] Операция удаляет goals.
- [ ] Операция удаляет projects/groups/tasks.
- [ ] Операция удаляет habits/habit_logs.
- [ ] Операция удаляет milestones.
- [ ] Операция удаляет user_settings.
- [ ] Профиль и auth user остаются.
- [ ] AppState становится пустым.
- [ ] Selected goal = `all`.
- [ ] Selected project = `""`.
- [ ] После refresh старые данные не возвращаются.
- [ ] Таблицы Supabase для текущего пользователя пусты.

## 9. Settings reset data checklist

- [ ] Нажать `Сбросить данные`.
- [ ] Confirm-текст предупреждает о replace.
- [ ] Сброс выполняется cloud-aware replace-операцией.
- [ ] AppState становится reset state.
- [ ] Selected goal = `all`.
- [ ] Selected project = `""`.
- [ ] После refresh сохраняется reset state.
- [ ] Import flow продолжает работать после reset.

## 10. Import JSON checklist

- [ ] Сделать export backup.
- [ ] Импортировать валидный JSON.
- [ ] Подтвердить replace.
- [ ] Импорт пишет goals/projects/groups/tasks/habits/milestones/settings в Supabase.
- [ ] AppState обновляется до нормализованного состояния.
- [ ] После refresh импортированные данные остаются.
- [ ] Невалидный JSON показывает ошибку.
- [ ] Импорт не затрагивает profile/auth.

## 11. Export JSON checklist

- [ ] Export скачивает JSON-файл.
- [ ] JSON включает актуальный AppState.
- [ ] После goal-only delete export содержит unassigned projects.
- [ ] После clear export показывает empty state.
- [ ] В export нет auth tokens.

## 12. Supabase data verification

Read-only проверки (без реальных user_id в документации):

- [ ] Проверить `goals` count для текущего пользователя.
- [ ] Проверить `projects` count для текущего пользователя.
- [ ] Проверить количество `projects` с `goal_id is null`.
- [ ] Проверить `tasks` count.
- [ ] Проверить `habits` count.
- [ ] Проверить `milestones` count.
- [ ] Проверить наличие/отсутствие `user_settings`.

## 13. Error handling checklist

- [ ] Ошибка cloud clear отображается пользователю.
- [ ] Ошибка delete goal отображается в диалоге.
- [ ] Ошибка import отображается пользователю.
- [ ] Кнопки disabled во время операций.
- [ ] Нет double-submit на деструктивных действиях.
- [ ] Приложение не показывает silent success при ошибке.

## 14. Mobile checks

- [ ] DeleteGoalDialog корректно помещается в mobile viewport.
- [ ] Destructive-кнопки touch-friendly.
- [ ] Settings clear/reset dialogs корректно помещаются в mobile viewport.
- [ ] Лейблы `Без цели` не создают overflow.
- [ ] Bottom nav не перекрывает destructive action buttons.

## 15. Safety checklist

- [ ] Деструктивные операции требуют подтверждения.
- [ ] Тексты подтверждений объясняют последствия.
- [ ] Во frontend нет `service_role` ключа.
- [ ] RLS остается включенным.
- [ ] Операции фильтруются по `user_id`.
- [ ] Данные других пользователей не затрагиваются.
- [ ] Перед деструктивными действиями рекомендуется backup/export.

## 16. Known limitations

- Delete/clear/reset/import выполняются клиентской последовательностью запросов, не Postgres transaction/RPC.
- Сохраняется риск partial failure при сбое посередине multi-table операции.
- Future improvement: Supabase RPC transactions.
- Для `delete goal with projects` пока нет typed-confirmation `УДАЛИТЬ`.
- UX для unassigned projects может потребовать отдельной секции `Без цели`.
- Account deletion не реализован.

## 17. Pass/fail table

| Area | Status | Notes |
|------|--------|-------|
| Goal-only delete | ☐ Pass / ☐ Fail | |
| Goal with projects delete | ☐ Pass / ☐ Fail | |
| Unassigned projects | ☐ Pass / ☐ Fail | |
| Selected goal cleanup | ☐ Pass / ☐ Fail | |
| Clear current data | ☐ Pass / ☐ Fail | |
| Reset data | ☐ Pass / ☐ Fail | |
| Import JSON | ☐ Pass / ☐ Fail | |
| Export JSON | ☐ Pass / ☐ Fail | |
| Refresh persistence | ☐ Pass / ☐ Fail | |
| Mobile dialogs | ☐ Pass / ☐ Fail | |
| RLS/safety | ☐ Pass / ☐ Fail | |

## 18. Final criteria

Блок Data Management Hardening можно считать завершенным, если:

- goals удаляются в обоих режимах;
- goal-only сохраняет проекты и показывает их как `Без цели`;
- with-projects удаляет дерево проекта;
- clear current data удаляет goals и данные не возвращаются после refresh;
- reset работает cloud-aware;
- import/export продолжают работать;
- деструктивные операции показывают подтверждения и ошибки;
- `npm run build` и `npm run lint` проходят успешно.

## 19. README

README менять не обязательно. При необходимости допускается одна строка ссылки:

- Data Management QA checklist: `docs/data-management-qa-checklist.md`

## 20. Проверки

```bash
npm run build
npm run lint
```
