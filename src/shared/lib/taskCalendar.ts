import type { Project, Task, TaskGroup } from "@/store/appState.types"
import { normalizeTaskTime } from "@/shared/lib/taskSchedule"
import { isTaskBlocked } from "@/shared/lib/taskDependencies"

export type TaskCalendarEventKind = "deadline" | "control"

export type TaskCalendarEvent = {
  id: string
  kind: TaskCalendarEventKind
  date: string
  time?: string
  task: Task
  project: Project
  group: TaskGroup
  blocked: boolean
}

export function getTaskCalendarEvents(
  projects: Project[],
): TaskCalendarEvent[] {
  const events: TaskCalendarEvent[] = []

  for (const project of projects) {
    for (const group of project.groups) {
      for (const task of group.tasks) {
        const blocked = isTaskBlocked(project, task)

        if (task.deadline) {
          events.push({
            id: `${task.id}:deadline`,
            kind: "deadline",
            date: task.deadline.slice(0, 10),
            time: normalizeTaskTime(task.deadlineTime),
            task,
            project,
            group,
            blocked,
          })
        }

        if (task.followUpDate) {
          events.push({
            id: `${task.id}:control`,
            kind: "control",
            date: task.followUpDate.slice(0, 10),
            time: normalizeTaskTime(task.followUpTime),
            task,
            project,
            group,
            blocked,
          })
        }
      }
    }
  }

  return events.sort(compareTaskCalendarEvents)
}

export function compareTaskCalendarEvents(
  a: TaskCalendarEvent,
  b: TaskCalendarEvent,
): number {
  const dateDelta = a.date.localeCompare(b.date)
  if (dateDelta !== 0) return dateDelta

  const aTime = a.time ?? "24:00"
  const bTime = b.time ?? "24:00"
  const timeDelta = aTime.localeCompare(bTime)
  if (timeDelta !== 0) return timeDelta

  if (a.kind !== b.kind) {
    return a.kind === "deadline" ? -1 : 1
  }

  return a.task.title.localeCompare(b.task.title, "ru")
}

export function groupTaskCalendarEventsByDate(
  events: TaskCalendarEvent[],
): Map<string, TaskCalendarEvent[]> {
  const grouped = new Map<string, TaskCalendarEvent[]>()

  for (const event of events) {
    const list = grouped.get(event.date) ?? []
    list.push(event)
    grouped.set(event.date, list)
  }

  return grouped
}
