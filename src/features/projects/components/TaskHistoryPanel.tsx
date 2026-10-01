import { History, LoaderCircle } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { formatDateOnly } from "@/shared/lib/dateFormat"
import {
  listTaskHistory,
  type TaskHistoryEntry,
} from "@/shared/api/repositories/taskHistoryRepository"

type TaskHistoryPanelProps = {
  taskId: string
}

type HistoryGroup = {
  batchId: string
  changedAt: string
  reason?: string
  entries: TaskHistoryEntry[]
}

const STATUS_LABELS: Record<string, string> = {
  planned: "Запланировано",
  in_progress: "В работе",
  waiting: "Жду ответ",
  delegated: "Делегировано",
  control: "На контроле",
  done: "Готово",
}

const PRIORITY_LABELS: Record<string, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
}

const DEFER_REASON_LABELS: Record<string, string> = {
  priority_changed: "Изменился приоритет",
  dependency: "Зависимость",
  capacity: "Не хватает ресурса",
  blocked: "Заблокировано",
  deadline_changed: "Изменился срок",
  other: "Другое",
}

const REMINDER_LABELS: Record<string, string> = {
  at_time: "В момент срока",
  "15m": "За 15 минут",
  "30m": "За 30 минут",
  "1h": "За 1 час",
  "2h": "За 2 часа",
  "1d": "За 1 день",
  morning: "Утром",
}

function formatChangedAt(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function scalar(value: unknown): string {
  if (value === null || value === undefined || value === "") return "не задано"
  if (typeof value === "boolean") return value ? "Да" : "Нет"
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return "изменено"
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function linkedTaskTitle(value: unknown): string {
  const record = asRecord(value)
  if (!record) return scalar(value)
  if (typeof record.title === "string" && record.title.trim()) {
    return record.title
  }
  if (typeof record.task_id === "string" && record.task_id.trim()) {
    return record.task_id
  }
  return "задача"
}

function formatSchedule(value: unknown): string {
  const record = asRecord(value)
  if (!record) return scalar(value)

  const date =
    typeof record.date === "string" && record.date
      ? record.date
      : undefined
  const time =
    typeof record.time === "string" && record.time
      ? record.time.slice(0, 5)
      : undefined

  if (!date) return "не задано"
  return time ? `${formatDateOnly(date)} · ${time}` : formatDateOnly(date)
}

function changeLine(entry: TaskHistoryEntry): string {
  const from = entry.oldValue
  const to = entry.newValue

  switch (entry.eventType) {
    case "created":
      return "Задача создана"
    case "history_started":
      return "История отслеживания включена"
    case "title_changed":
      return `Название: «${scalar(from)}» → «${scalar(to)}»`
    case "deadline_changed":
      return `Дедлайн: ${formatSchedule(from)} → ${formatSchedule(to)}`
    case "control_changed":
      return `Контроль: ${formatSchedule(from)} → ${formatSchedule(to)}`
    case "status_changed":
      return `Статус: ${STATUS_LABELS[scalar(from)] ?? scalar(from)} → ${STATUS_LABELS[scalar(to)] ?? scalar(to)}`
    case "completion_changed":
      return `Выполнение: ${scalar(from)} → ${scalar(to)}`
    case "priority_changed":
      return `Приоритет: ${PRIORITY_LABELS[scalar(from)] ?? scalar(from)} → ${PRIORITY_LABELS[scalar(to)] ?? scalar(to)}`
    case "assignee_changed":
      return `Ответственный: ${scalar(from)} → ${scalar(to)}`
    case "deferred_until_changed":
      return `Отложено до: ${scalar(from) === "не задано" ? "не задано" : formatDateOnly(scalar(from))} → ${scalar(to) === "не задано" ? "не задано" : formatDateOnly(scalar(to))}`
    case "defer_reason_changed":
      return `Причина переноса: ${DEFER_REASON_LABELS[scalar(from)] ?? scalar(from)} → ${DEFER_REASON_LABELS[scalar(to)] ?? scalar(to)}`
    case "defer_note_changed":
      return `Комментарий к переносу: ${scalar(from)} → ${scalar(to)}`
    case "next_action_changed":
      return `Следующая задача проекта: ${scalar(from)} → ${scalar(to)}`
    case "deadline_reminder_changed":
      return `Напоминание о дедлайне: ${REMINDER_LABELS[scalar(from)] ?? scalar(from)} → ${REMINDER_LABELS[scalar(to)] ?? scalar(to)}`
    case "control_reminder_changed":
      return `Напоминание контроля: ${REMINDER_LABELS[scalar(from)] ?? scalar(from)} → ${REMINDER_LABELS[scalar(to)] ?? scalar(to)}`
    case "dependency_added":
      return `Добавлена зависимость: после «${linkedTaskTitle(to)}»`
    case "dependency_removed":
      return `Удалена зависимость от «${linkedTaskTitle(from)}»`
    case "completion_successor_changed":
      return `После выполнения: ${from ? `«${linkedTaskTitle(from)}»` : "не задано"} → ${to ? `«${linkedTaskTitle(to)}»` : "не задано"}`
    default:
      return "Параметры задачи изменены"
  }
}

function groupEntries(entries: TaskHistoryEntry[]): HistoryGroup[] {
  const groups = new Map<string, HistoryGroup>()

  for (const entry of entries) {
    const existing = groups.get(entry.batchId)
    if (existing) {
      existing.entries.push(entry)
      if (!existing.reason && entry.reason) existing.reason = entry.reason
      continue
    }

    groups.set(entry.batchId, {
      batchId: entry.batchId,
      changedAt: entry.changedAt,
      reason:
        entry.eventType === "history_started" ? undefined : entry.reason,
      entries: [entry],
    })
  }

  return [...groups.values()].sort(
    (a, b) =>
      new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime(),
  )
}

export function TaskHistoryPanel({ taskId }: TaskHistoryPanelProps) {
  const [entries, setEntries] = useState<TaskHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      const result = await listTaskHistory(taskId)
      if (!active) return

      if (result.error !== null) {
        setError(result.error)
        setEntries([])
      } else {
        setEntries(result.data)
      }
      setLoading(false)
    }

    void load()

    return () => {
      active = false
    }
  }, [taskId])

  const groups = useMemo(() => groupEntries(entries), [entries])

  return (
    <details className="group overflow-hidden rounded-xl border border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 py-2.5 [&::-webkit-details-marker]:hidden">
        <History className="size-4 shrink-0 text-slate-500" aria-hidden />
        <span className="min-w-0 flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">
          История задачи
        </span>
        {!loading ? (
          <span className="text-xs text-slate-400">
            {groups.length}
          </span>
        ) : null}
      </summary>

      <div className="border-t border-slate-200 px-3 pb-3 pt-3 dark:border-slate-800">
        {loading ? (
          <div className="flex items-center gap-2 py-2 text-xs text-slate-500">
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
            Загружаю историю…
          </div>
        ) : error ? (
          <p className="py-2 text-xs text-red-600 dark:text-red-400">
            Не удалось загрузить историю: {error}
          </p>
        ) : groups.length === 0 ? (
          <p className="py-2 text-xs text-slate-500">
            Изменений пока нет.
          </p>
        ) : (
          <div className="space-y-2.5">
            {groups.map((group) => (
              <div
                key={group.batchId}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-[11px] font-medium text-slate-400">
                  {formatChangedAt(group.changedAt)}
                </p>
                <div className="mt-1.5 space-y-1">
                  {group.entries.map((entry) => (
                    <p
                      key={entry.id}
                      className="text-xs leading-5 text-slate-700 dark:text-slate-300"
                    >
                      {changeLine(entry)}
                    </p>
                  ))}
                </div>
                {group.reason ? (
                  <p className="mt-2 rounded-md bg-slate-100 px-2 py-1.5 text-xs leading-5 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Причина: {group.reason}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </details>
  )
}
