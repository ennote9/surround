import type { AppAction } from "@/store/actions"
import type { Task } from "@/store/appState.types"
import {
  createProjectGroup,
  deleteProjectGroup,
  updateProjectGroup,
} from "./repositories/projectGroupsRepository"
import {
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
    completed: false,
    deadline: payload.deadline?.trim() || undefined,
    notes: payload.notes?.trim() || undefined,
    priority: payload.priority,
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
  if (patch.completed !== undefined) next.completed = patch.completed
  if (patch.deadline !== undefined) {
    next.deadline = patch.deadline?.trim() || undefined
  }
  if (patch.notes !== undefined) next.notes = patch.notes?.trim() || undefined
  if (patch.priority !== undefined) next.priority = patch.priority

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
