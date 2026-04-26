# Goal Deletion Schema Check

## 1. Purpose

- Зафиксировать **фактическую** схему PostgreSQL (Supabase) для таблиц, затронутых удалением цели и режимами **A** / **B** из [goal-deletion-behavior-plan.md](goal-deletion-behavior-plan.md) (**этап 24.1**).
- Связать продуктовые требования (**24.1**) с **ограничениями БД** и подготовить **план миграции** для режима **A** (отвязка проектов: `goal_id → NULL`).
- Этап **24.2** — **только документация и read-only SQL**; изменений в **`src/**`**, данных и RLS-политик здесь **нет**.
- Этап **24.3** — применение DDL-миграции (**`apply_migration`**) и верификация; итог зафиксирован в разделе **«Результат этапа 24.3»** в конце документа.

### Как собирались данные

На этапе **24.2** выполнялись **только читающие** запросы через Supabase MCP (**`execute_sql`**). На этапе **24.3** дополнительно вызван **`apply_migration`** (только DDL из §5) и снова **`execute_sql`** для верификации. **DELETE / TRUNCATE / DROP TABLE** и изменение **RLS** не выполнялись.

---

## 2. Production schema findings

Актуальное состояние после **24.3** (верификация MCP **`execute_sql`**, см. раздел **«Результат этапа 24.3»**). До **24.3** для **`projects.goal_id`** было **`is_nullable = NO`** и **`ON DELETE RESTRICT`**.

### 2.1. Колонки (`information_schema`)

Ключевые выводы по **`public`**:

| Таблица | Поле | Тип | Nullable |
|---------|------|-----|----------|
| **projects** | **goal_id** | uuid | **YES** (после 24.3) |
| **projects** | user_id | uuid | NO |
| **goals** | id, user_id, … | — | как в каталоге |
| **milestones** | goal_id | uuid | **YES** |
| **milestones** | project_id | uuid | **YES** |
| **habits** | goal_id | uuid | **YES** |
| **habits** | project_id | uuid | **YES** |
| **project_groups** | project_id | uuid | NO |
| **tasks** | project_id, group_id | uuid | NO |

Полный список колонок для перечисленных таблиц соответствует стандартному набору полей приложения (см. сырой ответ MCP при аудите).

### 2.2. Ограничения и FK (`pg_constraint`)

| Таблица | Имя ограничения | Тип | Определение (суть) |
|---------|------------------|-----|---------------------|
| **projects** | **projects_goal_id_fkey** | FK | `FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL` (после 24.3) |
| **projects** | projects_user_id_fkey | FK | `REFERENCES auth.users(id) ON DELETE CASCADE` |
| **project_groups** | project_groups_project_id_fkey | FK | `REFERENCES projects(id) ON DELETE CASCADE` |
| **tasks** | tasks_project_id_fkey | FK | `REFERENCES projects(id) ON DELETE CASCADE` |
| **tasks** | tasks_group_id_fkey | FK | `REFERENCES project_groups(id) ON DELETE CASCADE` |
| **milestones** | milestones_goal_id_fkey | FK | `REFERENCES goals(id) ON DELETE CASCADE` |
| **milestones** | milestones_project_id_fkey | FK | `REFERENCES projects(id) ON DELETE CASCADE` |
| **milestones** | milestones_goal_xor_project_chk | CHECK | ровно одно из `goal_id`, `project_id` не null |
| **habits** | habits_goal_id_fkey | FK | `REFERENCES goals(id) ON DELETE SET NULL` |
| **habits** | habits_project_id_fkey | FK | `REFERENCES projects(id) ON DELETE SET NULL` |

### 2.3. Индексы (`pg_indexes`)

На **`projects`** среди прочего есть **`idx_projects_goal_id`**, **`idx_projects_user_goal`** — после перехода на nullable **`goal_id`** индексы остаются валидными; при необходимости частичный индекс «только не-null goal_id» можно рассмотреть позже (не обязателен для этапа 24.2).

---

## 3. Compatibility with planned delete modes

| Requirement | Схема после **24.3** | Compatible? | Notes |
|-------------|----------------------|-------------|--------|
| Режим **A**: можно выставить **`projects.goal_id = NULL`** | **`goal_id` nullable** | **Да** | Миграция **24.3** применена. |
| Режим **A**: после удаления цели проекты не держат FK на удалённую строку | FK **`ON DELETE SET NULL`** | **Да** | При **`DELETE`** из **`goals`** PostgreSQL может обнулить **`goal_id`** у проектов (поведение продукта «отвязать» согласуется с FK). Реализация сервиса всё равно может явно делать **`UPDATE`** до удаления цели. |
| Режим **B**: удаление проектов и потомков | CASCADE с **projects** на groups/tasks/milestones | **Да** | Порядок удаления соблюдать от листьев к корню либо полагаться на CASCADE где возможно. |
| Удаление **goal-level** milestones | `milestones.goal_id` → goals **ON DELETE CASCADE** | **Да** | При удалении цели вехи с только `goal_id` уйдут каскадом (если нет проектов, блокирующих цель). |
| **Project-level** milestones при удалении проекта | **ON DELETE CASCADE** | **Да** | |
| **Habits** не удаляются удалением цели | **`ON DELETE SET NULL`** на `habits.goal_id` | **Да** | Ссылка на цель обнуляется. |
| **RLS** разрешает свои строки | Не проверялось отдельным запросом в 24.2 | **Предположительно да** | Политики описаны в [supabase-setup.md](supabase-setup.md); перед релизом кода удаления — smoke-тест под пользователем. |

---

## 4. Needed migration

### Вывод

Для продуктового **режима A** (**удалить только цель**, проекты остаются с **`goal_id = NULL`**) в **текущей** схеме:

1. **`projects.goal_id`** должен стать **nullable** (`ALTER COLUMN … DROP NOT NULL`).
2. Внешний ключ **`projects_goal_id_fkey`** должен разрешать обнуление при удалении цели: заменить **`ON DELETE RESTRICT`** на **`ON DELETE SET NULL`** (имя ограничения на проде подтверждено: **`projects_goal_id_fkey`**).

**Почему:** при **`NOT NULL`** и **`RESTRICT`** нельзя ни обновить строку проекта на **`NULL`**, ни удалить цель, пока проект ссылается на неё — это блокирует режим **A** из **24.1**.

**Режим B** технически может обходиться без nullable **`goal_id`**, если всегда сначала удаляются дочерние проекты; nullable и **`SET NULL`** всё равно полезны для явной отвязки в режиме **A** и для согласованности с продуктом.

---

## 5. Proposed SQL migration

**Статус:** миграция **применена** на этапе **24.3** (подробности — в разделе **«Результат этапа 24.3»**). Ниже — тот же SQL, который был выполнен через **`apply_migration`**.

**Имя миграции:** `make_projects_goal_nullable_for_goal_deletion`

```sql
-- Разрешить проектам существовать без цели (режим A из goal-deletion-behavior-plan.md).
-- Не удаляет и не изменяет строки данных.

ALTER TABLE public.projects
  ALTER COLUMN goal_id DROP NOT NULL;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_goal_id_fkey;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_goal_id_fkey
  FOREIGN KEY (goal_id)
  REFERENCES public.goals(id)
  ON DELETE SET NULL;
```

**Замечания:**

- Имя ограничения на проверенной базе: **`projects_goal_id_fkey`**. Если в другой среде имя иное — подставить фактическое (запрос из §2.2).
- Составных FK по **`(goal_id, user_id)`** в проверенной схеме **нет** — только **`goal_id` → goals(id)**.
- После миграции строки с **`goal_id IS NULL`** — это **«проекты без цели»**; в приложении нужны UI и фильтры (**24.3–24.4**).

### Верификация после применения (read-only)

Используется для регрессии и для новых окружений:

```sql
SELECT column_name, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'projects' AND column_name = 'goal_id';

SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.projects'::regclass AND contype = 'f' AND conname LIKE '%goal%';
```

Ожидание после **24.3**: **`is_nullable = YES`**, в определении FK — **`ON DELETE SET NULL`**.

---

## 6. RLS considerations

- Изменение **nullable** и **ON DELETE** для **`projects.goal_id`** **не отключает** RLS и **не меняет** условия **`auth.uid()`** в политиках.
- Операции **`UPDATE`** (отвязка) и **`DELETE`** по-прежнему должны ограничиваться **`user_id`** текущего пользователя в приложении и в политиках.
- После миграции имеет смысл прогнать сценарий: пользователь A не может **`UPDATE`** проект пользователя B даже при смене **`goal_id`**.

---

## 7. Risks

- **Проекты без цели:** растёт число строк с **`goal_id IS NULL`** — нужны экраны, фильтры, **selected goal**, импорт/экспорт и типы в **`database.types`** / мапперах (**отдельный код-этап** после **24.3**).
- **Аналитика и отчёты:** предположения «у проекта всегда есть цель» могут сломаться — проверить агрегации.
- **Частичные сбои** при клиентском каскадном удалении (режим **B**) — см. **24.1** §11; миграция их не устраняет.
- **Документация в репозитории:** [supabase-setup.md](supabase-setup.md) обновлена под nullable **`goal_id`** и **`ON DELETE SET NULL`** (фрагмент DDL для **`projects`**).

---

## 8. Recommendation

1. ~~Применить миграцию~~ — **выполнено** в **24.3** (см. раздел **«Результат этапа 24.3»**).
2. Обновить **`src/shared/api/database.types.ts`** и мапперы под **`ProjectRow.goal_id: string | null`** — в **отдельном код-этапе** (не в **24.3**).
3. Реализовать **сервис / репозиторий удаления цели**, reducer и **UI** (диалог удаления) — следующие этапы блока **24**.

---

## 9. Migration application log (этап 24.2 — исторический)

| Пункт | Значение |
|--------|----------|
| **`apply_migration` на этапе 24.2** | **Нет** |
| Причина | Только план и read-only проверка. |

## 10. Migration application log (этап 24.3)

| Пункт | Значение |
|--------|----------|
| **`apply_migration` вызван?** | **Да** |
| **Имя** | **`make_projects_goal_nullable_for_goal_deletion`** |
| **Успех** | **`success: true`** |
| **Верификация** | См. раздел **«Результат этапа 24.3»** ниже |

---

## Результат этапа 24.3

| Пункт | Значение |
|--------|----------|
| **Имя миграции** | **`make_projects_goal_nullable_for_goal_deletion`** |
| **Инструмент** | Supabase MCP **`apply_migration`** |
| **Результат вызова** | **`success: true`** |
| **Удаление / изменение строк данных** | **Нет** (только DDL: **`DROP NOT NULL`**, замена FK) |
| **RLS** | **Не менялась** (политики не пересоздавались) |
| **`projects.goal_id` nullable** | **YES** (`information_schema`: **`is_nullable`** = **`YES`**) |
| **FK `projects_goal_id_fkey`** | **`FOREIGN KEY (goal_id) REFERENCES goals(id) ON DELETE SET NULL`** |
| **Таблицы на месте** | **`goals`**, **`habits`**, **`milestones`**, **`project_groups`**, **`projects`**, **`tasks`** — присутствуют в **`information_schema.tables`** |

**До миграции (read-only, этап 24.3):** **`is_nullable`** = **`NO`**, FK — **`ON DELETE RESTRICT`**.

**Применённый SQL:**

```sql
ALTER TABLE public.projects
  ALTER COLUMN goal_id DROP NOT NULL;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_goal_id_fkey;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_goal_id_fkey
  FOREIGN KEY (goal_id)
  REFERENCES public.goals(id)
  ON DELETE SET NULL;
```

**Продуктовый вывод:** режим **A** из [goal-deletion-behavior-plan.md](goal-deletion-behavior-plan.md) (**«удалить только цель»** с отвязкой проектов) стал **совместим со схемой БД**. Реализация сервиса удаления, reducer и UI — **следующие этапы** блока 24 (код не входил в **24.3**).

---

## 11. Связь с этапом 24.1

Документ [goal-deletion-behavior-plan.md](goal-deletion-behavior-plan.md) содержит ссылки на этот файл (**обновления 24.2** и **24.3** в §4).

---

*Документ: блоки **24.2** (проверка) и **24.3** (миграция). При изменении схемы в Supabase обновить §2–§5 и §«Результат этапа 24.3».*
