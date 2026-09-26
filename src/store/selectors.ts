import { getTodayISO } from "@/shared/lib/dates"
import type { Habit, Project, Task, TaskGroup } from "./appState.types"

function pct(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export function getGroupProgress(group: TaskGroup): number {
  const total = group.tasks.length
  if (total === 0) return 0
  const completed = group.tasks.filter((t) => t.completed).length
  return pct(completed, total)
}

export function getProjectProgress(project: Project): number {
  let total = 0
  let completed = 0
  for (const g of project.groups) {
    for (const t of g.tasks) {
      total += 1
      if (t.completed) completed += 1
    }
  }
  return pct(completed, total)
}

export function getOverallProgress(projects: Project[]): number {
  let total = 0
  let completed = 0
  for (const p of projects) {
    for (const g of p.groups) {
      for (const t of g.tasks) {
        total += 1
        if (t.completed) completed += 1
      }
    }
  }
  return pct(completed, total)
}

export type TodayTaskRow = {
  task: Task
  project: Project
  group: TaskGroup
}

export function getTodayTasks(projects: Project[]): TodayTaskRow[] {
  const today = getTodayISO()
  const rows: TodayTaskRow[] = []
  for (const project of projects) {
    for (const group of project.groups) {
      for (const task of group.tasks) {
        if (task.deadline === today) {
          rows.push({ task, project, group })
        }
      }
    }
  }
  return rows
}

export function getHabitScheduleMode(habit: Habit) {
  return habit.schedule?.mode ?? "times-per-week"
}

export function getHabitTargetPerWeek(habit: Habit): number {
  const mode = getHabitScheduleMode(habit)
  if (mode === "daily") return 7
  if (mode === "specific-days") {
    const days = habit.schedule?.daysOfWeek
    if (Array.isArray(days) && days.length > 0) {
      return Math.max(1, Math.min(7, new Set(days).size))
    }
  }
  const raw = habit.schedule?.targetPerWeek
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return 7
  }
  return Math.max(1, Math.min(7, Math.round(raw)))
}

function dateOnlyFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function parseDateOnly(value: string): Date | null {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return null
  const date = new Date(year, month - 1, day)
  return Number.isNaN(date.getTime()) ? null : date
}

function isoWeekday(dateOnly: string): number {
  const date = parseDateOnly(dateOnly)
  if (!date) return 1
  const day = date.getDay()
  return day === 0 ? 7 : day
}

export function isHabitActiveOnDate(habit: Habit, date: string): boolean {
  if (habit.settings?.period?.paused) return false
  const startDate = habit.settings?.period?.startDate
  const endDate = habit.settings?.period?.endDate
  const createdDate = habit.createdAt.slice(0, 10)

  if (createdDate && date < createdDate) return false
  if (startDate && date < startDate) return false
  if (endDate && date > endDate) return false
  return true
}

export function isHabitScheduledOnDate(habit: Habit, date: string): boolean {
  if (!isHabitActiveOnDate(habit, date)) return false
  const mode = getHabitScheduleMode(habit)
  if (mode === "daily") return true
  if (mode === "specific-days") {
    const days = habit.schedule?.daysOfWeek ?? []
    return days.includes(isoWeekday(date))
  }
  return true
}

export function getHabitWeeklyTarget(
  habit: Habit,
  weekDates: string[],
): number {
  if (habit.settings?.period?.paused) return 0
  const activeDates = weekDates.filter((date) => isHabitActiveOnDate(habit, date))
  if (activeDates.length === 0) return 0

  const mode = getHabitScheduleMode(habit)
  if (mode === "daily") return activeDates.length
  if (mode === "specific-days") {
    return activeDates.filter((date) => isHabitScheduledOnDate(habit, date)).length
  }
  return Math.min(getHabitTargetPerWeek(habit), activeDates.length)
}

export function getHabitWeeklyCompleted(
  habit: Habit,
  weekDates: string[],
): number {
  const mode = getHabitScheduleMode(habit)
  return weekDates.filter((date) => {
    if (!isHabitActiveOnDate(habit, date)) return false
    if (mode === "specific-days" || mode === "daily") {
      if (!isHabitScheduledOnDate(habit, date)) return false
    }
    return habit.dailyStatus[date] === true
  }).length
}

export function getHabitWeeklyCompliance(
  habit: Habit,
  weekDates: string[],
): number {
  const target = getHabitWeeklyTarget(habit, weekDates)
  if (target === 0) return 0
  const completed = getHabitWeeklyCompleted(habit, weekDates)
  return pct(Math.min(completed, target), target)
}

function mondayOf(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - weekday)
  return result
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function expectedForElapsedWeek(
  habit: Habit,
  elapsedDates: string[],
): number {
  if (elapsedDates.length === 0) return 0
  const mode = getHabitScheduleMode(habit)
  const activeDates = elapsedDates.filter((date) => isHabitActiveOnDate(habit, date))
  if (mode === "daily") return activeDates.length
  if (mode === "specific-days") {
    return activeDates.filter((date) => isHabitScheduledOnDate(habit, date)).length
  }
  const weeklyTarget = getHabitTargetPerWeek(habit)
  return Math.min(
    weeklyTarget,
    Math.ceil((weeklyTarget * activeDates.length) / 7),
  )
}

/**
 * Schedule-aware compliance from habit creation/start through today.
 * Current partial week is prorated for "times-per-week", while fixed weekdays
 * count only days that have already occurred.
 */
export function getHabitTotalCompliance(habit: Habit): number {
  if (habit.settings?.period?.paused) return 0

  const created = new Date(habit.createdAt)
  if (Number.isNaN(created.getTime())) return 0

  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const periodStart = habit.settings?.period?.startDate
    ? parseDateOnly(habit.settings.period.startDate)
    : null
  const createdDate = new Date(
    created.getFullYear(),
    created.getMonth(),
    created.getDate(),
  )
  const effectiveStart =
    periodStart && periodStart > createdDate ? periodStart : createdDate
  const periodEnd = habit.settings?.period?.endDate
    ? parseDateOnly(habit.settings.period.endDate)
    : null
  const effectiveEnd =
    periodEnd && periodEnd < todayDate ? periodEnd : todayDate

  if (!effectiveStart || effectiveStart > effectiveEnd) return 0

  let expectedTotal = 0
  let completedTotal = 0

  for (
    let weekStart = mondayOf(effectiveStart);
    weekStart <= effectiveEnd;
    weekStart = addDays(weekStart, 7)
  ) {
    const weekEnd = addDays(weekStart, 6)
    const activeStart = effectiveStart > weekStart ? effectiveStart : weekStart
    const activeEnd = effectiveEnd < weekEnd ? effectiveEnd : weekEnd
    const dates: string[] = []
    for (let day = new Date(activeStart); day <= activeEnd; day = addDays(day, 1)) {
      dates.push(dateOnlyFromDate(day))
    }

    const expected = expectedForElapsedWeek(habit, dates)
    const completed = getHabitWeeklyCompleted(habit, dates)
    expectedTotal += expected
    completedTotal += Math.min(completed, expected)
  }

  return pct(completedTotal, expectedTotal)
}

export function getHabitCompletionType(habit: Habit) {
  return habit.settings?.target?.type ?? "check"
}

export function getHabitTargetValue(habit: Habit): number | undefined {
  const value = habit.settings?.target?.targetValue
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined
}

export function getHabitMinimumValue(habit: Habit): number | undefined {
  const minimum = habit.settings?.target?.minimumValue
  const target = getHabitTargetValue(habit)
  if (typeof minimum === "number" && Number.isFinite(minimum) && minimum > 0) {
    return minimum
  }
  return target
}

export function getHabitUnit(habit: Habit): string {
  if (getHabitCompletionType(habit) === "duration") return "мин"
  return habit.settings?.target?.unit?.trim() || "ед."
}

export function getProjectTaskStats(project: Project): {
  total: number
  completed: number
  pending: number
} {
  let total = 0
  let completed = 0
  for (const g of project.groups) {
    for (const t of g.tasks) {
      total += 1
      if (t.completed) completed += 1
    }
  }
  return {
    total,
    completed,
    pending: total - completed,
  }
}

export function getProjectOverdueTaskCount(project: Project): number {
  const today = getTodayISO()
  let overdue = 0

  for (const group of project.groups) {
    for (const task of group.tasks) {
      if (!task.completed && task.deadline && task.deadline.slice(0, 10) < today) {
        overdue += 1
      }
    }
  }

  return overdue
}

export type ProjectNextTask = {
  task: Task
  group: TaskGroup
}

export function getProjectNextTask(project: Project): ProjectNextTask | undefined {
  const today = getTodayISO()
  const priorityWeight: Record<NonNullable<Task["priority"]>, number> = {
    high: 0,
    medium: 1,
    low: 2,
  }

  const candidates = project.groups.flatMap((group) =>
    group.tasks
      .filter((task) => !task.completed)
      .map((task, taskIndex) => ({
        task,
        group,
        taskIndex,
        groupOrder: group.order,
      })),
  )

  candidates.sort((a, b) => {
    const aDeadline = a.task.deadline?.slice(0, 10)
    const bDeadline = b.task.deadline?.slice(0, 10)
    const aOverdue = Boolean(aDeadline && aDeadline < today)
    const bOverdue = Boolean(bDeadline && bDeadline < today)

    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1

    if (aDeadline && bDeadline && aDeadline !== bDeadline) {
      return aDeadline.localeCompare(bDeadline)
    }
    if (aDeadline && !bDeadline) return -1
    if (!aDeadline && bDeadline) return 1

    const aPriority = a.task.priority ? priorityWeight[a.task.priority] : 3
    const bPriority = b.task.priority ? priorityWeight[b.task.priority] : 3
    if (aPriority !== bPriority) return aPriority - bPriority

    if (a.groupOrder !== b.groupOrder) return a.groupOrder - b.groupOrder
    return a.taskIndex - b.taskIndex
  })

  const next = candidates[0]
  return next ? { task: next.task, group: next.group } : undefined
}

export function getProjectsForGoal(projects: Project[], goalId: string): Project[] {
  return projects.filter((project) => project.goalId === goalId)
}

export function getGoalTaskStats(
  goalId: string,
  projects: Project[],
): {
  total: number
  completed: number
  pending: number
} {
  const goalProjects = getProjectsForGoal(projects, goalId)

  let total = 0
  let completed = 0

  for (const project of goalProjects) {
    for (const group of project.groups) {
      for (const task of group.tasks) {
        total += 1
        if (task.completed) completed += 1
      }
    }
  }

  return {
    total,
    completed,
    pending: total - completed,
  }
}

export function getGoalProgress(goalId: string, projects: Project[]): number {
  const stats = getGoalTaskStats(goalId, projects)
  return pct(stats.completed, stats.total)
}
