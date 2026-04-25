import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import { formatDateOnly } from "@/shared/lib/dateFormat"
import {
  getProjectPhaseBadgeClassName,
  getProjectPhaseTitle,
} from "@/shared/lib/projectPhases"
import type { Project } from "@/store/appState.types"
import { getProjectProgress, getProjectTaskStats } from "@/store/selectors"

type ProjectListProps = {
  projects: Project[]
  selectedProjectId?: string
  onSelectProject: (projectId: string) => void
  onAddProject: () => void
}

export function ProjectList({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddProject,
}: ProjectListProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <h2 className="text-lg font-semibold text-slate-950">Проекты</h2>
        <Button
          type="button"
          size="sm"
          className="bg-blue-600 text-white hover:bg-blue-700"
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
            className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
            onClick={onAddProject}
          >
            Создать проект
          </Button>
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {projects.map((project) => {
            const progress = getProjectProgress(project)
            const stats = getProjectTaskStats(project)
            const groupCount = project.groups.length
            const isActive = project.id === selectedProjectId

            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => onSelectProject(project.id)}
                  className={cn(
                    "w-full rounded-xl border px-3 py-3 text-left transition-colors",
                    isActive
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : "border-transparent hover:bg-slate-50",
                  )}
                >
                  <div
                    className={cn(
                      "flex min-w-0 items-center gap-2 font-medium",
                      isActive ? "text-blue-900" : "text-slate-950",
                    )}
                  >
                    <CharacterStatIcon
                      statType={project.statType}
                      className={cn(
                        "h-4 w-4 shrink-0",
                        isActive ? "text-blue-700" : "text-slate-500",
                      )}
                    />
                    <span className="truncate">{project.title}</span>
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
                        "mt-1 truncate text-xs",
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
