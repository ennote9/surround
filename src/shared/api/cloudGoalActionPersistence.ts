import type { AddGoalPayload, AppAction } from "@/store/actions"
import type { Goal } from "@/store/appState.types"
import {
  archiveGoal,
  createGoal,
  updateGoal,
} from "./repositories/goalsRepository"
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

function sanitizeAddGoalPayload(p: AddGoalPayload): Goal | null {
  const title = p.title.trim()
  if (!title) {
    return null
  }

  const now = new Date().toISOString()

  return {
    id: p.id ?? "",
    title,
    description: p.description?.trim() || undefined,
    targetDate: p.targetDate?.trim() || undefined,
    status: p.status ?? "active",
    showOnDashboard: p.showOnDashboard ?? true,
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
  }
}

function sanitizeUpdateGoalPatch(
  patch: Extract<AppAction, { type: "UPDATE_GOAL" }>["payload"]["patch"],
): Partial<Goal> {
  const next: Partial<Goal> = {}

  if (patch.title !== undefined) {
    const trimmed = patch.title.trim()
    if (trimmed) {
      next.title = trimmed
    }
  }

  if (patch.description !== undefined) {
    next.description = patch.description.trim() || undefined
  }

  if (patch.targetDate !== undefined) {
    next.targetDate = patch.targetDate.trim() || undefined
  }

  if (patch.status !== undefined) {
    next.status = patch.status
  }

  if (patch.showOnDashboard !== undefined) {
    next.showOnDashboard = patch.showOnDashboard
  }

  return next
}

export async function persistGoalAction(
  userId: string,
  action: AppAction,
): Promise<RepositoryResult<null>> {
  if (action.type === "ADD_GOAL") {
    const goal = sanitizeAddGoalPayload(action.payload)
    if (!goal) {
      return repositorySuccess(null)
    }

    if (!goal.id) {
      return repositoryFailure("Не удалось сохранить цель: отсутствует id цели.")
    }

    const result = await createGoal(userId, goal)
    if (result.error) {
      return repositoryFailure(result.error)
    }
    return repositorySuccess(null)
  }

  if (action.type === "UPDATE_GOAL") {
    const patch = sanitizeUpdateGoalPatch(action.payload.patch)
    if (Object.keys(patch).length === 0) {
      return repositorySuccess(null)
    }

    const result = await updateGoal(userId, action.payload.goalId, patch)
    if (result.error) {
      return repositoryFailure(result.error)
    }
    return repositorySuccess(null)
  }

  if (action.type === "ARCHIVE_GOAL") {
    const result = await archiveGoal(userId, action.payload.goalId)
    if (result.error) {
      return repositoryFailure(result.error)
    }
    return repositorySuccess(null)
  }

  return repositorySuccess(null)
}
