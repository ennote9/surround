import { supabase } from "@/shared/lib/supabase"
import type { Task } from "@/store/appState.types"
import { taskRowToTask, taskToTaskInsert, taskToTaskUpdate } from "../database.mappers"
import type { TaskRow } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

export async function clearProjectNextActions(
  userId: string,
  projectId: string,
  exceptTaskId?: string,
): Promise<RepositoryResult<null>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  let query = supabase
    .from("tasks")
    .update({ is_next_action: false })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .eq("is_next_action", true)

  if (exceptTaskId) {
    query = query.neq("id", exceptTaskId)
  }

  const { error } = await query

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  return repositorySuccess(null)
}

export async function createTask(
  userId: string,
  projectId: string,
  groupId: string,
  task: Task,
  sortOrder?: number,
): Promise<RepositoryResult<Task>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  let order = sortOrder
  if (order === undefined) {
    const { data: lastRow, error: orderError } = await supabase
      .from("tasks")
      .select("sort_order")
      .eq("user_id", userId)
      .eq("group_id", groupId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (orderError) {
      return repositoryFailure(getRepositoryErrorMessage(orderError))
    }
    order =
      typeof lastRow?.sort_order === "number"
        ? lastRow.sort_order + 1
        : 0
  }

  const insert = taskToTaskInsert(
    task,
    userId,
    projectId,
    groupId,
    order,
  )
  const { data, error } = await supabase
    .from("tasks")
    .insert(insert)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Задача не была создана.")
  }

  return repositorySuccess(taskRowToTask(data as TaskRow))
}

export async function updateTask(
  userId: string,
  taskId: string,
  patch: Partial<Task>,
): Promise<RepositoryResult<Task>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const body = taskToTaskUpdate(patch)
  if (Object.keys(body).length === 0) {
    return fetchTaskById(supabase, userId, taskId)
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(body)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Задача не найдена.")
  }

  return repositorySuccess(taskRowToTask(data as TaskRow))
}

export async function deleteTask(
  userId: string,
  taskId: string,
): Promise<RepositoryResult<boolean>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId)
    .eq("user_id", userId)

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  return repositorySuccess(true)
}

export async function toggleTaskCompleted(
  userId: string,
  taskId: string,
  completed: boolean,
): Promise<RepositoryResult<Task>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from("tasks")
    .update({
      completed,
      status: completed ? "done" : "planned",
      status_changed_at: now,
      completed_at: completed ? now : null,
      ...(completed ? { is_next_action: false } : {}),
    })
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Задача не найдена.")
  }

  return repositorySuccess(taskRowToTask(data as TaskRow))
}

type Client = NonNullable<typeof supabase>

async function fetchTaskById(
  client: Client,
  userId: string,
  taskId: string,
): Promise<RepositoryResult<Task>> {
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("id", taskId)
    .eq("user_id", userId)
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Задача не найдена.")
  }
  return repositorySuccess(taskRowToTask(data as TaskRow))
}
