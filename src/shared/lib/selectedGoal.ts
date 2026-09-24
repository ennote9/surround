import type { Goal, Habit, Project } from "@/store/appState.types"

export const ALL_GOALS_SCOPE = "all" as const

export type SelectedGoalScope = typeof ALL_GOALS_SCOPE | string

export function normalizeSelectedGoalId(
  value: unknown,
  goals: Goal[],
): SelectedGoalScope {
  if (value === ALL_GOALS_SCOPE) {
    return ALL_GOALS_SCOPE
  }

  if (typeof value !== "string" || !value.trim()) {
    return ALL_GOALS_SCOPE
  }

  const goalId = value.trim()
  const existsAndNotArchived = goals.some(
    (goal) => goal.id === goalId && goal.status !== "archived",
  )

  return existsAndNotArchived ? goalId : ALL_GOALS_SCOPE
}

export function getSelectableGoals(goals: Goal[]): Goal[] {
  return goals
    .filter((goal) => goal.status !== "archived")
    .sort((a, b) => {
      const statusPriority = { active: 0, later: 1, archived: 2 } as const
      const statusDiff = statusPriority[a.status] - statusPriority[b.status]

      if (statusDiff !== 0) {
        return statusDiff
      }

      return a.title.localeCompare(b.title, "ru")
    })
}

export function getSelectedGoalTitle(
  selectedGoalId: SelectedGoalScope,
  goals: Goal[],
): string {
  if (selectedGoalId === ALL_GOALS_SCOPE) {
    return "Все активные цели"
  }

  return goals.find((goal) => goal.id === selectedGoalId)?.title ?? "Все активные цели"
}

const NO_GOAL_LABEL = "Без цели" as const

/**
 * Проект без привязки к существующей цели: нет `goalId`, пусто, ссылка на
 * удалённую цель, или `goalId` не найден в `goals`.
 * Не считать «сиротой» проект, привязанный к архивной цели: такие цели в «Все»
 * по-прежнему не показываются.
 */
export function isProjectUnassigned(project: Project, goals: Goal[]): boolean {
  const raw = project.goalId
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    return true
  }
  const id = String(raw).trim()
  return !goals.some((g) => g.id === id)
}

export function getProjectGoalLabel(project: Project, goals: Goal[]): string {
  const raw = project.goalId?.trim()
  if (!raw) return NO_GOAL_LABEL
  const goal = goals.find((g) => g.id === raw)
  if (!goal) return NO_GOAL_LABEL
  return goal.title
}

/**
 * «Все активные цели»: проекты только целей со статусом active + проекты без цели/с
 * «потерянной» ссылкой, чтобы они не становились недоступными в UI.
 * Цели later доступны для явного выбора, но не входят в общий активный контекст.
 * Конкретная цель: только `project.goalId === selectedGoalId`.
 */
export function getScopedProjectsForSelectedGoal(
  projects: Project[],
  selectedGoalId: SelectedGoalScope,
  goals: Goal[],
): Project[] {
  if (selectedGoalId === ALL_GOALS_SCOPE) {
    const activeGoalIds = new Set(
      goals.filter((goal) => goal.status === "active").map((goal) => goal.id),
    )
    return projects.filter((project) => {
      const raw = project.goalId?.trim()
      if (!raw) {
        return true
      }
      if (!goals.some((g) => g.id === raw)) {
        return true
      }
      return activeGoalIds.has(raw)
    })
  }
  const sid = String(selectedGoalId).trim()
  return projects.filter(
    (project) => (project.goalId?.trim() ?? "") === sid,
  )
}


/**
 * Привычки в контексте выбранной цели:
 * - привязанные к проекту — только если проект входит в текущий scope;
 * - привязанные напрямую к цели — по выбранной цели;
 * - глобальные — только в режиме «Все активные цели».
 */
export function getScopedHabitsForSelectedGoal(
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
    const projectId = habit.projectId?.trim()
    if (projectId) {
      return projectIds.has(projectId)
    }

    const goalId = habit.goalId?.trim()
    if (goalId) {
      return selectedGoalId === ALL_GOALS_SCOPE
        ? activeGoalIds.has(goalId)
        : goalId === selectedGoalId
    }

    return selectedGoalId === ALL_GOALS_SCOPE
  })
}
