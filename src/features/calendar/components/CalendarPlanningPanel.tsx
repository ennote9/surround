import {
  AlertTriangle,
  CalendarRange,
  CheckCircle2,
  LockKeyhole,
  TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDateOnly } from "@/shared/lib/dateFormat"
import type {
  CalendarPlanningAnalysis,
  CalendarPlanningIssue,
} from "@/shared/lib/calendarPlanning"
import type { Project } from "@/store/appState.types"

type CalendarPlanningPanelProps = {
  analysis: CalendarPlanningAnalysis
  projects: Project[]
  periodLabel: string
  onOpenIssue: (issue: CalendarPlanningIssue) => void
}

function issueLabel(issue: CalendarPlanningIssue): string {
  switch (issue.kind) {
    case "blocked_deadline":
      return "Заблокированный срок"
    case "blocker_without_deadline":
      return "У блокера нет срока"
    case "dependency_deadline_order":
      return "Конфликт цепочки"
    case "control_after_deadline":
      return "Контроль после дедлайна"
    case "deferred_past_deadline":
      return "Отложено дальше срока"
  }
}

export function CalendarPlanningPanel({
  analysis,
  projects,
  periodLabel,
  onOpenIssue,
}: CalendarPlanningPanelProps) {
  const warningCount = analysis.issues.filter(
    (issue) => issue.severity === "warning",
  ).length

  const blockedTaskIds = new Set(
    analysis.issues
      .filter(
        (issue) =>
          issue.kind === "blocked_deadline" ||
          issue.kind === "blocker_without_deadline" ||
          issue.kind === "dependency_deadline_order",
      )
      .map((issue) => issue.taskId),
  )

  const peakLoads = [...analysis.peakDates]
    .map((date) => analysis.dayLoads.get(date))
    .filter((load) => load !== undefined)
    .slice(0, 3)

  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <CalendarRange className="size-4 text-slate-500" aria-hidden />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Проверка плана
            </h2>
          </div>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            {periodLabel}. Система только показывает несостыковки и плотность —
            даты автоматически не меняются. Проверка учитывает весь выбранный
            проект или контекст, даже если сетка ниже отфильтрована по типу или
            статусу событий.
          </p>
        </div>

        {analysis.issues.length === 0 ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5" aria-hidden />
            Явных конфликтов нет
          </span>
        ) : null}
      </div>

      <div className="grid gap-2 border-b border-slate-200 p-3 dark:border-slate-800 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-slate-400">
            <AlertTriangle className="size-3.5" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">
              Несостыковки
            </p>
          </div>
          <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {analysis.issues.length}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            {warningCount} требуют особого внимания
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-slate-400">
            <LockKeyhole className="size-3.5" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">
              Сроки с зависимостями
            </p>
          </div>
          <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {blockedTaskIds.size}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            задач требуют проверки блокеров
          </p>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/60">
          <div className="flex items-center gap-1.5 text-slate-400">
            <TrendingUp className="size-3.5" aria-hidden />
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em]">
              Пиковая плотность
            </p>
          </div>
          <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {analysis.peakOpenEventCount}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">
            открытых событий в самом насыщенном дне
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(240px,0.5fr)]">
        <div className="min-w-0">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Конфликты и предупреждения
          </p>

          {analysis.issues.length === 0 ? (
            <div className="mt-2 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center dark:border-slate-800">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                План выглядит согласованным
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                В выбранном периоде не найдено контроля после дедлайна,
                конфликтующих зависимостей или переноса дальше собственного
                срока.
              </p>
            </div>
          ) : (
            <div className="mt-2 max-h-[310px] space-y-2 overflow-y-auto pr-1">
              {analysis.issues.map((issue) => {
                const project = projects.find(
                  (item) => item.id === issue.projectId,
                )

                return (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => onOpenIssue(issue)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                      issue.severity === "warning"
                        ? "border-amber-200 bg-amber-50/60 hover:bg-amber-50 dark:border-amber-500/20 dark:bg-amber-500/5 dark:hover:bg-amber-500/10"
                        : "border-slate-200 bg-slate-50/70 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/50 dark:hover:bg-slate-800/70",
                    )}
                  >
                    <div className="flex min-w-0 items-start gap-2.5">
                      <AlertTriangle
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          issue.severity === "warning"
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-400",
                        )}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">
                            {issueLabel(issue)}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDateOnly(issue.date)}
                          </span>
                        </div>
                        <p className="mt-0.5 break-words text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {issue.title}
                        </p>
                        <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                          {issue.message}
                        </p>
                        {project ? (
                          <p className="mt-1 truncate text-[10px] text-slate-400">
                            {project.title}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
            Самые насыщенные дни
          </p>

          {peakLoads.length === 0 ? (
            <p className="mt-2 rounded-2xl border border-dashed border-slate-200 px-3 py-5 text-center text-xs text-slate-400 dark:border-slate-800">
              Пока нет дня с двумя и более открытыми событиями.
            </p>
          ) : (
            <div className="mt-2 space-y-2">
              {peakLoads.map((load) => (
                <div
                  key={load.date}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {formatDateOnly(load.date)}
                    </p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {load.openEventCount}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    {load.deadlineCount} дедлайн · {load.controlCount} контроль
                    {load.blockedCount > 0
                      ? ` · ${load.blockedCount} заблокировано`
                      : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-3 px-1 text-[10px] leading-4 text-slate-400">
            «Пиковая плотность» — это максимум открытых событий в одном дне
            выбранного периода, а не оценка вашей личной нормы.
          </p>
        </div>
      </div>
    </section>
  )
}
