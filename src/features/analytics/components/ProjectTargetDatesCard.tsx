import { Link } from "react-router-dom"
import { formatDateOnly } from "@/shared/lib/dateFormat"
import { SELECTED_PROJECT_STORAGE_KEY } from "@/shared/lib/storageKeys"
import type { Project } from "@/store/appState.types"
import { getProjectProgress } from "@/store/selectors"

const MS_PER_DAY = 24 * 60 * 60 * 1000

function getDateOnlyDiffInDays(targetDate: string, now = new Date()): number {
  const [yearRaw, monthRaw, dayRaw] = targetDate.split("-")
  const year = Number(yearRaw)
  const month = Number(monthRaw)
  const day = Number(dayRaw)

  if (!year || !month || !day) {
    return 0
  }

  const targetUtc = Date.UTC(year, month - 1, day)
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())

  return Math.ceil((targetUtc - todayUtc) / MS_PER_DAY)
}

function formatDaysLeftLabel(daysLeft: number): string {
  if (daysLeft > 0) {
    return `${daysLeft} дн. осталось`
  }

  if (daysLeft === 0) {
    return "Сегодня"
  }

  return `${Math.abs(daysLeft)} дн. просрочено`
}

type ProjectTargetDatesCardProps = {
  projects: Project[]
}

type ProjectTargetRow = {
  project: Project & { targetDate: string }
  progress: number
  daysLeft: number
}

function collectProjectTargets(projects: Project[]): ProjectTargetRow[] {
  const rows: ProjectTargetRow[] = []
  for (const project of projects) {
    if (!project.targetDate) continue
    rows.push({
      project: { ...project, targetDate: project.targetDate },
      progress: getProjectProgress(project),
      daysLeft: getDateOnlyDiffInDays(project.targetDate),
    })
  }
  rows.sort((a, b) => a.project.targetDate.localeCompare(b.project.targetDate))
  return rows.slice(0, 5)
}

function handleOpenProject(projectId: string) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return
    window.localStorage.setItem(
      SELECTED_PROJECT_STORAGE_KEY,
      JSON.stringify(projectId),
    )
  } catch {
    // ignore quota / private mode
  }
}

export function ProjectTargetDatesCard({ projects }: ProjectTargetDatesCardProps) {
  const targets = collectProjectTargets(projects)

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">
        Ближайшие проектные цели
      </h2>

      {targets.length === 0 ? (
        <div className="mt-6 space-y-1">
          <p className="text-sm text-slate-600">Проектных целей пока нет</p>
          <p className="text-xs text-slate-500">
            Добавьте целевую дату в редактировании проекта.
          </p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {targets.map(({ project, progress, daysLeft }) => (
            <li key={project.id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/projects"
                  onClick={() => handleOpenProject(project.id)}
                  className="min-w-0 truncate text-sm font-medium text-slate-950 transition-colors hover:text-blue-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  title={project.title}
                >
                  {project.title}
                </Link>
                <span className="shrink-0 text-sm font-semibold text-blue-600">
                  {progress}%
                </span>
              </div>
              <p
                className={
                  daysLeft < 0 ? "mt-1 text-sm text-red-600" : "mt-1 text-sm text-slate-500"
                }
              >
                {formatDateOnly(project.targetDate)} · {formatDaysLeftLabel(daysLeft)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
