import type {
  Habit,
  HabitEntry,
  HabitEntryReason,
  HabitEntryStatus,
  HabitTimePreference,
} from "@/store/appState.types"

export const HABIT_REASON_OPTIONS: Array<{
  value: HabitEntryReason
  label: string
}> = [
  { value: "no-time", label: "Не было времени" },
  { value: "fatigue", label: "Усталость" },
  { value: "forgot", label: "Забыл" },
  { value: "health", label: "Самочувствие" },
  { value: "no-conditions", label: "Не было условий" },
  { value: "motivation", label: "Не хватило мотивации" },
  { value: "plan-too-hard", label: "План оказался слишком сложным" },
  { value: "other", label: "Другое" },
]

export const HABIT_STATUS_LABELS: Record<HabitEntryStatus, string> = {
  planned: "Запланировано",
  completed: "Выполнено",
  partial: "Частично",
  skipped: "Пропущено",
  rescheduled: "Перенесено",
}

export const HABIT_TIMING_LABELS: Record<HabitTimePreference, string> = {
  any: "В любое время",
  morning: "Утро",
  day: "День",
  evening: "Вечер",
  window: "Окно",
}

export function getHabitEntryStatus(entry: HabitEntry | undefined): HabitEntryStatus {
  if (!entry) return "planned"
  if (entry.status) return entry.status
  if (entry.skipped) return "skipped"
  if (entry.completed) return "completed"
  if (entry.value != null && entry.value > 0) return "partial"
  return "planned"
}

export function getHabitReasonLabel(reason: HabitEntryReason | undefined): string {
  if (!reason) return ""
  return HABIT_REASON_OPTIONS.find((item) => item.value === reason)?.label ?? "Другое"
}

export function getHabitTimingLabel(habit: Habit): string {
  const timing = habit.settings?.timing
  const preference = timing?.preference ?? "any"
  if (preference === "window") {
    if (timing?.startTime && timing?.endTime) {
      return `${timing.startTime}–${timing.endTime}`
    }
    return "Временное окно"
  }
  return HABIT_TIMING_LABELS[preference]
}

export function getHabitTimingOrder(habit: Habit): number {
  const preference = habit.settings?.timing?.preference ?? "any"
  if (preference === "morning") return 0
  if (preference === "day") return 1
  if (preference === "evening") return 2
  if (preference === "window") {
    const start = habit.settings?.timing?.startTime
    if (!start) return 1
    const hour = Number(start.slice(0, 2))
    if (Number.isFinite(hour)) {
      if (hour < 12) return 0
      if (hour < 18) return 1
      return 2
    }
  }
  return 3
}

export function getHabitRecoverySuggestion(reason: HabitEntryReason | undefined): string | undefined {
  switch (reason) {
    case "fatigue":
      return "Попробуй перенести привычку на более раннее время или снизить минимальную норму."
    case "no-time":
      return "Сделай минимальную версию короче или закрепи привычку за конкретными днями."
    case "forgot":
      return "Закрепи конкретное время выполнения или привяжи привычку к уже существующему действию."
    case "plan-too-hard":
      return "Снизь минимум и верни нагрузку постепенно после нескольких стабильных выполнений."
    case "no-conditions":
      return "Добавь запасной сценарий, который можно выполнить без специальных условий."
    case "motivation":
      return "Упрости первый шаг и проверь, остаётся ли привычка связанной с актуальной целью."
    case "health":
      return "При необходимости поставь привычку на паузу, чтобы пауза не искажала статистику."
    case "other":
      return "Посмотри комментарии к пропускам и найди повторяющийся контекст."
    default:
      return undefined
  }
}
