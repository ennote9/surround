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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Безопасно объединяет снимок из `user_settings.settings` с дефолтом.
 * Лишние ключи из JSON не ломают `AppSettings`: берём только theme + accentColor.
 */
function resolveSettings(settings: Record<string, unknown> | null): AppSettings {
  if (!settings || !isRecord(settings)) {
    return initialAppState.settings
  }

  const merged = { ...initialAppState.settings, ...settings }
  const theme =
    merged.theme === "light" || merged.theme === "dark" || merged.theme === "system"
      ? merged.theme
      : initialAppState.settings.theme
  const accentColor =
    typeof merged.accentColor === "string" && merged.accentColor.trim() !== ""
      ? merged.accentColor
      : initialAppState.settings.accentColor
  const workspaceMode =
    merged.workspaceMode === "work" || merged.workspaceMode === "personal"
      ? merged.workspaceMode
      : "all"

  const workInbox = Array.isArray(merged.workInbox)
    ? merged.workInbox.flatMap((item) => {
        if (!isRecord(item)) return []
        const id = typeof item.id === "string" ? item.id.trim() : ""
        const title = typeof item.title === "string" ? item.title.trim() : ""
        const createdAt =
          typeof item.createdAt === "string" && item.createdAt.trim()
            ? item.createdAt
            : new Date().toISOString()
        return id && title ? [{ id, title, createdAt }] : []
      })
    : []

  const dailyFocus: Record<string, string[]> = {}
  if (isRecord(merged.dailyFocus)) {
    for (const [date, ids] of Object.entries(merged.dailyFocus)) {
      if (!Array.isArray(ids)) continue
      dailyFocus[date] = [
        ...new Set(ids.filter((id): id is string => typeof id === "string" && id.trim() !== "")),
      ].slice(0, 3)
    }
  }

  const workWipLimit =
    typeof merged.workWipLimit === "number" && Number.isFinite(merged.workWipLimit)
      ? Math.max(1, Math.min(12, Math.round(merged.workWipLimit)))
      : 4

  const workWeeklyReviews: AppSettings["workWeeklyReviews"] = {}
  if (isRecord(merged.workWeeklyReviews)) {
    for (const [week, value] of Object.entries(merged.workWeeklyReviews)) {
      if (!isRecord(value) || typeof value.reviewedAt !== "string") continue
      workWeeklyReviews[week] = {
        reviewedAt: value.reviewedAt,
        ...(typeof value.wins === "string" && value.wins.trim()
          ? { wins: value.wins.trim() }
          : {}),
        ...(typeof value.blockers === "string" && value.blockers.trim()
          ? { blockers: value.blockers.trim() }
          : {}),
        ...(typeof value.decisions === "string" && value.decisions.trim()
          ? { decisions: value.decisions.trim() }
          : {}),
        ...(typeof value.nextWeek === "string" && value.nextWeek.trim()
          ? { nextWeek: value.nextWeek.trim() }
          : {}),
      }
    }
  }

  const workDayClosures: AppSettings["workDayClosures"] = {}
  if (isRecord(merged.workDayClosures)) {
    for (const [date, value] of Object.entries(merged.workDayClosures)) {
      if (!isRecord(value) || typeof value.closedAt !== "string") continue
      workDayClosures[date] = {
        closedAt: value.closedAt,
        ...(typeof value.note === "string" && value.note.trim()
          ? { note: value.note.trim() }
          : {}),
      }
    }
  }

  return {
    theme,
    accentColor,
    workspaceMode,
    workInbox,
    dailyFocus,
    workDayClosures,
    workWipLimit,
    workWeeklyReviews,
  }
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
