import type { Goal, Project } from "@/store/appState.types"

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
 * «Все активные цели»: проекты неснятых с просмотра целей + проекты без цели/с
 * «потерянной» ссылкой. Конкретная цель: только `project.goalId === selectedGoalId`.
 */
export function getScopedProjectsForSelectedGoal(
  projects: Project[],
  selectedGoalId: SelectedGoalScope,
  goals: Goal[],
): Project[] {
  if (selectedGoalId === ALL_GOALS_SCOPE) {
    const selectableGoals = getSelectableGoals(goals)
    const visibleGoalIds = new Set(selectableGoals.map((g) => g.id))
    return projects.filter((project) => {
      const raw = project.goalId?.trim()
      if (!raw) {
        return true
      }
      if (!goals.some((g) => g.id === raw)) {
        return true
      }
      return visibleGoalIds.has(raw)
    })
  }
  const sid = String(selectedGoalId).trim()
  return projects.filter(
    (project) => (project.goalId?.trim() ?? "") === sid,
  )
}
