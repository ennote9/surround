import type {
  AppState,
  AppSettings,
  CharacterStatType,
  Goal,
  GoalStatus,
  Habit,
  Milestone,
  Project,
  ProjectPhase,
  Task,
  TaskGroup,
} from "./appState.types"

export type AddProjectPayload = {
  id?: string
  title: string
  goalId?: string
  description?: string
  showOnDashboard?: boolean
  statType?: CharacterStatType
  phase?: ProjectPhase
  targetDate?: string
  createdAt?: string
  updatedAt?: string
}

export type UpdateProjectPayload = {
  id: string
  patch: Partial<
    Pick<
      Project,
      | "title"
      | "goalId"
      | "description"
      | "showOnDashboard"
      | "statType"
      | "phase"
      | "targetDate"
    >
  >
}

export type DeleteProjectPayload = { id: string }

export type AddGoalPayload = {
  id?: string
  title: string
  description?: string
  targetDate?: string
  status?: GoalStatus
  showOnDashboard?: boolean
  createdAt?: string
  updatedAt?: string
}

export type UpdateGoalPayload = {
  goalId: string
  patch: Partial<
    Pick<Goal, "title" | "description" | "targetDate" | "status" | "showOnDashboard">
  >
}

export type AddGroupPayload = {
  id?: string
  projectId: string
  title: string
  createdAt?: string
  updatedAt?: string
}

export type UpdateGroupPayload = {
  projectId: string
  groupId: string
  patch: Partial<Pick<TaskGroup, "title" | "order">>
}

export type DeleteGroupPayload = { projectId: string; groupId: string }

export type AddTaskPayload = {
  id?: string
  projectId: string
  groupId: string
  title: string
  deadline?: string
  notes?: string
  priority?: Task["priority"]
  createdAt?: string
  updatedAt?: string
}

export type UpdateTaskPayload = {
  projectId: string
  groupId: string
  taskId: string
  patch: Partial<
    Pick<Task, "title" | "completed" | "deadline" | "notes" | "priority">
  >
}

export type TaskRefPayload = {
  projectId: string
  groupId: string
  taskId: string
  completed?: boolean
}

export type AddHabitPayload = {
  id?: string
  name: string
  description?: string
  createdAt?: string
  updatedAt?: string
}

export type UpdateHabitPayload = {
  id: string
  patch: Partial<Pick<Habit, "name" | "description" | "dailyStatus">>
}

export type DeleteHabitPayload = { id: string }

export type ToggleHabitDatePayload = {
  id: string
  date: string
  completed?: boolean
}

export type AddMilestonePayload = {
  id?: string
  title: string
  date: string
  projectId?: string
  completed?: boolean
  createdAt?: string
  updatedAt?: string
}

export type UpdateMilestonePayload = {
  id: string
  patch: Partial<
    Pick<Milestone, "title" | "date" | "completed" | "projectId">
  >
}

export type DeleteMilestonePayload = { id: string }

export type ToggleMilestonePayload = { id: string; completed?: boolean }

export type UpdateSettingsPayload = { patch: Partial<AppSettings> }

export type AppAction =
  | { type: "RESET_STATE" }
  | { type: "IMPORT_STATE"; payload: AppState }
  | { type: "ADD_GOAL"; payload: AddGoalPayload }
  | { type: "UPDATE_GOAL"; payload: UpdateGoalPayload }
  | { type: "ARCHIVE_GOAL"; payload: { goalId: string } }
  | { type: "ADD_PROJECT"; payload: AddProjectPayload }
  | { type: "UPDATE_PROJECT"; payload: UpdateProjectPayload }
  | { type: "DELETE_PROJECT"; payload: DeleteProjectPayload }
  | { type: "ADD_GROUP"; payload: AddGroupPayload }
  | { type: "UPDATE_GROUP"; payload: UpdateGroupPayload }
  | { type: "DELETE_GROUP"; payload: DeleteGroupPayload }
  | { type: "ADD_TASK"; payload: AddTaskPayload }
  | { type: "UPDATE_TASK"; payload: UpdateTaskPayload }
  | { type: "TOGGLE_TASK"; payload: TaskRefPayload }
  | { type: "DELETE_TASK"; payload: TaskRefPayload }
  | { type: "ADD_HABIT"; payload: AddHabitPayload }
  | { type: "UPDATE_HABIT"; payload: UpdateHabitPayload }
  | { type: "DELETE_HABIT"; payload: DeleteHabitPayload }
  | { type: "TOGGLE_HABIT_DATE"; payload: ToggleHabitDatePayload }
  | { type: "ADD_MILESTONE"; payload: AddMilestonePayload }
  | { type: "UPDATE_MILESTONE"; payload: UpdateMilestonePayload }
  | { type: "DELETE_MILESTONE"; payload: DeleteMilestonePayload }
  | { type: "TOGGLE_MILESTONE"; payload: ToggleMilestonePayload }
  | { type: "UPDATE_SETTINGS"; payload: UpdateSettingsPayload }
