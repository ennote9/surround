import { parseISO, format, isValid } from "date-fns"
import type { Project, Task, TaskGroup } from "@/store/appState.types"

type DeadlineRow = {
  task: Task
  project: Project
  group: TaskGroup
  deadline: string
}

type UpcomingDeadlinesProps = {
  projects: Project[]
}

function collectDeadlineRows(projects: Project[]): DeadlineRow[] {
  const rows: DeadlineRow[] = []
  for (const project of projects) {
    for (const group of project.groups) {
      for (const task of group.tasks) {
        if (task.deadline && task.deadline.trim() !== "") {
          rows.push({ task, project, group, deadline: task.deadline })
        }
      }
    }
  }
  rows.sort((a, b) => a.deadline.localeCompare(b.deadline))
  return rows.slice(0, 8)
}

function formatDeadline(iso: string): string {
  const d = parseISO(iso)
  return isValid(d) ? format(d, "dd.MM.yyyy") : iso
}

export function UpcomingDeadlines({ projects }: UpcomingDeadlinesProps) {
  const rows = collectDeadlineRows(projects)

  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="min-w-0 break-words text-lg font-semibold text-slate-950">
        Ближайшие дедлайны
      </h2>
      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">Дедлайнов пока нет</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {rows.map(({ task, project, group }) => (
            <li
              key={task.id}
              className="flex min-w-0 flex-col gap-2 py-3.5 first:pt-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium text-slate-950">{task.title}</p>
                <p className="mt-0.5 flex flex-wrap gap-x-1 text-pretty text-xs text-slate-600">
                  <span className="min-w-0 break-words">{project.title}</span>
                  <span className="text-slate-400" aria-hidden>
                    ·
                  </span>
                  <span className="min-w-0 break-words">{group.title}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-start gap-0.5 sm:items-end">
                <span className="text-sm font-medium text-slate-700">
                  {task.deadline ? formatDeadline(task.deadline) : ""}
                </span>
                <span
                  className={
                    task.completed
                      ? "text-xs text-slate-400"
                      : "text-xs font-medium text-blue-600"
                  }
                >
                  {task.completed ? "Выполнено" : "В ожидании"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
