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

export function getHabitWeeklyCompliance(
  habit: Habit,
  weekDates: string[],
): number {
  const done = weekDates.filter((d) => habit.dailyStatus[d] === true).length
  return Math.round((done / 7) * 100)
}

export function getHabitTotalCompliance(habit: Habit): number {
  const dates = Object.keys(habit.dailyStatus)
  if (dates.length === 0) return 0
  const trueCount = dates.filter((d) => habit.dailyStatus[d] === true).length
  return pct(trueCount, dates.length)
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
