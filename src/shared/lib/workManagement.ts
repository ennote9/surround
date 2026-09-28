import type {
  Habit,
  Project,
  Task,
  TaskDeferReason,
  TaskStatus,
  WorkspaceMode,
} from "@/store/appState.types"

export const TASK_STATUS_OPTIONS: ReadonlyArray<{
  value: TaskStatus
  label: string
}> = [
  { value: "planned", label: "Запланировано" },
  { value: "in_progress", label: "В работе" },
  { value: "waiting", label: "Жду ответ" },
  { value: "delegated", label: "Делегировано" },
  { value: "control", label: "На контроле" },
  { value: "done", label: "Готово" },
]

export const TASK_DEFER_REASON_OPTIONS: ReadonlyArray<{
  value: TaskDeferReason
  label: string
}> = [
  { value: "priority_changed", label: "Сменился приоритет" },
  { value: "dependency", label: "Жду зависимость" },
  { value: "capacity", label: "Не хватает ресурса" },
  { value: "blocked", label: "Есть блокер" },
  { value: "deadline_changed", label: "Изменился срок" },
  { value: "other", label: "Другое" },
]

export function getTaskDeferReasonLabel(
  reason?: TaskDeferReason,
): string | undefined {
  if (!reason) return undefined
  return TASK_DEFER_REASON_OPTIONS.find((item) => item.value === reason)?.label
}

export function getProjectContext(project: Project): "personal" | "work" {
  return project.context === "work" ? "work" : "personal"
}

export function projectMatchesWorkspaceMode(
  project: Project,
  mode: WorkspaceMode,
): boolean {
  return mode === "all" || getProjectContext(project) === mode
}

export function habitMatchesWorkspaceMode(
  habit: Habit,
  projects: Project[],
  mode: WorkspaceMode,
): boolean {
  if (mode === "all") return true

  const projectId = habit.projectId?.trim()
  if (!projectId) {
    return mode === "personal"
  }

  const project = projects.find((item) => item.id === projectId)
  if (!project) {
    return mode === "personal"
  }

  return getProjectContext(project) === mode
}

export function getTaskStatus(task: Task): TaskStatus {
  if (task.completed) return "done"
  return task.status ?? "planned"
}

export function getTaskStatusLabel(task: Task): string {
  const status = getTaskStatus(task)
  return TASK_STATUS_OPTIONS.find((item) => item.value === status)?.label ?? "Запланировано"
}
