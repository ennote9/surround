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
  if (!completedTask?.completed) return project

  const directSuccessorId = completedTask.completionNextTaskId
  const directSuccessor = directSuccessorId
    ? getTaskById(project, directSuccessorId)
    : undefined

  let successor =
    directSuccessor &&
    !directSuccessor.completed &&
    getIncompleteTaskBlockers(project, directSuccessor).length === 0
      ? directSuccessor
      : undefined

  if (!successor) {
    const tasks = getProjectTasks(project)
    successor = tasks.find((candidate) => {
      if (candidate.completed) return false
      if (!(candidate.blockedByTaskIds ?? []).includes(completedTaskId)) {
        return false
      }
      if (getIncompleteTaskBlockers(project, candidate).length > 0) {
        return false
      }

      return tasks.some(
        (predecessor) =>
          predecessor.completed &&
          predecessor.completionNextTaskId === candidate.id,
      )
    })
  }

  if (!successor) return project

  const successorId = successor.id
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


export function applyTaskEligibilityAfterRelationChange(
  project: Project,
  taskId: string,
  changedAt: string,
): Project {
  const task = getTaskById(project, taskId)
  if (!task || task.completed) return project
  if (getIncompleteTaskBlockers(project, task).length > 0) return project

  const hasCompletedContinuation = getProjectTasks(project).some(
    (predecessor) =>
      predecessor.completed &&
      predecessor.completionNextTaskId === task.id,
  )
  if (!hasCompletedContinuation) return project

  return {
    ...project,
    updatedAt: changedAt,
    groups: project.groups.map((group) => ({
      ...group,
      tasks: group.tasks.map((candidate) => {
        if (candidate.id === task.id) {
          return {
            ...candidate,
            isNextAction: true,
            updatedAt: changedAt,
          }
        }
        if (candidate.isNextAction) {
          return {
            ...candidate,
            isNextAction: false,
            updatedAt: changedAt,
          }
        }
        return candidate
      }),
    })),
  }
}
