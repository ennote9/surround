import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import { Progress } from "@/components/ui/progress"
import {
  CHARACTER_STATS,
  formatLinkedProjectsCount,
  getCharacterStatLevel,
  getCharacterStatProgress,
} from "@/features/dashboard/characterStats"
import type { CharacterStatType, Habit, Project } from "@/store/appState.types"

type MetricsGridProps = {
  projects: Project[]
  habits?: Habit[]
  visibleStatIds?: CharacterStatType[]
}

function compactProjectsText(linkedProjects: number): string {
  if (linkedProjects === 0) return "0 проектов"
  return formatLinkedProjectsCount(linkedProjects)
}

export function MetricsGrid({ projects, habits = [], visibleStatIds }: MetricsGridProps) {
  const statsToRender =
    visibleStatIds === undefined
      ? CHARACTER_STATS
      : CHARACTER_STATS.filter((s) => visibleStatIds.includes(s.id))

  const showEmptyHidden =
    visibleStatIds !== undefined && visibleStatIds.length === 0

  return (
    <section className="min-w-0 overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.025)] dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
            Развитие
          </p>
          <h2 className="mt-1 text-base font-semibold tracking-tight text-slate-950 dark:text-slate-100">
            Статы персонажа
          </h2>
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {statsToRender.length}
        </span>
      </div>

      {showEmptyHidden ? (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-medium text-slate-950 dark:text-slate-100">
            Статы скрыты
          </p>
          <p className="mt-1 text-pretty text-xs text-slate-500 dark:text-slate-400">
            Включите нужные статы в настройках Главной.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-2">
          {statsToRender.map((stat) => {
            const { total, completed, progress, linkedProjects } =
              getCharacterStatProgress(projects, stat.id, habits)
            const level = getCharacterStatLevel(progress)

            const tasksText =
              total > 0 ? `${completed}/${total} задач` : "Нет задач"
            const projectsText = compactProjectsText(linkedProjects)

            return (
              <div
                key={stat.id}
                className="min-w-0 rounded-2xl border border-transparent bg-slate-50/80 p-3.5 transition-colors hover:border-slate-200 hover:bg-white dark:bg-slate-950/55 dark:hover:border-slate-700 dark:hover:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm ring-1 ring-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                      <CharacterStatIcon statType={stat.id} className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-[13px] font-semibold text-slate-950 dark:text-slate-100">
                        {stat.title}
                      </h3>
                      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
                        {stat.shortTitle}
                      </p>
                    </div>
                  </div>

                  <span className="shrink-0 text-sm font-semibold tabular-nums text-blue-600">
                    {progress}%
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Lv. {level}
                  </span>
                  <span className="truncate text-[10px] text-slate-400 dark:text-slate-500">
                    {tasksText}
                  </span>
                </div>

                <Progress
                  value={progress}
                  className="mt-2 h-1.5 w-full min-w-0 bg-slate-200 dark:bg-slate-800 [&>[data-slot=progress-indicator]]:bg-blue-600"
                />

                <p className="mt-2 truncate text-[10px] text-slate-400 dark:text-slate-500">
                  {projectsText}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
