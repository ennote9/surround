import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import {
  CHARACTER_STATS,
  formatLinkedProjectsCount,
  getCharacterStatLevel,
  getCharacterStatProgress,
} from "@/features/dashboard/characterStats"
import type { CharacterStatType, Project } from "@/store/appState.types"

type MetricsGridProps = {
  projects: Project[]
  visibleStatIds?: CharacterStatType[]
}

function compactProjectsText(linkedProjects: number): string {
  if (linkedProjects === 0) return "0 проектов"
  return formatLinkedProjectsCount(linkedProjects)
}

export function MetricsGrid({ projects, visibleStatIds }: MetricsGridProps) {
  const statsToRender =
    visibleStatIds === undefined
      ? CHARACTER_STATS
      : CHARACTER_STATS.filter((s) => visibleStatIds.includes(s.id))

  const showEmptyHidden =
    visibleStatIds !== undefined && visibleStatIds.length === 0

  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold tracking-tight text-slate-950">
        Статы персонажа
      </h2>
      {showEmptyHidden ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-950">Статы скрыты</p>
          <p className="mt-1 text-xs text-slate-600">
            Включите нужные статы в настройках Главной.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {statsToRender.map((stat) => {
            const { total, completed, progress, linkedProjects } =
              getCharacterStatProgress(projects, stat.id)
            const level = getCharacterStatLevel(progress)

            const tasksText =
              total > 0 ? `${completed}/${total} задач` : "Нет задач"
            const projectsText = compactProjectsText(linkedProjects)

            return (
              <Card
                key={stat.id}
                className={cn(
                  "h-[116px] min-w-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white py-0 text-slate-950 shadow-sm ring-0",
                )}
              >
                <CardContent className="flex h-full min-h-0 flex-col justify-between p-4">
                  <div className="flex shrink-0 items-start justify-between gap-2">
                    <h3 className="min-w-0 truncate text-sm font-semibold text-slate-950">
                      {stat.title}
                    </h3>

                    <span
                      className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                      title={stat.shortTitle}
                    >
                      {stat.shortTitle}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-2">
                    <span className="text-base font-semibold tabular-nums text-slate-950">
                      Lv. {level}
                    </span>
                    <span className="text-base font-semibold tabular-nums text-blue-600">
                      {progress}%
                    </span>
                  </div>

                  <Progress
                    value={progress}
                    className="h-2 shrink-0 bg-slate-200 [&>[data-slot=progress-indicator]]:bg-blue-600"
                  />

                  <p className="min-w-0 shrink-0 truncate text-xs text-slate-600">
                    {tasksText} · {projectsText}
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </section>
  )
}
