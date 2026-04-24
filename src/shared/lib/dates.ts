import { addDays, format, startOfWeek } from "date-fns"

/** 7 дат YYYY-MM-DD от понедельника недели для заданного понедельника `weekStartMonday`. */
export function getWeekISODatesFromMonday(weekStartMonday: Date): string[] {
  const monday = startOfWeek(weekStartMonday, { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(monday, i), "yyyy-MM-dd"),
  )
}

export function getTodayISO(): string {
  return format(new Date(), "yyyy-MM-dd")
}

export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function isSameISODate(a?: string, b?: string): boolean {
  if (a === undefined || b === undefined) return false
  return a === b
}

/** Понедельник — первый день недели (ISO week context: календарная неделя с пн). */
export function getCurrentWeekDates(): string[] {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(start, i), "yyyy-MM-dd"),
  )
}
