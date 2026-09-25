import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import { getProjectPhaseTitle } from "@/shared/lib/projectPhases"
import type { Project } from "@/store/appState.types"
import { getProjectProgress, getProjectTaskStats } from "@/store/selectors"

const NO_GOAL = "Без цели" as const

type ProjectSummaryCardProps = {
  project: Project
  goalContextLabel?: string
  onOpenProject?: (projectId: string) => void
}

export function ProjectSummaryCard({
  project,
  goalContextLabel,
  onOpenProject,
}: ProjectSummaryCardProps) {
  const progress = getProjectProgress(project)
  const stats = getProjectTaskStats(project)
  const groupCount = project.groups.length
  const barValue = stats.total > 0 ? progress : 0

  return (
    <Card
      className={cn(
        "group min-h-[116px] min-w-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white py-0 text-slate-950 shadow-sm ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
        "md:min-h-[154px] md:rounded-[24px] md:border-slate-200/80 md:shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:transition-all md:duration-200 md:hover:-translate-y-0.5 md:hover:border-slate-300 md:hover:shadow-[0_12px_32px_rgba(15,23,42,0.07)] dark:md:hover:border-slate-700",
      )}
    >
      <CardContent className="flex min-h-[116px] flex-1 flex-col justify-between gap-2 p-4 md:min-h-[154px] md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="hidden size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-blue-500/10 dark:group-hover:text-blue-300 md:flex">
              <CharacterStatIcon
                statType={project.statType}
                className="size-5"
              />
            </div>

            <div className="min-w-0">
              <h3 className="min-w-0 text-sm leading-snug md:text-[15px]">
                <Link
                  to="/projects"
                  onClick={() => onOpenProject?.(project.id)}
                  title={project.title}
                  className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-950 transition-colors hover:text-blue-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-100"
                >
                  <span className="truncate">{project.title}</span>
                  <ArrowUpRight className="hidden size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 md:block" aria-hidden />
                </Link>
              </h3>

              <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                {goalContextLabel ? (
                  goalContextLabel === NO_GOAL ? (
                    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                      {NO_GOAL}
                    </span>
                  ) : (
                    <span className="max-w-[180px] truncate" title={goalContextLabel}>
                      {goalContextLabel}
                    </span>
                  )
                ) : null}
                {goalContextLabel ? <span className="text-slate-300 dark:text-slate-700">•</span> : null}
                <span>{getProjectPhaseTitle(project.phase)}</span>
              </div>
            </div>
          </div>

          <span className="shrink-0 text-xl font-semibold tabular-nums tracking-tight text-blue-600 md:text-2xl">
            {progress}%
          </span>
        </div>

        {project.description ? (
          <p className="hidden min-w-0 truncate text-xs leading-5 text-slate-500 dark:text-slate-400 md:block" title={project.description}>
            {project.description}
          </p>
        ) : null}

        <div className="space-y-2">
          <Progress
            value={barValue}
            className="h-2 w-full min-w-0 shrink-0 bg-slate-200 dark:bg-slate-800 [&>[data-slot=progress-indicator]]:bg-blue-600"
          />
          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>{stats.completed} из {stats.total} задач</span>
            <span className="hidden shrink-0 md:inline">{groupCount} групп</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
