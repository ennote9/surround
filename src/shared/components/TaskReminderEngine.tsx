import { useEffect } from "react"
import { toast } from "sonner"
import { useAppState } from "@/store/useAppState"
import {
  getTaskReminderAt,
  getTaskReminderTargetLabel,
  type TaskReminderKind,
} from "@/shared/lib/taskReminders"
import { showBrowserNotification } from "@/shared/lib/browserNotifications"
import { TASK_REMINDER_SENT_STORAGE_KEY } from "@/shared/lib/storageKeys"
import type { Project, Task } from "@/store/appState.types"

const CATCH_UP_WINDOW_MS = 12 * 60 * 60 * 1000
const SENT_RETENTION_MS = 45 * 24 * 60 * 60 * 1000

type ReminderCandidate = {
  task: Task
  project: Project
  kind: TaskReminderKind
  scheduledAt: Date
  key: string
}

function loadSentReminders(): Record<string, number> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(TASK_REMINDER_SENT_STORAGE_KEY)
    if (!raw) return {}
    const parsed: unknown = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {}
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>).filter(
        (entry): entry is [string, number] =>
          typeof entry[1] === "number" && Number.isFinite(entry[1]),
      ),
    )
  } catch {
    return {}
  }
}

function saveSentReminders(sent: Record<string, number>, now: number): void {
  if (typeof window === "undefined") return
  const pruned = Object.fromEntries(
    Object.entries(sent).filter(([, timestamp]) => now - timestamp < SENT_RETENTION_MS),
  )
  try {
    window.localStorage.setItem(
      TASK_REMINDER_SENT_STORAGE_KEY,
      JSON.stringify(pruned),
    )
  } catch {
    // Reminder delivery should not fail because local storage is unavailable.
  }
}

function reminderKey(
  task: Task,
  kind: TaskReminderKind,
  scheduledAt: Date,
): string {
  const preset =
    kind === "deadline" ? task.deadlineReminder : task.followUpReminder
  const date = kind === "deadline" ? task.deadline : task.followUpDate
  const time = kind === "deadline" ? task.deadlineTime : task.followUpTime
  return [
    task.id,
    kind,
    preset ?? "none",
    date ?? "no-date",
    time ?? "all-day",
    scheduledAt.getTime(),
  ].join(":")
}

function collectCandidates(projects: Project[], now: Date): ReminderCandidate[] {
  const candidates: ReminderCandidate[] = []

  for (const project of projects) {
    if (project.phase !== undefined && project.phase !== "active") continue

    for (const group of project.groups) {
      for (const task of group.tasks) {
        if (task.completed) continue

        for (const kind of ["deadline", "control"] as const) {
          const scheduledAt = getTaskReminderAt(task, kind)
          if (!scheduledAt) continue

          const age = now.getTime() - scheduledAt.getTime()
          if (age < 0 || age > CATCH_UP_WINDOW_MS) continue

          candidates.push({
            task,
            project,
            kind,
            scheduledAt,
            key: reminderKey(task, kind, scheduledAt),
          })
        }
      }
    }
  }

  return candidates.sort(
    (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime(),
  )
}

function reminderTitle(kind: TaskReminderKind): string {
  return kind === "deadline"
    ? "Напоминание о дедлайне"
    : "Пора вернуться к задаче"
}

function reminderBody(candidate: ReminderCandidate): string {
  const target = getTaskReminderTargetLabel(candidate.task, candidate.kind)
  return `${candidate.task.title} · ${candidate.project.title} · ${target}`
}

export function TaskReminderEngine() {
  const { state } = useAppState()

  useEffect(() => {
    let disposed = false

    const checkReminders = async () => {
      if (disposed) return

      const now = new Date()
      const sent = loadSentReminders()
      const due = collectCandidates(state.projects, now).filter(
        (candidate) => sent[candidate.key] === undefined,
      )

      if (due.length === 0) {
        saveSentReminders(sent, now.getTime())
        return
      }

      for (const candidate of due) {
        sent[candidate.key] = now.getTime()
      }
      saveSentReminders(sent, now.getTime())

      const pageVisible =
        typeof document !== "undefined" &&
        document.visibilityState === "visible"

      if (pageVisible) {
        if (due.length <= 3) {
          for (const candidate of due) {
            toast.info(reminderTitle(candidate.kind), {
              description: reminderBody(candidate),
              duration: 12_000,
            })
          }
        } else {
          toast.info(`Напоминания: ${due.length}`, {
            description: `Требуют внимания несколько задач. Первая: ${due[0].task.title}`,
            duration: 12_000,
          })
        }
        return
      }

      if (due.length === 1) {
        const candidate = due[0]
        const shown = await showBrowserNotification({
          title: reminderTitle(candidate.kind),
          body: reminderBody(candidate),
          tag: `life-progress-${candidate.key}`,
          url: "/projects",
        })
        if (!shown) {
          toast.info(reminderTitle(candidate.kind), {
            description: reminderBody(candidate),
            duration: 12_000,
          })
        }
        return
      }

      const shown = await showBrowserNotification({
        title: `Life Progress OS · ${due.length} напоминаний`,
        body: `Требуют внимания несколько задач. Первая: ${due[0].task.title}`,
        tag: "life-progress-reminders-summary",
        url: "/projects",
      })
      if (!shown) {
        toast.info(`Напоминания: ${due.length}`, {
          description: `Первая задача: ${due[0].task.title}`,
          duration: 12_000,
        })
      }
    }

    void checkReminders()
    const intervalId = window.setInterval(() => {
      void checkReminders()
    }, 30_000)

    const handleFocus = () => void checkReminders()
    const handleVisibility = () => {
      if (document.visibilityState === "visible") void checkReminders()
    }

    window.addEventListener("focus", handleFocus)
    document.addEventListener("visibilitychange", handleVisibility)

    return () => {
      disposed = true
      window.clearInterval(intervalId)
      window.removeEventListener("focus", handleFocus)
      document.removeEventListener("visibilitychange", handleVisibility)
    }
  }, [state.projects])

  return null
}
