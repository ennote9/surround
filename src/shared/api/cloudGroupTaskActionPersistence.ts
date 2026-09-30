import type { AppAction } from "@/store/actions"
import type { Task } from "@/store/appState.types"
import {
  createProjectGroup,
  deleteProjectGroup,
  updateProjectGroup,
} from "./repositories/projectGroupsRepository"
import {
  clearProjectNextActions,
  createTask,
  deleteTask,
  toggleTaskCompleted,
  updateTask,
} from "./repositories/tasksRepository"
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

type AddGroupAction = Extract<AppAction, { type: "ADD_GROUP" }>
type UpdateGroupAction = Extract<AppAction, { type: "UPDATE_GROUP" }>
type DeleteGroupAction = Extract<AppAction, { type: "DELETE_GROUP" }>
type AddTaskAction = Extract<AppAction, { type: "ADD_TASK" }>
type UpdateTaskAction = Extract<AppAction, { type: "UPDATE_TASK" }>
type ToggleTaskAction = Extract<AppAction, { type: "TOGGLE_TASK" }>
type DeleteTaskAction = Extract<AppAction, { type: "DELETE_TASK" }>

function sanitizeNewTaskPayload(payload: AddTaskAction["payload"]): Task | null {
  const title = payload.title.trim()
  if (!title) {
    return null
  }

  const now = new Date().toISOString()
  return {
    id: payload.id ?? "",
    projectId: payload.projectId,
    groupId: payload.groupId,
    title,
    completed: payload.status === "done",
    status: payload.status ?? "planned",
    deadline: payload.deadline?.trim() || undefined,
    deadlineTime: payload.deadline ? payload.deadlineTime?.trim() || undefined : undefined,
    notes: payload.notes?.trim() || undefined,
    priority: payload.priority,
    assignee: payload.assignee?.trim() || undefined,
    followUpDate: payload.followUpDate?.trim() || undefined,
    followUpTime: payload.followUpDate ? payload.followUpTime?.trim() || undefined : undefined,
    deferReason: payload.deferReason,
    deferNote: payload.deferNote?.trim() || undefined,
    deferredUntil: payload.deferredUntil?.trim() || undefined,
    delegationNote: payload.delegationNote?.trim() || undefined,
    delegatedAt:
      payload.delegatedAt ??
      (payload.status === "delegated" ? now : undefined),
    isNextAction: payload.status === "done" ? false : (payload.isNextAction ?? false),
    statusChangedAt: payload.statusChangedAt ?? now,
    completedAt:
      payload.completedAt ??
      (payload.status === "done" ? now : undefined),
    createdAt: payload.createdAt ?? now,
    updatedAt: payload.updatedAt ?? now,
  }
}

function sanitizeTaskPatch(
  patch: UpdateTaskAction["payload"]["patch"],
): Partial<Task> {
  const next: Partial<Task> = {}

  if (patch.title !== undefined) {
    const title = patch.title.trim()
    if (title) {
      next.title = title
    }
  }
  if (patch.completed !== undefined) {
    next.completed = patch.completed
    next.status = patch.completed ? "done" : "planned"
    next.statusChangedAt = patch.statusChangedAt ?? new Date().toISOString()
    next.completedAt = patch.completed
      ? (patch.completedAt ?? new Date().toISOString())
      : undefined
    if (patch.completed) next.isNextAction = false
  }
  if ("deadline" in patch) {
    next.deadline = patch.deadline?.trim() || undefined
    if (!next.deadline) next.deadlineTime = undefined
  }
  if ("deadlineTime" in patch) {
    next.deadlineTime = patch.deadlineTime?.trim() || undefined
  }
  if ("notes" in patch) next.notes = patch.notes?.trim() || undefined
  if ("priority" in patch) next.priority = patch.priority
  if ("status" in patch) {
    const changedAt = patch.statusChangedAt ?? new Date().toISOString()
    next.status = patch.status
    next.completed = patch.status === "done"
    next.statusChangedAt = changedAt
    next.completedAt =
      patch.status === "done" ? (patch.completedAt ?? changedAt) : undefined
    if (patch.status === "delegated" && patch.delegatedAt === undefined) {
      next.delegatedAt = changedAt
    }
    if (
      patch.status === "done" ||
      patch.status === "waiting" ||
      patch.status === "delegated"
    ) {
      next.isNextAction = false
    }
  }
  if ("assignee" in patch) next.assignee = patch.assignee?.trim() || undefined
  if ("followUpDate" in patch) {
    next.followUpDate = patch.followUpDate?.trim() || undefined
    if (!next.followUpDate) next.followUpTime = undefined
  }
  if ("followUpTime" in patch) {
    next.followUpTime = patch.followUpTime?.trim() || undefined
  }
  if ("deferReason" in patch) next.deferReason = patch.deferReason
  if ("deferNote" in patch) next.deferNote = patch.deferNote?.trim() || undefined
  if ("deferredUntil" in patch) {
    next.deferredUntil = patch.deferredUntil?.trim() || undefined
    if (next.deferredUntil) next.isNextAction = false
  }
  if ("delegationNote" in patch) {
    next.delegationNote = patch.delegationNote?.trim() || undefined
  }
  if ("delegatedAt" in patch && next.delegatedAt === undefined) {
    next.delegatedAt = patch.delegatedAt
  }
  if ("isNextAction" in patch && next.isNextAction === undefined) {
    next.isNextAction = patch.isNextAction === true
  }
  if ("statusChangedAt" in patch && next.statusChangedAt === undefined) {
    next.statusChangedAt = patch.statusChangedAt
  }
  if ("completedAt" in patch && next.completedAt === undefined) {
    next.completedAt = patch.completedAt
  }

  return next
}

async function persistGroupAction(
  userId: string,
  action: AddGroupAction | UpdateGroupAction | DeleteGroupAction,
): Promise<RepositoryResult<null>> {
  if (action.type === "ADD_GROUP") {
    const title = action.payload.title.trim()
    if (!title) {
      return repositorySuccess(null)
    }
    if (!action.payload.id) {
      return repositoryFailure("Не удалось сохранить группу: отсутствует id группы.")
    }

    const result = await createProjectGroup(
      userId,
      action.payload.projectId,
      title,
      undefined,
      action.payload.id,
    )
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  if (action.type === "UPDATE_GROUP") {
    const patch: { title?: string; sortOrder?: number } = {}
    if (action.payload.patch.title !== undefined) {
      const title = action.payload.patch.title.trim()
      if (title) patch.title = title
    }
    if (action.payload.patch.order !== undefined) {
      patch.sortOrder = action.payload.patch.order
    }

    if (Object.keys(patch).length === 0) {
      return repositorySuccess(null)
    }

    const result = await updateProjectGroup(userId, action.payload.groupId, patch)
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  const result = await deleteProjectGroup(userId, action.payload.groupId)
  return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
}

async function persistTaskAction(
  userId: string,
  action: AddTaskAction | UpdateTaskAction | ToggleTaskAction | DeleteTaskAction,
): Promise<RepositoryResult<null>> {
  if (action.type === "ADD_TASK") {
    const task = sanitizeNewTaskPayload(action.payload)
    if (!task) {
      return repositorySuccess(null)
    }
    if (!task.id) {
      return repositoryFailure("Не удалось сохранить задачу: отсутствует id задачи.")
    }

    if (task.isNextAction) {
      const cleared = await clearProjectNextActions(
        userId,
        action.payload.projectId,
      )
      if (cleared.error) return repositoryFailure(cleared.error)
    }

    const result = await createTask(
      userId,
      action.payload.projectId,
      action.payload.groupId,
      task,
    )
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  if (action.type === "UPDATE_TASK") {
    const patch = sanitizeTaskPatch(action.payload.patch)
    if (Object.keys(patch).length === 0) {
      return repositorySuccess(null)
    }

    if (patch.isNextAction === true) {
      const cleared = await clearProjectNextActions(
        userId,
        action.payload.projectId,
        action.payload.taskId,
      )
      if (cleared.error) return repositoryFailure(cleared.error)
    }

    const result = await updateTask(userId, action.payload.taskId, patch)
    return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
  }

  if (action.type === "TOGGLE_TASK") {
    if (typeof action.payload.completed !== "boolean") {
      return repositoryFailure(
        "Не удалось сохранить переключение задачи: отсутствует новое значение completed.",
      )
    }
    const result = await toggleTaskCompleted(
      userId,
      action.payload.taskId,
      action.payload.completed,
    )
    if (result.error) {
      return repositoryFailure(result.error)
    }
    return repositorySuccess(null)
  }

  const result = await deleteTask(userId, action.payload.taskId)
  return result.error ? repositoryFailure(result.error) : repositorySuccess(null)
}

export async function persistGroupTaskAction(
  userId: string,
  action: AppAction,
): Promise<RepositoryResult<null>> {
  if (
    action.type === "ADD_GROUP" ||
    action.type === "UPDATE_GROUP" ||
    action.type === "DELETE_GROUP"
  ) {
    return persistGroupAction(userId, action)
  }

  if (
    action.type === "ADD_TASK" ||
    action.type === "UPDATE_TASK" ||
    action.type === "TOGGLE_TASK" ||
    action.type === "DELETE_TASK"
  ) {
    return persistTaskAction(userId, action)
  }

  return repositorySuccess(null)
}
