/**
 * PostgREST / PostgreSQL row shapes (snake_case) — see docs/database-schema-plan.md.
 */

export type ProfileRow = {
  id: string
  email: string | null
  display_name: string | null
  created_at: string
  updated_at: string
}

export type GoalRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  target_date: string | null
  status: "active" | "later" | "archived"
  show_on_dashboard: boolean
  created_at: string
  updated_at: string
}

export type GoalInsert = {
  id?: string
  user_id: string
  title: string
  description: string | null
  target_date: string | null
  status: "active" | "later" | "archived"
  show_on_dashboard: boolean
}

export type GoalUpdate = Partial<{
  title: string
  description: string | null
  target_date: string | null
  status: "active" | "later" | "archived"
  show_on_dashboard: boolean
}>

export type ProjectRow = {
  id: string
  user_id: string
  goal_id: string
  title: string
  description: string | null
  stat_type: string | null
  phase: string | null
  target_date: string | null
  show_on_dashboard: boolean
  created_at: string
  updated_at: string
}

export type ProjectInsert = {
  id?: string
  user_id: string
  goal_id: string
  title: string
  description: string | null
  stat_type: string | null
  phase: string | null
  target_date: string | null
  show_on_dashboard: boolean
}

export type ProjectUpdate = Partial<{
  goal_id: string
  title: string
  description: string | null
  stat_type: string | null
  phase: string | null
  target_date: string | null
  show_on_dashboard: boolean
}>

export type ProjectGroupRow = {
  id: string
  user_id: string
  project_id: string
  title: string
  sort_order: number
  created_at: string
  updated_at: string
}

export type ProjectGroupInsert = {
  id?: string
  user_id: string
  project_id: string
  title: string
  sort_order: number
}

export type ProjectGroupUpdate = Partial<{
  title: string
  sort_order: number
}>

export type TaskRow = {
  id: string
  user_id: string
  project_id: string
  group_id: string
  title: string
  completed: boolean
  deadline: string | null
  notes: string | null
  priority: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export type TaskInsert = {
  id?: string
  user_id: string
  project_id: string
  group_id: string
  title: string
  completed: boolean
  deadline: string | null
  notes: string | null
  priority: string | null
  sort_order: number
}

export type TaskUpdate = Partial<{
  project_id: string
  group_id: string
  title: string
  completed: boolean
  deadline: string | null
  notes: string | null
  priority: string | null
  sort_order: number
}>

export type HabitRow = {
  id: string
  user_id: string
  title: string
  description: string | null
  schedule: Record<string, unknown> | null
  goal_id: string | null
  project_id: string | null
  created_at: string
  updated_at: string
}

export type HabitInsert = {
  id?: string
  user_id: string
  title: string
  description: string | null
  schedule: Record<string, unknown> | null
  goal_id: string | null
  project_id: string | null
}

export type HabitUpdate = Partial<{
  title: string
  description: string | null
  schedule: Record<string, unknown> | null
  goal_id: string | null
  project_id: string | null
}>

export type HabitLogRow = {
  id: string
  user_id: string
  habit_id: string
  date: string
  completed: boolean
  created_at: string
  updated_at: string
}

export type HabitLogInsert = {
  id?: string
  user_id: string
  habit_id: string
  date: string
  completed: boolean
}

export type HabitLogUpdate = Partial<{
  completed: boolean
}>

export type MilestoneRow = {
  id: string
  user_id: string
  goal_id: string | null
  project_id: string | null
  title: string
  target_date: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

export type MilestoneInsert = {
  id?: string
  user_id: string
  goal_id: string | null
  project_id: string | null
  title: string
  target_date: string | null
  completed: boolean
}

export type MilestoneUpdate = Partial<{
  goal_id: string | null
  project_id: string | null
  title: string
  target_date: string | null
  completed: boolean
}>

export type UserSettingsRow = {
  user_id: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type UserSettingsUpsert = {
  user_id: string
  settings: Record<string, unknown>
}
