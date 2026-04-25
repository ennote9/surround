import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import { getProjectPhaseTitle } from "@/shared/lib/projectPhases"
import type { Project } from "@/store/appState.types"
import { getProjectProgress, getProjectTaskStats } from "@/store/selectors"

type ProjectSummaryCardProps = {
  project: Project
  onOpenProject?: (projectId: string) => void
}

export function ProjectSummaryCard({
  project,
  onOpenProject,
}: ProjectSummaryCardProps) {
  const progress = getProjectProgress(project)
  const stats = getProjectTaskStats(project)
  const groupCount = project.groups.length
  const barValue = stats.total > 0 ? progress : 0

  return (
    <Card
      className={cn(
        "h-[116px] min-w-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white py-0 text-slate-950 shadow-sm ring-0",
      )}
    >
      <CardContent className="flex h-full min-h-0 flex-col justify-between p-4">
        <div className="flex shrink-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="min-w-0 text-sm">
              <Link
                to="/projects"
                onClick={() => onOpenProject?.(project.id)}
                title={project.title}
                className="flex min-w-0 items-center gap-1.5 font-semibold text-slate-950 transition-colors hover:text-blue-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
              >
                <CharacterStatIcon
                  statType={project.statType}
                  className="h-4 w-4 shrink-0 text-slate-500"
                />
                <span className="truncate">{project.title}</span>
              </Link>
            </h3>
            <p className="truncate text-xs leading-tight text-slate-500">
              Групп: {groupCount} · {getProjectPhaseTitle(project.phase)}
            </p>
          </div>

          <span className="shrink-0 text-xl font-semibold tabular-nums text-blue-600">
            {progress}%
          </span>
        </div>

        <Progress
          value={barValue}
          className="h-2 shrink-0 bg-slate-200 [&>[data-slot=progress-indicator]]:bg-blue-600"
        />

        <p className="shrink-0 truncate text-xs text-slate-600">
          {stats.completed} из {stats.total} задач
        </p>
      </CardContent>
    </Card>
  )
}
