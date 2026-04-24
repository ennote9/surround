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
  title: string
  description?: string
  /** undefined = как «Сейчас» для старых данных */
  phase?: ProjectPhase
  /** false = скрыть плитку на Главной; undefined = как раньше, показывать */
  showOnDashboard?: boolean
  /** Какой RPG-стат качает проект; undefined = не влияет на статы */
  statType?: CharacterStatType
  groups: TaskGroup[]
  createdAt: string
  updatedAt: string
}

export type Habit = {
  id: string
  name: string
  description?: string
  dailyStatus: Record<string, boolean>
  createdAt: string
  updatedAt: string
}

export type Milestone = {
  id: string
  projectId?: string
  title: string
  date: string
  completed: boolean
  createdAt: string
  updatedAt: string
}

export type AppState = {
  version: number
  projects: Project[]
  habits: Habit[]
  milestones: Milestone[]
  settings: AppSettings
}
