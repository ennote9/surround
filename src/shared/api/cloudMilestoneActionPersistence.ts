import type { AppAction } from "@/store/actions"
import type { Milestone } from "@/store/appState.types"
import {
  createMilestone,
  deleteMilestone,
  updateMilestone,
} from "./repositories/milestonesRepository"
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

function sanitizeNewMilestonePayload(
  payload: Extract<AppAction, { type: "ADD_MILESTONE" }>["payload"],
): Milestone | null {
  const title = payload.title.trim()
  if (!title) {
    return null
  }

  const now = new Date().toISOString()
  return {
    id: payload.id ?? "",
    projectId: payload.projectId,
    title,
    date: payload.date,
    completed: payload.completed ?? false,
    createdAt: payload.createdAt ?? now,
    updatedAt: payload.updatedAt ?? now,
  }
}

function sanitizeMilestonePatch(
  patch: Extract<AppAction, { type: "UPDATE_MILESTONE" }>["payload"]["patch"],
): Partial<Milestone> {
  const next: Partial<Milestone> = {}
  if (patch.title !== undefined) {
    const title = patch.title.trim()
    if (title) next.title = title
  }
  if (patch.date !== undefined) next.date = patch.date
  if (patch.completed !== undefined) next.completed = patch.completed
  if (patch.projectId !== undefined) next.projectId = patch.projectId
  return next
}

export async function persistMilestoneAction(
  userId: string,
  action: AppAction,
): Promise<RepositoryResult<null>> {
  if (action.type === "ADD_MILESTONE") {
    const milestone = sanitizeNewMilestonePayload(action.payload)
    if (!milestone) return repositorySuccess(null)
    if (!milestone.id) {
      return repositoryFailure("Не удалось сохранить веху: отсутствует id вехи.")
    }

    const result = await createMilestone(userId, milestone)
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  if (action.type === "UPDATE_MILESTONE") {
    const patch = sanitizeMilestonePatch(action.payload.patch)
    if (Object.keys(patch).length === 0) {
      return repositorySuccess(null)
    }
    const result = await updateMilestone(userId, action.payload.id, patch)
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  if (action.type === "TOGGLE_MILESTONE") {
    if (typeof action.payload.completed !== "boolean") {
      return repositoryFailure(
        "Не удалось сохранить веху: отсутствует completed для toggle.",
      )
    }
    const result = await updateMilestone(userId, action.payload.id, {
      completed: action.payload.completed,
    })
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  if (action.type === "DELETE_MILESTONE") {
    const result = await deleteMilestone(userId, action.payload.id)
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  return repositorySuccess(null)
}
