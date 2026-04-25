import { supabase } from "@/shared/lib/supabase"
import type { Project } from "@/store/appState.types"
import {
  projectGroupRowToGroup,
  projectRowToProjectBase,
  projectToProjectInsert,
  projectToProjectUpdate,
  taskRowToTask,
} from "../database.mappers"
import type { ProjectGroupRow, ProjectRow, TaskRow } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

type Client = NonNullable<typeof supabase>

export async function listProjects(
  userId: string,
): Promise<RepositoryResult<Project[]>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data: projectRows, error: pe } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (pe) {
    return repositoryFailure(getRepositoryErrorMessage(pe))
  }
  if (!projectRows || projectRows.length === 0) {
    return repositorySuccess([])
  }

  const projects = projectRows as ProjectRow[]
  const projectIds = projects.map((p) => p.id)

  const { data: groupRows, error: ge } = await supabase
    .from("project_groups")
    .select("*")
    .eq("user_id", userId)
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true })

  if (ge) {
    return repositoryFailure(getRepositoryErrorMessage(ge))
  }
  const groups = (groupRows ?? []) as ProjectGroupRow[]

  const { data: taskRows, error: te } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true })

  if (te) {
    return repositoryFailure(getRepositoryErrorMessage(te))
  }
  const tasks = (taskRows ?? []) as TaskRow[]

  return repositorySuccess(
    assembleProjectsFromRows(projects, groups, tasks),
  )
}

export async function listProjectsByGoal(
  userId: string,
  goalId: string,
): Promise<RepositoryResult<Project[]>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data: projectRows, error: pe } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userId)
    .eq("goal_id", goalId)
    .order("created_at", { ascending: true })

  if (pe) {
    return repositoryFailure(getRepositoryErrorMessage(pe))
  }
  if (!projectRows || projectRows.length === 0) {
    return repositorySuccess([])
  }

  const projects = projectRows as ProjectRow[]
  const projectIds = projects.map((p) => p.id)

  const { data: groupRows, error: ge } = await supabase
    .from("project_groups")
    .select("*")
    .eq("user_id", userId)
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true })

  if (ge) {
    return repositoryFailure(getRepositoryErrorMessage(ge))
  }
  const groups = (groupRows ?? []) as ProjectGroupRow[]

  const { data: taskRows, error: te } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true })

  if (te) {
    return repositoryFailure(getRepositoryErrorMessage(te))
  }
  const tasks = (taskRows ?? []) as TaskRow[]

  return repositorySuccess(
    assembleProjectsFromRows(projects, groups, tasks),
  )
}

export async function createProject(
  userId: string,
  project: Project,
): Promise<RepositoryResult<Project>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const insert = projectToProjectInsert(project, userId)
  if (insert === null) {
    return repositoryFailure("Для сохранения проекта в облаке нужен goalId.")
  }

  const { data, error } = await supabase
    .from("projects")
    .insert(insert)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Проект не был создан.")
  }

  return repositorySuccess(projectRowToProjectBase(data as ProjectRow))
}

export async function updateProject(
  userId: string,
  projectId: string,
  patch: Partial<Project>,
): Promise<RepositoryResult<Project>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const body = projectToProjectUpdate(patch)
  if (Object.keys(body).length === 0) {
    return loadProjectWithNested(supabase, userId, projectId)
  }

  const { data, error } = await supabase
    .from("projects")
    .update(body)
    .eq("id", projectId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Проект не найден.")
  }

  return loadProjectWithNested(supabase, userId, projectId)
}

export async function deleteProject(
  userId: string,
  projectId: string,
): Promise<RepositoryResult<boolean>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId)
    .eq("user_id", userId)

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }

  return repositorySuccess(true)
}

function assembleProjectsFromRows(
  projectRows: ProjectRow[],
  groupRows: ProjectGroupRow[],
  taskRows: TaskRow[],
): Project[] {
  const groupsByProject = new Map<string, ProjectGroupRow[]>()
  for (const g of groupRows) {
    const list = groupsByProject.get(g.project_id) ?? []
    list.push(g)
    groupsByProject.set(g.project_id, list)
  }
  for (const [key, list] of groupsByProject) {
    list.sort((a, b) => a.sort_order - b.sort_order)
    groupsByProject.set(key, list)
  }

  const tasksByGroup = new Map<string, TaskRow[]>()
  for (const t of taskRows) {
    const list = tasksByGroup.get(t.group_id) ?? []
    list.push(t)
    tasksByGroup.set(t.group_id, list)
  }
  for (const [key, list] of tasksByGroup) {
    list.sort((a, b) => a.sort_order - b.sort_order)
    tasksByGroup.set(key, list)
  }

  return projectRows.map((pr) => {
    const gRows = groupsByProject.get(pr.id) ?? []
    const groups = gRows.map((gr) => {
      const tr = (tasksByGroup.get(gr.id) ?? []).map((r) => taskRowToTask(r))
      return projectGroupRowToGroup(gr, tr)
    })
    return { ...projectRowToProjectBase(pr), groups }
  })
}

async function loadProjectWithNested(
  client: Client,
  userId: string,
  projectId: string,
): Promise<RepositoryResult<Project>> {
  const { data: pr, error: e1 } = await client
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("user_id", userId)
    .single()

  if (e1) {
    return repositoryFailure(getRepositoryErrorMessage(e1))
  }
  if (!pr) {
    return repositoryFailure("Проект не найден.")
  }

  const { data: groupRows, error: e2 } = await client
    .from("project_groups")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  if (e2) {
    return repositoryFailure(getRepositoryErrorMessage(e2))
  }
  const gRows = (groupRows ?? []) as ProjectGroupRow[]

  const { data: taskRows, error: e3 } = await client
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true })

  if (e3) {
    return repositoryFailure(getRepositoryErrorMessage(e3))
  }
  const tRows = (taskRows ?? []) as TaskRow[]

  const [assembled] = assembleProjectsFromRows(
    [pr as ProjectRow],
    gRows,
    tRows,
  )
  return repositorySuccess(assembled)
}
