export type ProjectPhase = "active" | "later" | "strategic"

export type TaskPriority = "low" | "medium" | "high"

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
  deadline?: string
  notes?: string
  priority?: TaskPriority
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

export type HabitPeriod = {
  startDate?: string
  endDate?: string
  paused?: boolean
}

export type HabitSettings = {
  target?: HabitTarget
  timing?: HabitTiming
  period?: HabitPeriod
  statType?: CharacterStatType
  showOnDashboard?: boolean
}

export type HabitEntry = {
  completed: boolean
  value?: number
  note?: string
  skipped?: boolean
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
