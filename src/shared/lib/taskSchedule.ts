import type { Task } from "@/store/appState.types"
import { formatDateOnly } from "./dateFormat"
import { getTodayISO } from "./dates"

const TIME_RE = /^(\d{2}):(\d{2})/

export function normalizeTaskTime(value?: string | null): string | undefined {
  if (!value) return undefined
  const match = value.trim().match(TIME_RE)
  if (!match) return undefined
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return undefined
  }
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`
}

function parseDateOnlyLocal(value: string): Date | null {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
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

function localDateTime(value: string, time?: string): Date | null {
  const date = parseDateOnlyLocal(value)
  if (!date) return null
  const normalized = normalizeTaskTime(time)
  if (!normalized) return date
  const [hours, minutes] = normalized.split(":").map(Number)
  date.setHours(hours, minutes, 0, 0)
  return date
}

function tomorrowISO(reference: Date): string {
  const next = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate() + 1,
  )
  const year = next.getFullYear()
  const month = String(next.getMonth() + 1).padStart(2, "0")
  const day = String(next.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function formatTaskScheduleLabel(
  date?: string,
  time?: string,
  reference: Date = new Date(),
): string {
  if (!date) return ""
  const dateOnly = date.slice(0, 10)
  const today = getTodayISO()
  const tomorrow = tomorrowISO(reference)
  const dateLabel =
    dateOnly === today
      ? "Сегодня"
      : dateOnly === tomorrow
        ? "Завтра"
        : formatDateOnly(dateOnly)
  const normalizedTime = normalizeTaskTime(time)
  return normalizedTime ? `${dateLabel} · ${normalizedTime}` : dateLabel
}

/**
 * Дедлайн без времени считается сроком «до конца указанного дня».
 * Поэтому он становится просроченным только со следующего календарного дня.
 */
export function isTaskOverdue(task: Task, now: Date = new Date()): boolean {
  if (task.completed || !task.deadline) return false
  const deadlineDate = task.deadline.slice(0, 10)
  const deadlineTime = normalizeTaskTime(task.deadlineTime)
  if (!deadlineTime) {
    return deadlineDate < getTodayISO()
  }
  const at = localDateTime(deadlineDate, deadlineTime)
  return at ? now.getTime() > at.getTime() : false
}

/**
 * Контроль без времени считается наступившим с начала указанной даты.
 */
export function isTaskControlDue(task: Task, now: Date = new Date()): boolean {
  if (!task.followUpDate) return false
  const controlDate = task.followUpDate.slice(0, 10)
  const controlTime = normalizeTaskTime(task.followUpTime)
  if (!controlTime) {
    return controlDate <= getTodayISO()
  }
  const at = localDateTime(controlDate, controlTime)
  return at ? now.getTime() >= at.getTime() : false
}

function scheduleSortKey(date?: string, time?: string): string {
  if (!date) return "9999-99-99T99:99"
  const normalizedTime = normalizeTaskTime(time)
  // Дата без времени идёт после задач с точным временем в тот же день.
  return `${date.slice(0, 10)}T${normalizedTime ?? "24:00"}`
}

export function compareTasksByDeadline(a: Task, b: Task): number {
  return scheduleSortKey(a.deadline, a.deadlineTime).localeCompare(
    scheduleSortKey(b.deadline, b.deadlineTime),
  )
}

export function compareTasksByControl(a: Task, b: Task): number {
  return scheduleSortKey(a.followUpDate, a.followUpTime).localeCompare(
    scheduleSortKey(b.followUpDate, b.followUpTime),
  )
}
