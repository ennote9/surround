import { isCharacterStatType } from "@/shared/lib/characterStats"
import { isProjectPhase } from "@/shared/lib/projectPhases"
import type {
  Goal,
  Habit,
  Milestone,
  Project,
  Task,
  TaskGroup,
  TaskPriority,
} from "@/store/appState.types"
import type {
  GoalRow,
  GoalInsert,
  GoalUpdate,
  HabitRow,
  HabitInsert,
  HabitUpdate,
  HabitLogRow,
  MilestoneRow,
  MilestoneInsert,
  MilestoneUpdate,
  ProjectGroupRow,
  ProjectGroupInsert,
  ProjectGroupUpdate,
  ProjectRow,
  ProjectInsert,
  ProjectUpdate,
  Profile,
  ProfileRow,
  ProfileUpdate,
  TaskRow,
  TaskInsert,
  TaskUpdate,
} from "./database.types"

// --- Profile (public.profiles) ---

export function profileRowToProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Полная строка для upsert (включая timestamps), если они уже известны из UI.
 */
export function profileToProfileUpsert(row: Profile): ProfileRow {
  return {
    id: row.id,
    email: row.email,
    display_name: row.displayName,
    created_at: row.createdAt,
    updated_at: row.updatedAt,
  }
}

export function profilePatchToProfileUpdate(patch: {
  displayName?: string | null
  email?: string | null
}): ProfileUpdate {
  const o: ProfileUpdate = {}
  if (patch.displayName !== undefined) {
    o.display_name = patch.displayName
  }
  if (patch.email !== undefined) {
    o.email = patch.email
  }
  return o
}

// --- Parsers (DB may return untrusted string; frontend expects unions) —

function parseGoalStatusFromDb(value: unknown): Goal["status"] {
  if (value === "active" || value === "later" || value === "archived") {
    return value
  }
  return "active"
}

function parseTaskPriorityFromDb(value: unknown): TaskPriority | undefined {
  if (value === "low" || value === "medium" || value === "high") {
    return value
  }
  return undefined
}

function mapStatTypeFromDb(value: unknown): Project["statType"] {
  if (value == null) {
    return undefined
  }
  if (isCharacterStatType(value)) {
    return value
  }
  return undefined
}

function mapPhaseFromDb(value: unknown): Project["phase"] {
  if (value == null) {
    return undefined
  }
  if (isProjectPhase(value)) {
    return value
  }
  return "active"
}

// --- Goals ---

export function goalRowToGoal(row: GoalRow): Goal {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? undefined,
    targetDate: row.target_date ?? undefined,
    status: parseGoalStatusFromDb(row.status),
    showOnDashboard: row.show_on_dashboard,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function goalToGoalInsert(goal: Goal, userId: string): GoalInsert {
  return {
    id: goal.id,
    user_id: userId,
    title: goal.title,
    description: goal.description ?? null,
    target_date: goal.targetDate ?? null,
    status: parseGoalStatusFromDb(goal.status),
    show_on_dashboard: goal.showOnDashboard !== false,
  }
}

export function goalToGoalUpdate(patch: Partial<Goal>): GoalUpdate {
  const o: GoalUpdate = {}
  if (patch.title !== undefined) o.title = patch.title
  if (patch.description !== undefined) o.description = patch.description ?? null
  if (patch.targetDate !== undefined) o.target_date = patch.targetDate ?? null
  if (patch.status !== undefined) o.status = parseGoalStatusFromDb(patch.status)
  if (patch.showOnDashboard !== undefined) o.show_on_dashboard = patch.showOnDashboard
  return o
}

// --- Projects ---

export function projectRowToProjectBase(row: ProjectRow): Project {
  return {
    id: row.id,
    goalId: row.goal_id ?? undefined,
    title: row.title,
    description: row.description ?? undefined,
    statType: mapStatTypeFromDb(row.stat_type),
    phase: mapPhaseFromDb(row.phase),
    targetDate: row.target_date ?? undefined,
    showOnDashboard: row.show_on_dashboard,
    groups: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * @returns `null`, если у проекта нет `goalId` — импорт/создание в облаке без цели не поддерживаются.
 */
export function projectToProjectInsert(
  project: Project,
  userId: string,
): ProjectInsert | null {
  if (project.goalId === undefined || project.goalId.trim() === "") {
    return null
  }
  return {
    id: project.id,
    user_id: userId,
    goal_id: project.goalId,
    title: project.title,
    description: project.description ?? null,
    stat_type: project.statType ?? null,
    phase: project.phase ?? null,
    target_date: project.targetDate ?? null,
    show_on_dashboard: project.showOnDashboard !== false,
  }
}

export function projectToProjectUpdate(patch: Partial<Project>): ProjectUpdate {
  const o: ProjectUpdate = {}
  if (patch.goalId !== undefined) o.goal_id = patch.goalId ?? null
  if (patch.title !== undefined) o.title = patch.title
  if (patch.description !== undefined) o.description = patch.description ?? null
  if (patch.statType !== undefined) o.stat_type = patch.statType ?? null
  if (patch.phase !== undefined) o.phase = patch.phase ?? null
  if (patch.targetDate !== undefined) o.target_date = patch.targetDate ?? null
  if (patch.showOnDashboard !== undefined) o.show_on_dashboard = patch.showOnDashboard
  return o
}

// --- Project groups (TaskGroup) ---

export function projectGroupRowToGroup(
  row: ProjectGroupRow,
  tasks: Task[],
): TaskGroup {
  return {
    id: row.id,
    projectId: row.project_id,
    title: row.title,
    order: row.sort_order,
    tasks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function projectGroupToProjectGroupInsert(
  userId: string,
  projectId: string,
  title: string,
  sortOrder: number,
  id?: string,
): ProjectGroupInsert {
  return {
    id,
    user_id: userId,
    project_id: projectId,
    title,
    sort_order: sortOrder,
  }
}

export function projectGroupToProjectGroupUpdate(
  patch: { title?: string; sortOrder?: number },
): ProjectGroupUpdate {
  const o: ProjectGroupUpdate = {}
  if (patch.title !== undefined) o.title = patch.title
  if (patch.sortOrder !== undefined) o.sort_order = patch.sortOrder
  return o
}

// --- Tasks ---

export function taskRowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    groupId: row.group_id,
    projectId: row.project_id,
    title: row.title,
    completed: row.completed,
    deadline: row.deadline ?? undefined,
    notes: row.notes ?? undefined,
    priority: parseTaskPriorityFromDb(row.priority),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function taskToTaskInsert(
  task: Task,
  userId: string,
  projectId: string,
  groupId: string,
  sortOrder: number,
): TaskInsert {
  return {
    id: task.id,
    user_id: userId,
    project_id: projectId,
    group_id: groupId,
    title: task.title,
    completed: task.completed,
    deadline: task.deadline ?? null,
    notes: task.notes ?? null,
    priority: task.priority ?? null,
    sort_order: sortOrder,
  }
}

export function taskToTaskUpdate(patch: Partial<Task>): TaskUpdate {
  const o: TaskUpdate = {}
  if (patch.groupId !== undefined) o.group_id = patch.groupId
  if (patch.projectId !== undefined) o.project_id = patch.projectId
  if (patch.title !== undefined) o.title = patch.title
  if (patch.completed !== undefined) o.completed = patch.completed
  if (patch.deadline !== undefined) o.deadline = patch.deadline ?? null
  if (patch.notes !== undefined) o.notes = patch.notes ?? null
  if (patch.priority !== undefined) o.priority = patch.priority ?? null
  return o
}

// --- Habits ---

export function buildDailyStatusFromHabitLogRows(
  logs: HabitLogRow[],
): Record<string, boolean> {
  const d: Record<string, boolean> = {}
  for (const log of logs) {
    d[log.date] = log.completed
  }
  return d
}

export function habitRowToHabit(
  row: HabitRow,
  logs: HabitLogRow[] = [],
): Habit {
  return {
    id: row.id,
    name: row.title,
    description: row.description ?? undefined,
    dailyStatus: buildDailyStatusFromHabitLogRows(logs),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function habitToHabitInsert(habit: Habit, userId: string): HabitInsert {
  return {
    id: habit.id,
    user_id: userId,
    title: habit.name,
    description: habit.description ?? null,
    schedule: null,
    goal_id: null,
    project_id: null,
  }
}

export function habitToHabitUpdate(patch: Partial<Habit>): HabitUpdate {
  const o: HabitUpdate = {}
  if (patch.name !== undefined) o.title = patch.name
  if (patch.description !== undefined) o.description = patch.description ?? null
  return o
}

// --- Milestones ---

export function milestoneRowToMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    goalId: row.goal_id ?? undefined,
    projectId: row.project_id ?? undefined,
    title: row.title,
    date: row.target_date ?? "1970-01-01",
    completed: row.completed,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function milestoneToMilestoneInsert(
  milestone: Milestone,
  userId: string,
): MilestoneInsert {
  return {
    id: milestone.id,
    user_id: userId,
    goal_id: milestone.projectId ? null : (milestone.goalId ?? null),
    project_id: milestone.projectId ?? null,
    title: milestone.title,
    target_date: milestone.date,
    completed: milestone.completed,
  }
}

export function milestoneToMilestoneUpdate(
  patch: Partial<Milestone>,
): MilestoneUpdate {
  const o: MilestoneUpdate = {}
  if (patch.title !== undefined) o.title = patch.title
  if (patch.date !== undefined) o.target_date = patch.date
  if (patch.completed !== undefined) o.completed = patch.completed
  if (patch.projectId !== undefined) o.project_id = patch.projectId ?? null
  if (patch.goalId !== undefined) o.goal_id = patch.goalId ?? null
  return o
}
