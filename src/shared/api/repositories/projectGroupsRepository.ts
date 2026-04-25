import { supabase } from "@/shared/lib/supabase"
import type { Project, Task } from "@/store/appState.types"
import {
  projectGroupRowToGroup,
  projectGroupToProjectGroupInsert,
  projectGroupToProjectGroupUpdate,
  taskRowToTask,
} from "../database.mappers"
import type { ProjectGroupRow, TaskRow } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

type TaskGroup = Project["groups"][number]

export async function createProjectGroup(
  userId: string,
  projectId: string,
  title: string,
  sortOrder?: number,
): Promise<RepositoryResult<TaskGroup>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const order = sortOrder ?? 0
  const insert = projectGroupToProjectGroupInsert(
    userId,
    projectId,
    title,
    order,
  )
  const { data, error } = await supabase
    .from("project_groups")
    .insert(insert)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Группа не была создана.")
  }

  return repositorySuccess(
    projectGroupRowToGroup(data as ProjectGroupRow, [] as Task[]),
  )
}

export async function updateProjectGroup(
  userId: string,
  groupId: string,
  patch: { title?: string; sortOrder?: number },
): Promise<RepositoryResult<TaskGroup>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const body = projectGroupToProjectGroupUpdate(patch)
  if (Object.keys(body).length === 0) {
    return fetchGroupById(supabase, userId, groupId)
  }

  const { data, error } = await supabase
    .from("project_groups")
    .update(body)
    .eq("id", groupId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Группа не найдена.")
  }

  return loadGroupWithTasks(supabase, userId, data as ProjectGroupRow)
}

export async function deleteProjectGroup(
  userId: string,
  groupId: string,
): Promise<RepositoryResult<boolean>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { error } = await supabase
    .from("project_groups")
    .delete()
    .eq("id", groupId)
    .eq("user_id", userId)

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  return repositorySuccess(true)
}

type Client = NonNullable<typeof supabase>

async function fetchGroupById(
  client: Client,
  userId: string,
  groupId: string,
): Promise<RepositoryResult<TaskGroup>> {
  const { data, error } = await client
    .from("project_groups")
    .select("*")
    .eq("id", groupId)
    .eq("user_id", userId)
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Группа не найдена.")
  }
  return loadGroupWithTasks(client, userId, data as ProjectGroupRow)
}

async function loadGroupWithTasks(
  client: Client,
  userId: string,
  row: ProjectGroupRow,
): Promise<RepositoryResult<TaskGroup>> {
  const { data: taskRows, error: te } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("group_id", row.id)
    .order("sort_order", { ascending: true })

  if (te) {
    return repositoryFailure(getRepositoryErrorMessage(te))
  }
  if (!taskRows) {
    return repositorySuccess(
      projectGroupRowToGroup(row, [] as Task[]),
    )
  }
  const tasks = (taskRows as TaskRow[]).map((t) => taskRowToTask(t))
  return repositorySuccess(projectGroupRowToGroup(row, tasks))
}
