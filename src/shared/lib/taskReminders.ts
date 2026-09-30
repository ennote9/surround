import type {
  Task,
  TaskReminderPreset,
} from "@/store/appState.types"
import { formatTaskScheduleLabel, normalizeTaskTime } from "./taskSchedule"

export type TaskReminderKind = "deadline" | "control"

const REMINDER_MINUTES: Partial<Record<TaskReminderPreset, number>> = {
  at_time: 0,
  "15m": 15,
  "30m": 30,
  "1h": 60,
  "2h": 120,
  "1d": 1440,
}

export function isTaskReminderPreset(
  value: unknown,
): value is TaskReminderPreset {
  return (
    value === "at_time" ||
    value === "15m" ||
    value === "30m" ||
    value === "1h" ||
    value === "2h" ||
    value === "1d" ||
    value === "morning"
  )
}

export function getTaskReminderOptions(
  hasExactTime: boolean,
  kind: TaskReminderKind,
): ReadonlyArray<{ value: TaskReminderPreset; label: string }> {
  const target = kind === "deadline" ? "срока" : "контроля"

  if (!hasExactTime) {
    return [
      {
        value: "at_time",
        label: `В день ${target} в 09:00`,
      },
      {
        value: "1d",
        label: `За день до ${target} в 09:00`,
      },
    ]
  }

  return [
    { value: "at_time", label: kind === "deadline" ? "В момент дедлайна" : "В момент контроля" },
    { value: "15m", label: "За 15 минут" },
    { value: "30m", label: "За 30 минут" },
    { value: "1h", label: "За 1 час" },
    { value: "2h", label: "За 2 часа" },
    { value: "1d", label: "За 1 день" },
  ]
}

export function getTaskReminderPresetLabel(
  preset: TaskReminderPreset | undefined,
  hasExactTime: boolean,
  kind: TaskReminderKind,
): string {
  if (!preset) return ""
  return (
    getTaskReminderOptions(hasExactTime, kind).find(
      (option) => option.value === preset,
    )?.label ??
    (preset === "morning"
      ? kind === "deadline"
        ? "В день срока в 09:00"
        : "В день контроля в 09:00"
      : preset)
  )
}

function localTargetDate(dateValue: string, timeValue?: string): Date | null {
  const [year, month, day] = dateValue.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return null

  const normalizedTime = normalizeTaskTime(timeValue)
  const hours = normalizedTime ? Number(normalizedTime.slice(0, 2)) : 9
  const minutes = normalizedTime ? Number(normalizedTime.slice(3, 5)) : 0
  const date = new Date(year, month - 1, day, hours, minutes, 0, 0)

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function getTaskReminderAt(
  task: Task,
  kind: TaskReminderKind,
): Date | null {
  const isDeadline = kind === "deadline"
  const dateValue = isDeadline ? task.deadline : task.followUpDate
  const timeValue = isDeadline ? task.deadlineTime : task.followUpTime
  const preset = isDeadline ? task.deadlineReminder : task.followUpReminder

  if (!dateValue || !preset) return null

  const target = localTargetDate(dateValue, timeValue)
  if (!target) return null

  if (preset === "morning") {
    const morning = localTargetDate(dateValue)
    if (!morning) return null
    return normalizeTaskTime(timeValue) && target < morning ? target : morning
  }

  const minutesBefore = REMINDER_MINUTES[preset]
  if (minutesBefore === undefined) return null

  return new Date(target.getTime() - minutesBefore * 60_000)
}

export function getTaskReminderTargetLabel(
  task: Task,
  kind: TaskReminderKind,
): string {
  if (kind === "deadline") {
    return formatTaskScheduleLabel(task.deadline, task.deadlineTime)
  }
  return formatTaskScheduleLabel(task.followUpDate, task.followUpTime)
}
