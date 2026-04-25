import type { Goal } from "@/store/appState.types"

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
