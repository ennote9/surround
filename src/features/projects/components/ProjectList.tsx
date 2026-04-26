import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import { formatDateOnly } from "@/shared/lib/dateFormat"
import {
  getProjectPhaseBadgeClassName,
  getProjectPhaseTitle,
} from "@/shared/lib/projectPhases"
import { isProjectUnassigned } from "@/shared/lib/selectedGoal"
import type { Goal, Project } from "@/store/appState.types"
import { getProjectProgress, getProjectTaskStats } from "@/store/selectors"

type ProjectListProps = {
  projects: Project[]
  goals: Goal[]
  selectedProjectId?: string
  onSelectProject: (projectId: string) => void
  onAddProject: () => void
}

export function ProjectList({
  projects,
  goals,
  selectedProjectId,
  onSelectProject,
  onAddProject,
}: ProjectListProps) {
  return (
    <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-3 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
        <h2 className="min-w-0 break-words text-lg font-semibold text-slate-950">
          Проекты
        </h2>
        <Button
          type="button"
          size="sm"
          className="min-h-10 w-full shrink-0 bg-blue-600 text-white hover:bg-blue-700 sm:w-auto sm:min-h-9"
          onClick={onAddProject}
        >
          <Plus className="mr-1 size-4" />
          Добавить
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-600">Проектов пока нет</p>
          <Button
            type="button"
            className="mt-4 min-h-10 w-full max-w-xs bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            onClick={onAddProject}
          >
            Создать проект
          </Button>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-1.5">
          {projects.map((project) => {
            const progress = getProjectProgress(project)
            const stats = getProjectTaskStats(project)
            const groupCount = project.groups.length
            const isActive = project.id === selectedProjectId
            const showUnassignedBadge = isProjectUnassigned(project, goals)

            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => onSelectProject(project.id)}
                  className={cn(
                    "w-full min-w-0 rounded-xl border px-3 py-3 text-left transition-colors",
                    "min-h-11 touch-manipulation",
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-transparent hover:bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex min-w-0 items-start gap-2 font-medium sm:items-center",
                      isActive ? "text-blue-900" : "text-slate-950",
                    )}
                  >
                    <CharacterStatIcon
                      statType={project.statType}
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 sm:mt-0",
                        isActive ? "text-blue-700" : "text-slate-500",
                      )}
                    />
                    <span className="min-w-0 flex-1 break-words text-left sm:truncate">
                      {project.title}
                    </span>
                    {showUnassignedBadge ? (
                      <span className="shrink-0 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-900 sm:text-[11px]">
                        Без цели
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={cn(
                      "mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs",
                      isActive ? "text-blue-700" : "text-slate-600",
                    )}
                  >
                    <span className={getProjectPhaseBadgeClassName(project.phase)}>
                      {getProjectPhaseTitle(project.phase)}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span>
                      {progress}% · Групп: {groupCount} · Задач: {stats.total}
                    </span>
                  </p>
                  {project.targetDate ? (
                    <p
                      className={cn(
                        "mt-1 text-pretty text-xs break-words sm:truncate",
                        isActive ? "text-blue-700" : "text-slate-500",
                      )}
                    >
                      Цель: {formatDateOnly(project.targetDate)}
                    </p>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
