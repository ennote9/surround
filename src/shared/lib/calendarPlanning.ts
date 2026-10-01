import type { Project, Task } from "@/store/appState.types"
import { getIncompleteTaskBlockers } from "@/shared/lib/taskDependencies"
import { normalizeTaskTime } from "@/shared/lib/taskSchedule"

export type CalendarPlanningIssueKind =
  | "blocked_deadline"
  | "blocker_without_deadline"
  | "dependency_deadline_order"
  | "control_after_deadline"
  | "deferred_past_deadline"

export type CalendarPlanningIssueSeverity = "warning" | "attention"

export type CalendarPlanningIssue = {
  id: string
  kind: CalendarPlanningIssueKind
  severity: CalendarPlanningIssueSeverity
  projectId: string
  groupId: string
  taskId: string
  relatedTaskId?: string
  eventKind: "deadline" | "control"
  date: string
  title: string
  message: string
}

export type CalendarDayLoad = {
  date: string
  eventCount: number
  openEventCount: number
  taskCount: number
  deadlineCount: number
  controlCount: number
  blockedCount: number
  exactTimeCount: number
}

export type CalendarPlanningAnalysis = {
  issues: CalendarPlanningIssue[]
  issueTaskIds: Set<string>
  issuesByTaskId: Map<string, CalendarPlanningIssue[]>
  dayLoads: Map<string, CalendarDayLoad>
  peakDates: Set<string>
  peakOpenEventCount: number
}

function inRange(date: string | undefined, start: string, end: string): boolean {
  if (!date) return false
  const value = date.slice(0, 10)
  return value >= start && value <= end
}

function deadlineKey(date?: string, time?: string): string | undefined {
  if (!date) return undefined
  return `${date.slice(0, 10)}T${normalizeTaskTime(time) ?? "24:00"}`
}

function controlKey(date?: string, time?: string): string | undefined {
  if (!date) return undefined
  return `${date.slice(0, 10)}T${normalizeTaskTime(time) ?? "00:00"}`
}

function addIssue(
  issues: CalendarPlanningIssue[],
  issue: CalendarPlanningIssue,
): void {
  if (issues.some((item) => item.id === issue.id)) return
  issues.push(issue)
}

function analyzeTaskIssues(
  project: Project,
  task: Task,
  groupId: string,
  startDate: string,
  endDate: string,
  issues: CalendarPlanningIssue[],
): void {
  if (task.completed) return

  const taskDeadline = task.deadline?.slice(0, 10)
  const followUpDate = task.followUpDate?.slice(0, 10)

  const deadlineSchedule = deadlineKey(task.deadline, task.deadlineTime)
  const controlSchedule = controlKey(task.followUpDate, task.followUpTime)

  if (
    deadlineSchedule &&
    controlSchedule &&
    controlSchedule > deadlineSchedule
  ) {
    const date =
      inRange(taskDeadline, startDate, endDate)
        ? taskDeadline!
        : followUpDate && inRange(followUpDate, startDate, endDate)
          ? followUpDate
          : undefined

    if (date) {
      addIssue(issues, {
        id: `${task.id}:control-after-deadline`,
        kind: "control_after_deadline",
        severity: "warning",
        projectId: project.id,
        groupId,
        taskId: task.id,
        eventKind: "control",
        date,
        title: task.title,
        message: "Контроль назначен позже дедлайна задачи.",
      })
    }
  }

  if (
    taskDeadline &&
    task.deferredUntil &&
    task.deferredUntil.slice(0, 10) > taskDeadline &&
    inRange(taskDeadline, startDate, endDate)
  ) {
    addIssue(issues, {
      id: `${task.id}:deferred-past-deadline`,
      kind: "deferred_past_deadline",
      severity: "warning",
      projectId: project.id,
      groupId,
      taskId: task.id,
      eventKind: "deadline",
      date: taskDeadline,
      title: task.title,
      message: `Задача отложена до ${task.deferredUntil.slice(0, 10)}, то есть позже собственного дедлайна.`,
    })
  }

  if (!taskDeadline || !inRange(taskDeadline, startDate, endDate)) {
    return
  }

  const blockers = getIncompleteTaskBlockers(project, task)
  if (blockers.length === 0) return

  let hasSpecificDependencyIssue = false

  for (const blocker of blockers) {
    const blockerDeadline = blocker.deadline?.slice(0, 10)
    if (!blockerDeadline) {
      hasSpecificDependencyIssue = true
      addIssue(issues, {
        id: `${task.id}:blocker-without-deadline:${blocker.id}`,
        kind: "blocker_without_deadline",
        severity: "attention",
        projectId: project.id,
        groupId,
        taskId: task.id,
        relatedTaskId: blocker.id,
        eventKind: "deadline",
        date: taskDeadline,
        title: task.title,
        message: `Блокирующая задача «${blocker.title}» не имеет дедлайна.`,
      })
      continue
    }

    const blockerSchedule = deadlineKey(
      blocker.deadline,
      blocker.deadlineTime,
    )
    if (
      blockerSchedule &&
      deadlineSchedule &&
      blockerSchedule > deadlineSchedule
    ) {
      hasSpecificDependencyIssue = true
      addIssue(issues, {
        id: `${task.id}:dependency-order:${blocker.id}`,
        kind: "dependency_deadline_order",
        severity: "warning",
        projectId: project.id,
        groupId,
        taskId: task.id,
        relatedTaskId: blocker.id,
        eventKind: "deadline",
        date: taskDeadline,
        title: task.title,
        message: `Блокер «${blocker.title}» запланирован позже дедлайна этой задачи.`,
      })
    }
  }

  if (!hasSpecificDependencyIssue) {
    addIssue(issues, {
      id: `${task.id}:blocked-deadline`,
      kind: "blocked_deadline",
      severity: "attention",
      projectId: project.id,
      groupId,
      taskId: task.id,
      eventKind: "deadline",
      date: taskDeadline,
      title: task.title,
      message: `На дату дедлайна задача всё ещё зависит от ${blockers.length} незавершённ${blockers.length === 1 ? "ой задачи" : "ых задач"}.`,
    })
  }
}

export function analyzeCalendarPlanning(
  projects: Project[],
  startDate: string,
  endDate: string,
): CalendarPlanningAnalysis {
  const issues: CalendarPlanningIssue[] = []
  const dayLoads = new Map<string, CalendarDayLoad>()
  const taskIdsByDate = new Map<string, Set<string>>()

  for (const project of projects) {
    for (const group of project.groups) {
      for (const task of group.tasks) {
        analyzeTaskIssues(
          project,
          task,
          group.id,
          startDate,
          endDate,
          issues,
        )

        const blocked =
          !task.completed &&
          getIncompleteTaskBlockers(project, task).length > 0

        const taskDates: Array<{
          date?: string
          kind: "deadline" | "control"
          time?: string
        }> = [
          {
            date: task.deadline,
            kind: "deadline",
            time: task.deadlineTime,
          },
          {
            date: task.followUpDate,
            kind: "control",
            time: task.followUpTime,
          },
        ]

        for (const entry of taskDates) {
          if (!entry.date) continue
          const date = entry.date.slice(0, 10)
          if (!inRange(date, startDate, endDate)) continue

          const current = dayLoads.get(date) ?? {
            date,
            eventCount: 0,
            openEventCount: 0,
            taskCount: 0,
            deadlineCount: 0,
            controlCount: 0,
            blockedCount: 0,
            exactTimeCount: 0,
          }

          current.eventCount += 1
          if (!task.completed) current.openEventCount += 1
          if (entry.kind === "deadline") current.deadlineCount += 1
          else current.controlCount += 1
          if (blocked) current.blockedCount += 1
          if (normalizeTaskTime(entry.time)) current.exactTimeCount += 1

          dayLoads.set(date, current)

          const taskIds = taskIdsByDate.get(date) ?? new Set<string>()
          taskIds.add(task.id)
          taskIdsByDate.set(date, taskIds)
        }
      }
    }
  }

  for (const [date, taskIds] of taskIdsByDate) {
    const load = dayLoads.get(date)
    if (load) load.taskCount = taskIds.size
  }

  const peakOpenEventCount = Math.max(
    0,
    ...Array.from(dayLoads.values(), (load) => load.openEventCount),
  )
  const peakDates = new Set(
    Array.from(dayLoads.values())
      .filter(
        (load) =>
          peakOpenEventCount >= 2 &&
          load.openEventCount === peakOpenEventCount,
      )
      .map((load) => load.date),
  )

  const issuesByTaskId = new Map<string, CalendarPlanningIssue[]>()
  for (const issue of issues) {
    const current = issuesByTaskId.get(issue.taskId) ?? []
    current.push(issue)
    issuesByTaskId.set(issue.taskId, current)
  }

  return {
    issues: issues.sort((a, b) => {
      const dateDelta = a.date.localeCompare(b.date)
      if (dateDelta !== 0) return dateDelta
      if (a.severity !== b.severity) {
        return a.severity === "warning" ? -1 : 1
      }
      return a.title.localeCompare(b.title, "ru")
    }),
    issueTaskIds: new Set(issues.map((issue) => issue.taskId)),
    issuesByTaskId,
    dayLoads,
    peakDates,
    peakOpenEventCount,
  }
}
