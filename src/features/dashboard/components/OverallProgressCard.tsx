import { ArrowUpRight, TrendingUp } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type OverallProgressCardProps = {
  progress: number
  totalTasks: number
  completedTasks: number
  title?: string
}

export function OverallProgressCard({
  progress,
  totalTasks,
  completedTasks,
  title,
}: OverallProgressCardProps) {
  const hasTasks = totalTasks > 0
  const displayPercent = hasTasks ? progress : 0

  return (
    <Card
      className={cn(
        "min-h-[116px] min-w-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white py-0 text-slate-950 shadow-sm ring-0 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
        "md:h-[158px] md:rounded-[24px] md:border-slate-200/80 md:shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.03)]",
      )}
    >
      <CardContent className="flex min-h-[116px] flex-1 flex-col justify-between gap-2 p-4 md:h-full md:min-h-0 md:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <div className="hidden size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300 md:flex">
              <TrendingUp className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 md:block">
                Прогресс
              </p>
              <h3 className="min-w-0 text-sm leading-snug md:mt-1 md:text-[15px]">
                <Link
                  to="/analytics"
                  title={title ?? "Общий прогресс"}
                  className="group inline-flex max-w-full items-center gap-1.5 break-words font-semibold text-slate-950 transition-colors hover:text-blue-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-100 md:truncate"
                >
                  <span className="truncate">{title ?? "Общий прогресс"}</span>
                  <ArrowUpRight className="hidden size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 md:block" aria-hidden />
                </Link>
              </h3>
            </div>
          </div>

          <span className="shrink-0 text-xl font-semibold tabular-nums tracking-tight text-blue-600 md:text-3xl">
            {displayPercent}%
          </span>
        </div>

        <div className="space-y-2">
          <Progress
            value={displayPercent}
            className="h-2 w-full min-w-0 shrink-0 bg-slate-200 dark:bg-slate-800 [&>[data-slot=progress-indicator]]:bg-blue-600 md:h-2.5"
          />

          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <p className="min-w-0 truncate">
              {hasTasks
                ? `Выполнено ${completedTasks} из ${totalTasks} задач`
                : "Пока нет задач для расчёта прогресса"}
            </p>
            {hasTasks ? (
              <span className="hidden shrink-0 font-medium text-slate-400 dark:text-slate-500 md:inline">
                {totalTasks - completedTasks} осталось
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
