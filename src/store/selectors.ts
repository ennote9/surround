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

export function getHabitTargetPerWeek(habit: Habit): number {
  const raw = habit.schedule?.targetPerWeek
  if (typeof raw !== "number" || !Number.isFinite(raw)) {
    return 7
  }
  return Math.max(1, Math.min(7, Math.round(raw)))
}

export function getHabitWeeklyCompleted(
  habit: Habit,
  weekDates: string[],
): number {
  return weekDates.filter((date) => habit.dailyStatus[date] === true).length
}

export function getHabitWeeklyCompliance(
  habit: Habit,
  weekDates: string[],
): number {
  const target = getHabitTargetPerWeek(habit)
  const completed = getHabitWeeklyCompleted(habit, weekDates)
  return pct(Math.min(completed, target), target)
}

function dateOnlyFromDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
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

/**
 * Schedule-aware compliance from habit creation through today.
 * Missing days are treated as not completed; untouched dates no longer disappear
 * from the denominator. Partial first/current weeks are prorated by elapsed days.
 */
export function getHabitTotalCompliance(habit: Habit): number {
  const created = new Date(habit.createdAt)
  if (Number.isNaN(created.getTime())) return 0

  const today = new Date()
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const createdDate = new Date(
    created.getFullYear(),
    created.getMonth(),
    created.getDate(),
  )
  if (createdDate > todayDate) return 0

  const weeklyTarget = getHabitTargetPerWeek(habit)
  let expectedTotal = 0
  let completedTotal = 0

  for (
    let weekStart = mondayOf(createdDate);
    weekStart <= todayDate;
    weekStart = addDays(weekStart, 7)
  ) {
    const weekEnd = addDays(weekStart, 6)
    const activeStart = createdDate > weekStart ? createdDate : weekStart
    const activeEnd = todayDate < weekEnd ? todayDate : weekEnd
    const activeDays =
      Math.floor((activeEnd.getTime() - activeStart.getTime()) / 86400000) + 1

    if (activeDays <= 0) continue

    const expected = Math.max(
      1,
      Math.min(
        weeklyTarget,
        Math.ceil((weeklyTarget * activeDays) / 7),
      ),
    )
    let completed = 0
    for (let day = new Date(activeStart); day <= activeEnd; day = addDays(day, 1)) {
      if (habit.dailyStatus[dateOnlyFromDate(day)] === true) {
        completed += 1
      }
    }

    expectedTotal += expected
    completedTotal += Math.min(completed, expected)
  }

  return pct(completedTotal, expectedTotal)
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
