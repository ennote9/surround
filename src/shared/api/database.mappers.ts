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

function parseHabitScheduleFromDb(value: unknown): Habit["schedule"] {
  if (!value || typeof value !== "object") {
    return undefined
  }
  const raw = value as Record<string, unknown>
  const target =
    typeof raw.targetPerWeek === "number" && Number.isFinite(raw.targetPerWeek)
      ? Math.max(1, Math.min(7, Math.round(raw.targetPerWeek)))
      : 7
  const mode =
    raw.mode === "daily" ||
    raw.mode === "specific-days" ||
    raw.mode === "times-per-week"
      ? raw.mode
      : "times-per-week"
  const daysOfWeek = Array.isArray(raw.daysOfWeek)
    ? [...new Set(
        raw.daysOfWeek
          .filter((day): day is number => typeof day === "number" && Number.isFinite(day))
          .map((day) => Math.round(day))
          .filter((day) => day >= 1 && day <= 7),
      )].sort((a, b) => a - b)
    : undefined

  return {
    mode,
    targetPerWeek:
      mode === "daily"
        ? 7
        : mode === "specific-days"
          ? Math.max(1, daysOfWeek?.length ?? target)
          : target,
    ...(daysOfWeek && daysOfWeek.length > 0 ? { daysOfWeek } : {}),
  }
}

function parseHabitSettingsFromDb(value: unknown): Habit["settings"] {
  if (!value || typeof value !== "object") return undefined
  const raw = value as Record<string, unknown>
  const targetRaw =
    raw.target && typeof raw.target === "object"
      ? (raw.target as Record<string, unknown>)
      : undefined
  const targetType =
    targetRaw?.type === "duration" || targetRaw?.type === "quantity"
      ? targetRaw.type
      : "check"
  const numberOrUndefined = (input: unknown) =>
    typeof input === "number" && Number.isFinite(input) && input >= 0
      ? input
      : undefined
  const timingRaw =
    raw.timing && typeof raw.timing === "object"
      ? (raw.timing as Record<string, unknown>)
      : undefined
  const timingPreference =
    timingRaw?.preference === "morning" ||
    timingRaw?.preference === "day" ||
    timingRaw?.preference === "evening" ||
    timingRaw?.preference === "window"
      ? timingRaw.preference
      : "any"
  const periodRaw =
    raw.period && typeof raw.period === "object"
      ? (raw.period as Record<string, unknown>)
      : undefined
  const pauseRanges = Array.isArray(periodRaw?.pauseRanges)
    ? periodRaw.pauseRanges
        .filter((item): item is Record<string, unknown> =>
          Boolean(item) && typeof item === "object" && !Array.isArray(item),
        )
        .map((item) => ({
          startDate: typeof item.startDate === "string" ? item.startDate : "",
          endDate: typeof item.endDate === "string" ? item.endDate : "",
          ...(typeof item.reason === "string" && item.reason.trim()
            ? { reason: item.reason.trim() }
            : {}),
        }))
        .filter((item) => item.startDate && item.endDate && item.endDate >= item.startDate)
    : undefined

  return {
    target: {
      type: targetType,
      ...(numberOrUndefined(targetRaw?.targetValue) !== undefined
        ? { targetValue: numberOrUndefined(targetRaw?.targetValue) }
        : {}),
      ...(numberOrUndefined(targetRaw?.minimumValue) !== undefined
        ? { minimumValue: numberOrUndefined(targetRaw?.minimumValue) }
        : {}),
      ...(typeof targetRaw?.unit === "string" && targetRaw.unit.trim()
        ? { unit: targetRaw.unit.trim() }
        : {}),
    },
    timing: {
      preference: timingPreference,
      ...(typeof timingRaw?.startTime === "string" ? { startTime: timingRaw.startTime } : {}),
      ...(typeof timingRaw?.endTime === "string" ? { endTime: timingRaw.endTime } : {}),
    },
    period: {
      ...(typeof periodRaw?.startDate === "string" ? { startDate: periodRaw.startDate } : {}),
      ...(typeof periodRaw?.endDate === "string" ? { endDate: periodRaw.endDate } : {}),
      paused: periodRaw?.paused === true,
      ...(pauseRanges && pauseRanges.length > 0 ? { pauseRanges } : {}),
    },
    ...(isCharacterStatType(raw.statType) ? { statType: raw.statType } : {}),
    showOnDashboard: raw.showOnDashboard !== false,
  }
}

function serializeHabitSettings(settings: Habit["settings"]): Record<string, unknown> {
  if (!settings) return {}
  return {
    ...(settings.target ? { target: settings.target } : {}),
    ...(settings.timing ? { timing: settings.timing } : {}),
    ...(settings.period ? { period: settings.period } : {}),
    ...(settings.statType ? { statType: settings.statType } : {}),
    showOnDashboard: settings.showOnDashboard !== false,
  }
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
  if ("title" in patch && patch.title !== undefined) o.title = patch.title
  if ("description" in patch) o.description = patch.description ?? null
  if ("targetDate" in patch) o.target_date = patch.targetDate ?? null
  if ("status" in patch && patch.status !== undefined) {
    o.status = parseGoalStatusFromDb(patch.status)
  }
  if ("showOnDashboard" in patch && patch.showOnDashboard !== undefined) {
    o.show_on_dashboard = patch.showOnDashboard
  }
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

export function projectToProjectInsert(
  project: Project,
  userId: string,
): ProjectInsert {
  const goalId = project.goalId?.trim() || null
  return {
    id: project.id,
    user_id: userId,
    goal_id: goalId,
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
  if ("goalId" in patch) o.goal_id = patch.goalId?.trim() || null
  if ("title" in patch && patch.title !== undefined) o.title = patch.title
  if ("description" in patch) o.description = patch.description ?? null
  if ("statType" in patch) o.stat_type = patch.statType ?? null
  if ("phase" in patch) o.phase = patch.phase ?? null
  if ("targetDate" in patch) o.target_date = patch.targetDate ?? null
  if ("showOnDashboard" in patch && patch.showOnDashboard !== undefined) {
    o.show_on_dashboard = patch.showOnDashboard
  }
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
  if ("groupId" in patch && patch.groupId !== undefined) o.group_id = patch.groupId
  if ("projectId" in patch && patch.projectId !== undefined) {
    o.project_id = patch.projectId
  }
  if ("title" in patch && patch.title !== undefined) o.title = patch.title
  if ("completed" in patch && patch.completed !== undefined) {
    o.completed = patch.completed
  }
  if ("deadline" in patch) o.deadline = patch.deadline ?? null
  if ("notes" in patch) o.notes = patch.notes ?? null
  if ("priority" in patch) o.priority = patch.priority ?? null
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

export function buildDailyEntriesFromHabitLogRows(
  logs: HabitLogRow[],
): NonNullable<Habit["dailyEntries"]> {
  const entries: NonNullable<Habit["dailyEntries"]> = {}
  for (const log of logs) {
    entries[log.date] = {
      completed: log.completed,
      ...(log.value !== null ? { value: Number(log.value) } : {}),
      ...(log.note ? { note: log.note } : {}),
      ...(log.skipped ? { skipped: true } : {}),
      ...(log.status ? { status: log.status } : {}),
      ...(log.reason
        ? { reason: log.reason as NonNullable<Habit["dailyEntries"]>[string]["reason"] }
        : {}),
      ...(log.helped ? { helped: log.helped } : {}),
      ...(log.rescheduled_to ? { rescheduledTo: log.rescheduled_to } : {}),
      ...(log.recorded_at ? { recordedAt: log.recorded_at } : {}),
      ...(log.energy != null && log.energy >= 1 && log.energy <= 5
        ? { energy: log.energy as 1 | 2 | 3 | 4 | 5 }
        : {}),
      ...(log.load ? { load: log.load } : {}),
    }
  }
  return entries
}

export function habitRowToHabit(
  row: HabitRow,
  logs: HabitLogRow[] = [],
): Habit {
  return {
    id: row.id,
    name: row.title,
    description: row.description ?? undefined,
    goalId: row.goal_id ?? undefined,
    projectId: row.project_id ?? undefined,
    schedule: parseHabitScheduleFromDb(row.schedule),
    settings: parseHabitSettingsFromDb(row.settings),
    dailyStatus: buildDailyStatusFromHabitLogRows(logs),
    dailyEntries: buildDailyEntriesFromHabitLogRows(logs),
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
    schedule: habit.schedule
      ? {
          mode: habit.schedule.mode ?? "times-per-week",
          targetPerWeek: habit.schedule.targetPerWeek,
          ...(habit.schedule.daysOfWeek ? { daysOfWeek: habit.schedule.daysOfWeek } : {}),
        }
      : null,
    settings: serializeHabitSettings(habit.settings),
    goal_id: habit.projectId ? null : (habit.goalId ?? null),
    project_id: habit.projectId ?? null,
  }
}

export function habitToHabitUpdate(patch: Partial<Habit>): HabitUpdate {
  const o: HabitUpdate = {}
  if ("name" in patch && patch.name !== undefined) o.title = patch.name
  if ("description" in patch) o.description = patch.description ?? null
  if ("schedule" in patch) {
    o.schedule = patch.schedule
      ? {
          mode: patch.schedule.mode ?? "times-per-week",
          targetPerWeek: patch.schedule.targetPerWeek,
          ...(patch.schedule.daysOfWeek ? { daysOfWeek: patch.schedule.daysOfWeek } : {}),
        }
      : null
  }
  if ("settings" in patch) {
    o.settings = serializeHabitSettings(patch.settings)
  }
  if ("projectId" in patch) {
    o.project_id = patch.projectId ?? null
    if (patch.projectId) o.goal_id = null
  }
  if ("goalId" in patch) {
    o.goal_id = patch.projectId ? null : (patch.goalId ?? null)
  }
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
  if ("title" in patch && patch.title !== undefined) o.title = patch.title
  if ("date" in patch && patch.date !== undefined) o.target_date = patch.date
  if ("completed" in patch && patch.completed !== undefined) {
    o.completed = patch.completed
  }
  if ("projectId" in patch) {
    o.project_id = patch.projectId ?? null
    if (patch.projectId) o.goal_id = null
  }
  if ("goalId" in patch) {
    o.goal_id = patch.goalId ?? null
    if (patch.goalId) o.project_id = null
  }
  return o
}
