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

  const insert = taskToTaskInsert(
    task,
    userId,
    projectId,
    groupId,
    sortOrder ?? 0,
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

  const { data, error } = await supabase
    .from("tasks")
    .update({ completed })
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
