import type { Project, Task } from "@/store/appState.types"

export function getProjectTasks(project: Project): Task[] {
  return project.groups.flatMap((group) => group.tasks)
}

export function getTaskById(
  project: Project,
  taskId: string,
): Task | undefined {
  for (const group of project.groups) {
    const task = group.tasks.find((item) => item.id === taskId)
    if (task) return task
  }
  return undefined
}

export function getIncompleteTaskBlockers(
  project: Project,
  task: Task,
): Task[] {
  const blockerIds = new Set(task.blockedByTaskIds ?? [])
  if (blockerIds.size === 0) return []

  return getProjectTasks(project).filter(
    (candidate) => blockerIds.has(candidate.id) && !candidate.completed,
  )
}

export function isTaskBlocked(project: Project, task: Task): boolean {
  return getIncompleteTaskBlockers(project, task).length > 0
}

/**
 * Applies the local mirror of the database completion automation:
 * when a task has a configured completion successor and all of that
 * successor's blocking tasks are complete, the successor becomes the
 * project's single "next action".
 */
export function applyTaskCompletionSuccessor(
  project: Project,
  completedTaskId: string,
  changedAt: string,
): Project {
  const completedTask = getTaskById(project, completedTaskId)
  const successorId = completedTask?.completionNextTaskId
  if (!completedTask?.completed || !successorId) return project

  const successor = getTaskById(project, successorId)
  if (!successor || successor.completed) return project

  if (getIncompleteTaskBlockers(project, successor).length > 0) {
    return project
  }

  return {
    ...project,
    updatedAt: changedAt,
    groups: project.groups.map((group) => ({
      ...group,
      tasks: group.tasks.map((task) => {
        if (task.id === successorId) {
          return {
            ...task,
            isNextAction: true,
            updatedAt: changedAt,
          }
        }
        if (task.isNextAction) {
          return {
            ...task,
            isNextAction: false,
            updatedAt: changedAt,
          }
        }
        return task
      }),
    })),
  }
}


export function wouldCreateBlockingDependencyCycle(
  project: Project,
  successorTaskId: string,
  predecessorTaskId: string,
): boolean {
  if (!successorTaskId || !predecessorTaskId) return false
  if (successorTaskId === predecessorTaskId) return true

  const tasks = getProjectTasks(project)
  const successorsByBlocker = new Map<string, string[]>()

  for (const task of tasks) {
    for (const blockerId of task.blockedByTaskIds ?? []) {
      const successors = successorsByBlocker.get(blockerId) ?? []
      successors.push(task.id)
      successorsByBlocker.set(blockerId, successors)
    }
  }

  const queue = [successorTaskId]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || visited.has(current)) continue
    visited.add(current)

    for (const next of successorsByBlocker.get(current) ?? []) {
      if (next === predecessorTaskId) return true
      if (!visited.has(next)) queue.push(next)
    }
  }

  return false
}
