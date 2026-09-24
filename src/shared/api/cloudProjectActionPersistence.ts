import type { AppAction } from "@/store/actions"
import type { Project } from "@/store/appState.types"
import {
  createProject,
  deleteProject,
  updateProject,
} from "./repositories/projectsRepository"
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

function sanitizeAddProjectPayload(
  payload: Extract<AppAction, { type: "ADD_PROJECT" }>["payload"],
): Project | null {
  const title = payload.title.trim()
  if (!title) {
    return null
  }

  const now = new Date().toISOString()

  const raw = payload.goalId
  const goalId: string | undefined =
    raw === undefined || String(raw).trim() === ""
      ? undefined
      : String(raw).trim()

  return {
    id: payload.id ?? "",
    goalId,
    title,
    description: payload.description?.trim() || undefined,
    targetDate: payload.targetDate?.trim() || undefined,
    showOnDashboard: payload.showOnDashboard ?? true,
    statType: payload.statType,
    phase: payload.phase ?? "active",
    groups: [],
    createdAt: payload.createdAt ?? now,
    updatedAt: payload.updatedAt ?? now,
  }
}

function sanitizeUpdateProjectPatch(
  patch: Extract<AppAction, { type: "UPDATE_PROJECT" }>["payload"]["patch"],
): Partial<Project> {
  const next: Partial<Project> = {}

  if (patch.title !== undefined) {
    const title = patch.title.trim()
    if (title) {
      next.title = title
    }
  }
  if ("goalId" in patch) next.goalId = patch.goalId?.trim() || undefined
  if ("description" in patch) {
    next.description = patch.description?.trim() || undefined
  }
  if (patch.showOnDashboard !== undefined) {
    next.showOnDashboard = patch.showOnDashboard
  }
  if ("statType" in patch) next.statType = patch.statType
  if ("phase" in patch) next.phase = patch.phase
  if ("targetDate" in patch) {
    next.targetDate = patch.targetDate?.trim() || undefined
  }

  return next
}

export async function persistProjectAction(
  userId: string,
  action: AppAction,
): Promise<RepositoryResult<null>> {
  if (action.type === "ADD_PROJECT") {
    const project = sanitizeAddProjectPayload(action.payload)
    if (!project) {
      return repositorySuccess(null)
    }
    if (!project.id) {
      return repositoryFailure("Не удалось сохранить проект: отсутствует id проекта.")
    }

    const result = await createProject(userId, project)
    if (result.error) {
      return repositoryFailure(result.error)
    }
    return repositorySuccess(null)
  }

  if (action.type === "UPDATE_PROJECT") {
    const patch = sanitizeUpdateProjectPatch(action.payload.patch)
    if (Object.keys(patch).length === 0) {
      return repositorySuccess(null)
    }

    const result = await updateProject(userId, action.payload.id, patch)
    if (result.error) {
      return repositoryFailure(result.error)
    }
    return repositorySuccess(null)
  }

  if (action.type === "DELETE_PROJECT") {
    const result = await deleteProject(userId, action.payload.id)
    if (result.error) {
      return repositoryFailure(result.error)
    }
    return repositorySuccess(null)
  }

  return repositorySuccess(null)
}
