/**
 * Replace-import AppState в Supabase без merge.
 * Вся замена выполняется одной транзакционной RPC-операцией.
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
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

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

  for (const goal of appState.goals) createImportId(goal.id, goalIdMap)
  for (const project of appState.projects) {
    createImportId(project.id, projectIdMap)
    for (const group of project.groups) {
      createImportId(group.id, groupIdMap)
      for (const task of group.tasks) createImportId(task.id, taskIdMap)
    }
  }
  for (const habit of appState.habits) createImportId(habit.id, habitIdMap)
  for (const milestone of appState.milestones) {
    createImportId(milestone.id, milestoneIdMap)
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

export function normalizeImportedAppStateIds(appState: AppState): AppState {
  const {
    goalIdMap,
    projectIdMap,
    groupIdMap,
    taskIdMap,
    habitIdMap,
    milestoneIdMap,
  } = collectIdMaps(appState)

  const goals: Goal[] = appState.goals.map((goal) => ({
    ...goal,
    id: goalIdMap.get(goal.id.trim())!,
  }))

  const projects: Project[] = appState.projects.map((project) => {
    const projectId = projectIdMap.get(project.id.trim())!
    const rawGoalId = project.goalId?.trim()
    const goalId = rawGoalId ? goalIdMap.get(rawGoalId) : undefined

    const groups = project.groups.map((group, groupIndex) => {
      const groupId = groupIdMap.get(group.id.trim())!
      const tasks = group.tasks.map((task) => ({
        ...task,
        id: taskIdMap.get(task.id.trim())!,
        projectId,
        groupId,
      }))
      return {
        ...group,
        id: groupId,
        projectId,
        order: group.order ?? groupIndex,
        tasks,
      }
    })

    return {
      ...project,
      id: projectId,
      goalId,
      groups,
    }
  })

  const habits: Habit[] = appState.habits.map((habit) => {
    const rawProjectId = habit.projectId?.trim()
    const rawGoalId = habit.goalId?.trim()
    const projectId = rawProjectId ? projectIdMap.get(rawProjectId) : undefined
    const goalId =
      !projectId && rawGoalId ? goalIdMap.get(rawGoalId) : undefined

    return {
      ...habit,
      id: habitIdMap.get(habit.id.trim())!,
      projectId,
      goalId: projectId ? undefined : goalId,
    }
  })

  const milestones: Milestone[] = appState.milestones.map((milestone) => {
    const projectId = milestone.projectId?.trim()
      ? projectIdMap.get(milestone.projectId.trim())
      : undefined
    const goalId =
      !projectId && milestone.goalId?.trim()
        ? goalIdMap.get(milestone.goalId.trim())
        : undefined

    return {
      ...milestone,
      id: milestoneIdMap.get(milestone.id.trim())!,
      projectId,
      goalId: projectId ? undefined : goalId,
    }
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
  const goalIds = new Set(appState.goals.map((goal) => goal.id.trim()))
  const projectIds = new Set(appState.projects.map((project) => project.id.trim()))

  for (const project of appState.projects) {
    const goalId = project.goalId?.trim()
    if (goalId && !goalIds.has(goalId)) {
      return `Проект «${project.title}» ссылается на несуществующую цель (${project.goalId}).`
    }
  }

  for (const habit of appState.habits) {
    const projectId = habit.projectId?.trim()
    const goalId = habit.goalId?.trim()

    if (projectId && goalId) {
      return `Привычка «${habit.name}» не должна быть одновременно привязана к проекту и цели.`
    }
    if (projectId && !projectIds.has(projectId)) {
      return `Привычка «${habit.name}» ссылается на несуществующий проект (${habit.projectId}).`
    }
    if (goalId && !goalIds.has(goalId)) {
      return `Привычка «${habit.name}» ссылается на несуществующую цель (${habit.goalId}).`
    }
  }

  for (const milestone of appState.milestones) {
    const projectId = milestone.projectId?.trim()
    const goalId = milestone.goalId?.trim()
    const hasProject = Boolean(projectId)
    const hasGoal = Boolean(goalId)

    if (hasProject === hasGoal) {
      return `Веха «${milestone.title}» должна быть привязана ровно к одному объекту: проекту или цели.`
    }
    if (projectId && !projectIds.has(projectId)) {
      return `Веха «${milestone.title}» ссылается на несуществующий проект (${milestone.projectId}).`
    }
    if (goalId && !goalIds.has(goalId)) {
      return `Веха «${milestone.title}» ссылается на несуществующую цель (${milestone.goalId}).`
    }
  }

  return null
}

function buildAtomicImportPayload(userId: string, state: AppState) {
  const groups: Record<string, unknown>[] = []
  const tasks: Record<string, unknown>[] = []
  const habitLogs: Record<string, unknown>[] = []

  for (const project of state.projects) {
    for (let groupIndex = 0; groupIndex < project.groups.length; groupIndex += 1) {
      const group = project.groups[groupIndex]
      groups.push(
        projectGroupToProjectGroupInsert(
          userId,
          project.id,
          group.title,
          group.order ?? groupIndex,
          group.id,
        ) as unknown as Record<string, unknown>,
      )

      for (let taskIndex = 0; taskIndex < group.tasks.length; taskIndex += 1) {
        tasks.push(
          taskToTaskInsert(
            group.tasks[taskIndex],
            userId,
            project.id,
            group.id,
            taskIndex,
          ) as unknown as Record<string, unknown>,
        )
      }
    }
  }

  for (const habit of state.habits) {
    const dates = new Set([
      ...Object.keys(habit.dailyStatus),
      ...Object.keys(habit.dailyEntries ?? {}),
    ])

    for (const date of dates) {
      if (!DATE_ONLY.test(date)) continue
      const entry = habit.dailyEntries?.[date]
      const completed = entry?.completed ?? habit.dailyStatus[date]
      if (typeof completed !== "boolean") continue

      habitLogs.push({
        habit_id: habit.id,
        date,
        completed,
        value: entry?.value ?? null,
        note: entry?.note ?? null,
        skipped: entry?.skipped ?? false,
      })
    }
  }

  return {
    settings: state.settings,
    goals: state.goals.map(
      (goal) => goalToGoalInsert(goal, userId) as unknown as Record<string, unknown>,
    ),
    projects: state.projects.map(
      (project) =>
        projectToProjectInsert(project, userId) as unknown as Record<string, unknown>,
    ),
    groups,
    tasks,
    habits: state.habits.map(
      (habit) =>
        habitToHabitInsert(habit, userId) as unknown as Record<string, unknown>,
    ),
    habit_logs: habitLogs,
    milestones: state.milestones.map(
      (milestone) =>
        milestoneToMilestoneInsert(
          milestone,
          userId,
        ) as unknown as Record<string, unknown>,
    ),
  }
}

export async function importAppStateIntoCloud(
  userId: string,
  appState: AppState,
): Promise<RepositoryResult<AppState>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }
  if (!userId.trim()) {
    return repositoryFailure("Не удалось импортировать данные: отсутствует пользователь.")
  }

  const validationError = validateImportableState(appState)
  if (validationError !== null) {
    return repositoryFailure(validationError)
  }

  const normalized = normalizeImportedAppStateIds(appState)
  const payload = buildAtomicImportPayload(userId, normalized)

  try {
    const { error } = await supabase.rpc("replace_app_state_atomic", {
      p_payload: payload,
    })

    if (error) {
      return repositoryFailure(
        `Не удалось импортировать данные: ${getRepositoryErrorMessage(error)}`,
      )
    }

    return repositorySuccess(normalized)
  } catch (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
}
