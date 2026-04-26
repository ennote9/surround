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
  /** «Без цели» или название цели; опционально, чтобы не раздувать бейджи без места. */
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
        "min-h-[116px] min-w-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white py-0 text-slate-950 shadow-sm ring-0 md:h-[116px]",
      )}
    >
      <CardContent className="flex min-h-[116px] flex-1 flex-col justify-between gap-2 p-4 md:min-h-0 md:h-full">
        <div className="flex shrink-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="min-w-0 text-sm leading-snug">
              <Link
                to="/projects"
                onClick={() => onOpenProject?.(project.id)}
                title={project.title}
                className="flex min-h-11 min-w-0 items-center gap-1.5 rounded-md py-0.5 font-semibold text-slate-950 transition-colors hover:text-blue-600 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 md:min-h-0 md:py-0"
              >
                <CharacterStatIcon
                  statType={project.statType}
                  className="h-4 w-4 shrink-0 text-slate-500"
                />
                <span className="break-words md:truncate">{project.title}</span>
              </Link>
            </h3>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-pretty text-xs leading-tight text-slate-500">
              {goalContextLabel ? (
                <>
                  {goalContextLabel === NO_GOAL ? (
                    <span className="shrink-0 rounded border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-900">
                      {NO_GOAL}
                    </span>
                  ) : (
                    <span className="min-w-0 max-w-full truncate" title={goalContextLabel}>
                      {goalContextLabel}
                    </span>
                  )}
                  <span className="text-slate-300" aria-hidden>
                    ·
                  </span>
                </>
              ) : null}
              <span className="shrink-0">Групп: {groupCount}</span>
              <span className="text-slate-300" aria-hidden>
                ·
              </span>
              <span className="min-w-0 break-words">
                {getProjectPhaseTitle(project.phase)}
              </span>
            </p>
          </div>

          <span className="shrink-0 text-lg font-semibold tabular-nums text-blue-600 md:text-xl">
            {progress}%
          </span>
        </div>

        <Progress
          value={barValue}
          className="h-2 w-full min-w-0 shrink-0 bg-slate-200 [&>[data-slot=progress-indicator]]:bg-blue-600"
        />

        <p className="shrink-0 text-pretty text-xs text-slate-600 md:truncate">
          {stats.completed} из {stats.total} задач
        </p>
      </CardContent>
    </Card>
  )
}
