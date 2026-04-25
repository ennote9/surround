/**
 * Replace-import AppState в Supabase (без merge, без localStorage).
 * TODO(21.x): при необходимости атомарности заменить на RPC/транзакцию.
 */
import { supabase } from "@/shared/lib/supabase"
import type { AppState, Goal, Habit, Milestone, Project } from "@/store/appState.types"
import {
  goalToGoalInsert,
  habitToHabitInsert,
  milestoneToMilestoneInsert,
  projectGroupToProjectGroupInsert,
  projectToProjectInsert,
  taskToTaskInsert,
} from "./database.mappers"
import type { HabitLogInsert, TaskInsert } from "./database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"
import { upsertUserSettings } from "./repositories/userSettingsRepository"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/

export function isUuid(value: string): boolean {
  return UUID_RE.test(value.trim())
}

function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, "0").slice(-12)}`
}

function createImportId(oldId: string, map: Map<string, string>): string {
  const trimmed = oldId.trim()
  const existing = map.get(trimmed)
  if (existing !== undefined) {
    return existing
  }
  if (isUuid(trimmed)) {
    map.set(trimmed, trimmed)
    return trimmed
  }
  const nid = generateUuidV4()
  map.set(trimmed, nid)
  return nid
}

function collectIdMaps(appState: AppState): {
  goalIdMap: Map<string, string>
  projectIdMap: Map<string, string>
  groupIdMap: Map<string, string>
  taskIdMap: Map<string, string>
  habitIdMap: Map<string, string>
  milestoneIdMap: Map<string, string>
} {
  const goalIdMap = new Map<string, string>()
  const projectIdMap = new Map<string, string>()
  const groupIdMap = new Map<string, string>()
  const taskIdMap = new Map<string, string>()
  const habitIdMap = new Map<string, string>()
  const milestoneIdMap = new Map<string, string>()

  for (const g of appState.goals) {
    createImportId(g.id, goalIdMap)
  }
  for (const p of appState.projects) {
    createImportId(p.id, projectIdMap)
    for (const gr of p.groups) {
      createImportId(gr.id, groupIdMap)
      for (const t of gr.tasks) {
        createImportId(t.id, taskIdMap)
      }
    }
  }
  for (const h of appState.habits) {
    createImportId(h.id, habitIdMap)
  }
  for (const m of appState.milestones) {
    createImportId(m.id, milestoneIdMap)
  }

  return {
    goalIdMap,
    projectIdMap,
    groupIdMap,
    taskIdMap,
    habitIdMap,
    milestoneIdMap,
  }
}

/**
 * Возвращает копию AppState с UUID id и согласованными ссылками goal/project/group/task/habit/milestone.
 */
export function normalizeImportedAppStateIds(appState: AppState): AppState {
  const {
    goalIdMap,
    projectIdMap,
    groupIdMap,
    taskIdMap,
    habitIdMap,
    milestoneIdMap,
  } = collectIdMaps(appState)

  const goals: Goal[] = appState.goals.map((g) => ({
    ...g,
    id: goalIdMap.get(g.id.trim())!,
  }))

  const fallbackGoalId = goals[0]?.id

  const projects: Project[] = appState.projects.map((p) => {
    const newProjectId = projectIdMap.get(p.id.trim())!
    const rawGoal = p.goalId?.trim()
    const mappedGoal =
      rawGoal !== undefined && rawGoal !== ""
        ? goalIdMap.get(rawGoal)
        : undefined
    const newGoalId = mappedGoal ?? fallbackGoalId

    const groups = p.groups.map((gr, groupIndex) => {
      const newGroupId = groupIdMap.get(gr.id.trim())!
      const tasks = gr.tasks.map((t) => ({
        ...t,
        id: taskIdMap.get(t.id.trim())!,
        projectId: newProjectId,
        groupId: newGroupId,
      }))
      return {
        ...gr,
        id: newGroupId,
        projectId: newProjectId,
        order: gr.order ?? groupIndex,
        tasks,
      }
    })

    return {
      ...p,
      id: newProjectId,
      goalId: newGoalId,
      groups,
    }
  })

  const habits: Habit[] = appState.habits.map((h) => ({
    ...h,
    id: habitIdMap.get(h.id.trim())!,
  }))

  const milestones: Milestone[] = appState.milestones.map((m) => {
    const newId = milestoneIdMap.get(m.id.trim())!
    if (m.projectId === undefined || m.projectId.trim() === "") {
      return { ...m, id: newId, projectId: undefined }
    }
    const newProjectId = projectIdMap.get(m.projectId.trim())
    return { ...m, id: newId, projectId: newProjectId }
  })

  return {
    version: 2,
    settings: { ...appState.settings },
    goals,
    projects,
    habits,
    milestones,
  }
}

function validateImportableState(appState: AppState): string | null {
  const projectIds = new Set(appState.projects.map((p) => p.id.trim()))
  for (const m of appState.milestones) {
    if (m.projectId !== undefined && m.projectId.trim() !== "") {
      if (!projectIds.has(m.projectId.trim())) {
        return `Веха «${m.title}» ссылается на несуществующий проект (${m.projectId}).`
      }
    }
  }
  return null
}

async function deleteExistingCloudData(
  userId: string,
): Promise<RepositoryResult<null>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const tablesInOrder = [
    "habit_logs",
    "tasks",
    "project_groups",
    "milestones",
    "projects",
    "habits",
    "goals",
    "user_settings",
  ] as const

  for (const table of tablesInOrder) {
    const { error } = await supabase.from(table).delete().eq("user_id", userId)
    if (error) {
      return repositoryFailure(
        `Не удалось очистить ${table}: ${getRepositoryErrorMessage(error)}`,
      )
    }
  }

  return repositorySuccess(null)
}

async function insertImportedCloudData(
  userId: string,
  state: AppState,
): Promise<RepositoryResult<null>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const settingsRes = await upsertUserSettings(userId, {
    ...state.settings,
  } as Record<string, unknown>)
  if (settingsRes.error) {
    return repositoryFailure(settingsRes.error)
  }

  if (state.goals.length > 0) {
    const rows = state.goals.map((g) => goalToGoalInsert(g, userId))
    const { error } = await supabase.from("goals").insert(rows)
    if (error) {
      return repositoryFailure(
        `Не удалось вставить цели: ${getRepositoryErrorMessage(error)}`,
      )
    }
  }

  for (const p of state.projects) {
    const insert = projectToProjectInsert(p, userId)
    if (insert === null) {
      return repositoryFailure(
        `Проект «${p.title}» не имеет goalId — вставка в облако невозможна.`,
      )
    }
    const { error } = await supabase.from("projects").insert(insert)
    if (error) {
      return repositoryFailure(
        `Не удалось вставить проект «${p.title}»: ${getRepositoryErrorMessage(error)}`,
      )
    }
  }

  for (const p of state.projects) {
    for (let gi = 0; gi < p.groups.length; gi += 1) {
      const gr = p.groups[gi]
      const row = projectGroupToProjectGroupInsert(
        userId,
        p.id,
        gr.title,
        gr.order ?? gi,
        gr.id,
      )
      const { error } = await supabase.from("project_groups").insert(row)
      if (error) {
        return repositoryFailure(
          `Не удалось вставить группу «${gr.title}»: ${getRepositoryErrorMessage(error)}`,
        )
      }
    }
  }

  const taskRows: TaskInsert[] = []
  for (const p of state.projects) {
    for (const gr of p.groups) {
      for (let ti = 0; ti < gr.tasks.length; ti += 1) {
        const t = gr.tasks[ti]
        taskRows.push(taskToTaskInsert(t, userId, p.id, gr.id, ti))
      }
    }
  }
  if (taskRows.length > 0) {
    const { error } = await supabase.from("tasks").insert(taskRows)
    if (error) {
      return repositoryFailure(
        `Не удалось вставить задачи: ${getRepositoryErrorMessage(error)}`,
      )
    }
  }

  if (state.habits.length > 0) {
    const habitRows = state.habits.map((h) => habitToHabitInsert(h, userId))
    const { error } = await supabase.from("habits").insert(habitRows)
    if (error) {
      return repositoryFailure(
        `Не удалось вставить привычки: ${getRepositoryErrorMessage(error)}`,
      )
    }
  }

  const logRows: HabitLogInsert[] = []
  for (const habit of state.habits) {
    for (const [date, completed] of Object.entries(habit.dailyStatus)) {
      if (!DATE_ONLY.test(date)) continue
      if (typeof completed !== "boolean") continue
      logRows.push({
        user_id: userId,
        habit_id: habit.id,
        date,
        completed,
      })
    }
  }
  if (logRows.length > 0) {
    const { error } = await supabase.from("habit_logs").insert(logRows)
    if (error) {
      return repositoryFailure(
        `Не удалось вставить журнал привычек: ${getRepositoryErrorMessage(error)}`,
      )
    }
  }

  if (state.milestones.length > 0) {
    const milestoneRows = state.milestones.map((m) =>
      milestoneToMilestoneInsert(m, userId),
    )
    const { error } = await supabase.from("milestones").insert(milestoneRows)
    if (error) {
      return repositoryFailure(
        `Не удалось вставить вехи: ${getRepositoryErrorMessage(error)}`,
      )
    }
  }

  return repositorySuccess(null)
}

export async function importAppStateIntoCloud(
  userId: string,
  appState: AppState,
): Promise<RepositoryResult<AppState>> {
  const validationError = validateImportableState(appState)
  if (validationError !== null) {
    return repositoryFailure(validationError)
  }
  if (appState.goals.length === 0) {
    return repositoryFailure("В импорте нет ни одной цели — облачный импорт невозможен.")
  }

  const normalized = normalizeImportedAppStateIds(appState)

  const del = await deleteExistingCloudData(userId)
  if (del.error) {
    return repositoryFailure(del.error)
  }

  const ins = await insertImportedCloudData(userId, normalized)
  if (ins.error) {
    return repositoryFailure(ins.error)
  }

  return repositorySuccess(normalized)
}
