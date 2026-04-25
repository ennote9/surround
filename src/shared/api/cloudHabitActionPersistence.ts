import type { AppAction } from "@/store/actions"
import type { Habit } from "@/store/appState.types"
import {
  createHabit,
  deleteHabit,
  updateHabit,
} from "./repositories/habitsRepository"
import { upsertHabitLog } from "./repositories/habitLogsRepository"
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function sanitizeAddHabitPayload(
  payload: Extract<AppAction, { type: "ADD_HABIT" }>["payload"],
): Habit | null {
  const name = payload.name.trim()
  if (!name) {
    return null
  }

  const now = new Date().toISOString()
  return {
    id: payload.id ?? "",
    name,
    description: payload.description?.trim() || undefined,
    dailyStatus: {},
    createdAt: payload.createdAt ?? now,
    updatedAt: payload.updatedAt ?? now,
  }
}

function sanitizeUpdateHabitPatch(
  patch: Extract<AppAction, { type: "UPDATE_HABIT" }>["payload"]["patch"],
): Partial<Habit> {
  const next: Partial<Habit> = {}
  if (patch.name !== undefined) {
    const name = patch.name.trim()
    if (name) {
      next.name = name
    }
  }
  if (patch.description !== undefined) {
    next.description = patch.description?.trim() || undefined
  }
  return next
}

export async function persistHabitAction(
  userId: string,
  action: AppAction,
): Promise<RepositoryResult<null>> {
  if (action.type === "ADD_HABIT") {
    const habit = sanitizeAddHabitPayload(action.payload)
    if (!habit) {
      return repositorySuccess(null)
    }
    if (!habit.id) {
      return repositoryFailure(
        "Не удалось сохранить привычку: отсутствует id привычки.",
      )
    }

    const result = await createHabit(userId, habit)
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  if (action.type === "UPDATE_HABIT") {
    const patch = sanitizeUpdateHabitPatch(action.payload.patch)
    if (Object.keys(patch).length === 0) {
      return repositorySuccess(null)
    }

    const result = await updateHabit(userId, action.payload.id, patch)
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  if (action.type === "DELETE_HABIT") {
    const result = await deleteHabit(userId, action.payload.id)
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  if (action.type === "TOGGLE_HABIT_DATE") {
    if (!DATE_ONLY_PATTERN.test(action.payload.date)) {
      return repositoryFailure("Некорректная дата привычки: ожидается YYYY-MM-DD.")
    }
    if (typeof action.payload.completed !== "boolean") {
      return repositoryFailure(
        "Не удалось сохранить отметку привычки: отсутствует completed.",
      )
    }

    const result = await upsertHabitLog(
      userId,
      action.payload.id,
      action.payload.date,
      action.payload.completed,
    )
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  return repositorySuccess(null)
}
