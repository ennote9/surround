export type ProjectPhase = "active" | "later" | "strategic"

export type LifeContext = "personal" | "work"
export type WorkspaceMode = "all" | LifeContext

export type TaskPriority = "low" | "medium" | "high"
export type TaskReminderPreset =
  | "at_time"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "1d"
  | "morning"
export type TaskStatus =
  | "planned"
  | "in_progress"
  | "waiting"
  | "delegated"
  | "control"
  | "done"

export type TaskDeferReason =
  | "priority_changed"
  | "dependency"
  | "capacity"
  | "blocked"
  | "deadline_changed"
  | "other"

export type WorkInboxItem = {
  id: string
  title: string
  createdAt: string
  /** Контекст входящего. У старых записей отсутствие значения трактуется как work. */
  context?: LifeContext
}

export type WorkDayClosure = {
  closedAt: string
  note?: string
}

export type WorkWeeklyReview = {
  reviewedAt: string
  wins?: string
  blockers?: string
  decisions?: string
  nextWeek?: string
}

export type CharacterStatType =
  | "intelligence"
  | "language"
  | "focus"
  | "discipline"
  | "career"
  | "skills"
  | "finance"
  | "entrepreneurship"
  | "health"
  | "strength"
  | "energy"
  | "social"
  | "relationships"
  | "charisma"
  | "creativity"
  | "mindfulness"
  | "lifestyle"
  | "adventure"

export type AppSettings = {
  theme: "dark" | "light" | "system"
  accentColor: string
  workspaceMode: WorkspaceMode
  workInbox: WorkInboxItem[]
  dailyFocus: Record<string, string[]>
  workDayClosures: Record<string, WorkDayClosure>
  workWipLimit: number
  workWeeklyReviews: Record<string, WorkWeeklyReview>
}

export type GoalStatus = "active" | "later" | "archived"

export type Goal = {
  id: string
  title: string
  description?: string
  targetDate?: string
  status: GoalStatus
  showOnDashboard?: boolean
  createdAt: string
  updatedAt: string
}

export type Task = {
  id: string
  groupId: string
  projectId: string
  title: string
  completed: boolean
  status?: TaskStatus
  deadline?: string
  /** Optional local wall-clock time (HH:mm). Undefined means date-only/all-day deadline. */
  deadlineTime?: string
  deadlineReminder?: TaskReminderPreset
  notes?: string
  priority?: TaskPriority
  assignee?: string
  followUpDate?: string
  /** Optional local wall-clock time (HH:mm) for control/follow-up. */
  followUpTime?: string
  followUpReminder?: TaskReminderPreset
  deferReason?: TaskDeferReason
  deferNote?: string
  deferredUntil?: string
  delegationNote?: string
  delegatedAt?: string
  isNextAction?: boolean
  statusChangedAt?: string
  completedAt?: string
  /** Task ids that must be completed before this task is unblocked. */
  blockedByTaskIds?: string[]
  /** Optional successor to mark as the project's next task after completion. */
  completionNextTaskId?: string
  createdAt: string
  updatedAt: string
}

export type TaskGroup = {
  id: string
  projectId: string
  title: string
  tasks: Task[]
  order: number
  createdAt: string
  updatedAt: string
}

export type Project = {
  id: string
  goalId?: string
  title: string
  description?: string
  /** undefined в старых данных трактуется как personal. */
  context?: LifeContext
  /** undefined = как «Сейчас» для старых данных */
  phase?: ProjectPhase
  targetDate?: string
  /** false = скрыть плитку на Главной; undefined = как раньше, показывать */
  showOnDashboard?: boolean
  /** Какой RPG-стат качает проект; undefined = не влияет на статы */
  statType?: CharacterStatType
  groups: TaskGroup[]
  createdAt: string
  updatedAt: string
}

export type HabitCompletionType = "check" | "duration" | "quantity"

export type HabitScheduleMode =
  | "times-per-week"
  | "specific-days"
  | "daily"

export type HabitTimePreference =
  | "any"
  | "morning"
  | "day"
  | "evening"
  | "window"

export type HabitSchedule = {
  /** Старые данные без mode интерпретируются как times-per-week. */
  mode?: HabitScheduleMode
  /** Недельная норма. Для specific-days синхронизируется с daysOfWeek.length. */
  targetPerWeek: number
  /** ISO weekday: 1 = Пн ... 7 = Вс. */
  daysOfWeek?: number[]
}

export type HabitTarget = {
  type: HabitCompletionType
  /** Основная цель за одно выполнение: минуты, шаги, страницы и т.п. */
  targetValue?: number
  /** Минимум, после которого день считается выполненным. */
  minimumValue?: number
  /** Пользовательская единица для quantity. Для duration обычно "мин". */
  unit?: string
}

export type HabitTiming = {
  preference: HabitTimePreference
  startTime?: string
  endTime?: string
}

export type HabitPauseRange = {
  startDate: string
  endDate: string
  reason?: string
}

export type HabitPeriod = {
  startDate?: string
  endDate?: string
  paused?: boolean
  /** Date ranges intentionally excluded from routine calculations. */
  pauseRanges?: HabitPauseRange[]
}

export type HabitSettings = {
  target?: HabitTarget
  timing?: HabitTiming
  period?: HabitPeriod
  statType?: CharacterStatType
  showOnDashboard?: boolean
}

export type HabitEntryStatus =
  | "planned"
  | "completed"
  | "partial"
  | "skipped"
  | "rescheduled"

export type HabitEntryReason =
  | "no-time"
  | "fatigue"
  | "forgot"
  | "health"
  | "no-conditions"
  | "motivation"
  | "plan-too-hard"
  | "other"

export type HabitEntryLoad = "low" | "normal" | "high"

export type HabitEntry = {
  completed: boolean
  value?: number
  note?: string
  skipped?: boolean
  /** Structured daily outcome; absent on legacy entries. */
  status?: HabitEntryStatus
  /** Structured reason used for later analytics. */
  reason?: HabitEntryReason
  /** Optional positive context: what helped this time. */
  helped?: string
  /** Destination date when the occurrence was moved. */
  rescheduledTo?: string
  /** Time the outcome was recorded. */
  recordedAt?: string
  /** Optional subjective energy score from 1 to 5. */
  energy?: 1 | 2 | 3 | 4 | 5
  /** Optional perceived workload. */
  load?: HabitEntryLoad
}

export type Habit = {
  id: string
  name: string
  description?: string
  /** Опциональная прямая связь с целью. */
  goalId?: string
  /** Опциональная связь с проектом; через проект привычка наследует контекст цели. */
  projectId?: string
  schedule?: HabitSchedule
  settings?: HabitSettings
  /** Совместимость со старой логикой и быстрыми boolean-check привычками. */
  dailyStatus: Record<string, boolean>
  /** Расширенный журнал: значение, заметка, пропуск. */
  dailyEntries?: Record<string, HabitEntry>
  createdAt: string
  updatedAt: string
}

export type Milestone = {
  id: string
  /** Веха уровня цели в БД (goal_id); опционально в UI */
  goalId?: string
  projectId?: string
  title: string
  date: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type AppState = {
  version: 2
  goals: Goal[]
  projects: Project[]
  habits: Habit[]
  milestones: Milestone[]
  settings: AppSettings
}
