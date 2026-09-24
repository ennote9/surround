import type {
  Goal,
  Habit,
  Milestone,
  Project,
} from "@/store/appState.types"
import type { SelectedGoalScope } from "@/shared/lib/selectedGoal"
import { ALL_GOALS_SCOPE } from "@/shared/lib/selectedGoal"
import {
  getHabitWeeklyCompleted,
  getHabitWeeklyTarget,
  getOverallProgress,
  getProjectTaskStats,
} from "@/store/selectors"

export type TaskAggregate = {
  total: number
  completed: number
  pending: number
}

export function aggregateTasks(projects: Project[]): TaskAggregate {
  return projects.reduce(
    (acc, project) => {
      const stats = getProjectTaskStats(project)
      acc.total += stats.total
      acc.completed += stats.completed
      acc.pending += stats.pending
      return acc
    },
    { total: 0, completed: 0, pending: 0 },
  )
}

export function getCurrentProjects(projects: Project[]): Project[] {
  return projects.filter(
    (project) => project.phase === undefined || project.phase === "active",
  )
}

export function getPhaseCounts(projects: Project[]) {
  return projects.reduce(
    (acc, project) => {
      const phase = project.phase ?? "active"
      acc[phase] += 1
      return acc
    },
    { active: 0, later: 0, strategic: 0 },
  )
}

export function getScopedHabits(
  habits: Habit[],
  scopedProjects: Project[],
  selectedGoalId: SelectedGoalScope,
  goals: Goal[],
): Habit[] {
  const projectIds = new Set(scopedProjects.map((project) => project.id))
  const activeGoalIds = new Set(
    goals.filter((goal) => goal.status === "active").map((goal) => goal.id),
  )

  return habits.filter((habit) => {
    if (habit.projectId) {
      return projectIds.has(habit.projectId)
    }

    if (habit.goalId) {
      return selectedGoalId === ALL_GOALS_SCOPE
        ? activeGoalIds.has(habit.goalId)
        : habit.goalId === selectedGoalId
    }

    // Глобальные привычки участвуют только в общем контексте, чтобы не
    // искажать аналитику конкретной цели.
    return selectedGoalId === ALL_GOALS_SCOPE
  })
}

export function getWeeklyHabitSummary(habits: Habit[], weekDates: string[]) {
  let target = 0
  let completed = 0

  for (const habit of habits) {
    const habitTarget = getHabitWeeklyTarget(habit, weekDates)
    const habitCompleted = getHabitWeeklyCompleted(habit, weekDates)
    target += habitTarget
    completed += Math.min(habitCompleted, habitTarget)
  }

  return {
    target,
    completed,
    progress: target === 0 ? 0 : Math.round((completed / target) * 100),
  }
}

export function getPlanningSummary(projects: Project[], todayISO: string) {
  let tasks = 0
  let tasksWithDeadline = 0
  let overdue = 0
  let projectsWithTargetDate = 0

  for (const project of projects) {
    if (project.targetDate) projectsWithTargetDate += 1

    for (const group of project.groups) {
      for (const task of group.tasks) {
        tasks += 1
        if (task.deadline) {
          tasksWithDeadline += 1
          if (!task.completed && task.deadline.slice(0, 10) < todayISO) {
            overdue += 1
          }
        }
      }
    }
  }

  return {
    tasks,
    tasksWithDeadline,
    deadlineCoverage:
      tasks === 0 ? 0 : Math.round((tasksWithDeadline / tasks) * 100),
    overdue,
    projects: projects.length,
    projectsWithTargetDate,
    projectDateCoverage:
      projects.length === 0
        ? 0
        : Math.round((projectsWithTargetDate / projects.length) * 100),
  }
}

export function getScopedMilestones(
  milestones: Milestone[],
  goals: Goal[],
  scopedProjects: Project[],
  selectedGoalId: SelectedGoalScope,
): Milestone[] {
  const projectIds = new Set(scopedProjects.map((project) => project.id))

  let goalIds: Set<string>
  if (selectedGoalId === ALL_GOALS_SCOPE) {
    goalIds = new Set(
      goals
        .filter((goal) => goal.status === "active")
        .map((goal) => goal.id),
    )
  } else {
    goalIds = new Set([String(selectedGoalId)])
  }

  return milestones.filter((milestone) => {
    if (milestone.projectId) return projectIds.has(milestone.projectId)
    if (milestone.goalId) return goalIds.has(milestone.goalId)
    return false
  })
}

export function getMilestoneSummary(milestones: Milestone[]) {
  const total = milestones.length
  const completed = milestones.filter((milestone) => milestone.completed).length
  return {
    total,
    completed,
    pending: total - completed,
    progress: total === 0 ? 0 : Math.round((completed / total) * 100),
  }
}

export function getAnalyticsSummary(
  scopedProjects: Project[],
  habits: Habit[],
  weekDates: string[],
  todayISO: string,
) {
  const currentProjects = getCurrentProjects(scopedProjects)
  const currentTasks = aggregateTasks(currentProjects)
  const portfolioTasks = aggregateTasks(scopedProjects)

  return {
    currentProjects,
    currentTasks,
    currentProgress: getOverallProgress(currentProjects),
    portfolioTasks,
    portfolioProgress: getOverallProgress(scopedProjects),
    phases: getPhaseCounts(scopedProjects),
    habits: getWeeklyHabitSummary(habits, weekDates),
    planning: getPlanningSummary(currentProjects, todayISO),
  }
}
