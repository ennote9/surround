import type { AppSettings, AppState } from "@/store/appState.types"
import { initialAppState } from "@/store/initialState"
import { listGoals } from "./repositories/goalsRepository"
import { listProjects } from "./repositories/projectsRepository"
import { listHabits } from "./repositories/habitsRepository"
import { listMilestones } from "./repositories/milestonesRepository"
import { getUserSettings } from "./repositories/userSettingsRepository"
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

function isAppSettings(value: unknown): value is AppSettings {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false
  }

  const maybe = value as { theme?: unknown; accentColor?: unknown }
  const isThemeValid =
    maybe.theme === "light" || maybe.theme === "dark" || maybe.theme === "system"

  return isThemeValid && typeof maybe.accentColor === "string"
}

function resolveSettings(settings: Record<string, unknown> | null): AppSettings {
  if (settings && isAppSettings(settings)) {
    return settings
  }
  return initialAppState.settings
}

export async function loadCloudAppState(
  userId: string,
): Promise<RepositoryResult<AppState>> {
  const goalsResult = await listGoals(userId)
  if (goalsResult.error) {
    return repositoryFailure(`Не удалось загрузить цели: ${goalsResult.error}`)
  }

  const projectsResult = await listProjects(userId)
  if (projectsResult.error) {
    return repositoryFailure(`Не удалось загрузить проекты: ${projectsResult.error}`)
  }

  const habitsResult = await listHabits(userId)
  if (habitsResult.error) {
    return repositoryFailure(`Не удалось загрузить привычки: ${habitsResult.error}`)
  }

  const milestonesResult = await listMilestones(userId)
  if (milestonesResult.error) {
    return repositoryFailure(`Не удалось загрузить вехи: ${milestonesResult.error}`)
  }

  const settingsResult = await getUserSettings(userId)
  if (settingsResult.error) {
    return repositoryFailure(
      `Не удалось загрузить настройки пользователя: ${settingsResult.error}`,
    )
  }

  const goals = goalsResult.data ?? []
  const projects = projectsResult.data ?? []
  const habits = habitsResult.data ?? []
  const milestones = milestonesResult.data ?? []

  return repositorySuccess({
    version: 2,
    settings: resolveSettings(settingsResult.data),
    goals,
    projects,
    habits,
    milestones,
  })
}
