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
    <section className="min-w-0 space-y-2">
      <h2 className="min-w-0 break-words text-base font-semibold tracking-tight text-slate-950">
        Статы персонажа
      </h2>
      {showEmptyHidden ? (
        <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
          <p className="break-words text-sm font-medium text-slate-950">Статы скрыты</p>
          <p className="mt-1 text-pretty text-xs text-slate-600">
            Включите нужные статы в настройках Главной.
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
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
                  "min-h-[116px] min-w-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white py-0 text-slate-950 shadow-sm ring-0 md:h-[116px]",
                )}
              >
                <CardContent className="flex min-h-[116px] flex-1 flex-col justify-between gap-2 p-4 md:min-h-0 md:h-full">
                  <div className="flex shrink-0 items-start justify-between gap-2">
                    <h3 className="min-w-0 text-sm font-semibold leading-snug text-slate-950 break-words sm:truncate">
                      {stat.title}
                    </h3>

                    <span
                      className="max-w-[40%] shrink-0 truncate rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700"
                      title={stat.shortTitle}
                    >
                      {stat.shortTitle}
                    </span>
                  </div>

                  <div className="flex shrink-0 items-center justify-between gap-2">
                    <span className="text-sm font-semibold tabular-nums text-slate-950 sm:text-base">
                      Lv. {level}
                    </span>
                    <span className="text-sm font-semibold tabular-nums text-blue-600 sm:text-base">
                      {progress}%
                    </span>
                  </div>

                  <Progress
                    value={progress}
                    className="h-2 w-full min-w-0 shrink-0 bg-slate-200 [&>[data-slot=progress-indicator]]:bg-blue-600"
                  />

                  <p className="min-w-0 shrink-0 text-pretty text-xs leading-snug text-slate-600 sm:truncate">
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
