import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

type OverallProgressCardProps = {
  progress: number
  totalTasks: number
  completedTasks: number
}

export function OverallProgressCard({
  progress,
  totalTasks,
  completedTasks,
}: OverallProgressCardProps) {
  const hasTasks = totalTasks > 0
  const displayPercent = hasTasks ? progress : 0

  return (
    <Card
      className={cn(
        "h-[116px] min-w-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white py-0 text-slate-950 shadow-sm ring-0",
      )}
    >
      <CardContent className="flex h-full min-h-0 flex-col justify-between p-4">
        <div className="flex shrink-0 items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="min-w-0 text-sm">
              <Link
                to="/analytics"
                title="Общий прогресс"
                className="block truncate font-semibold text-slate-950 transition-colors hover:text-blue-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Общий прогресс
              </Link>
            </h3>
          </div>
          <span className="shrink-0 text-xl font-semibold tabular-nums text-blue-600">
            {displayPercent}%
          </span>
        </div>

        <Progress
          value={displayPercent}
          className="h-2 shrink-0 bg-slate-200 [&>[data-slot=progress-indicator]]:bg-blue-600"
        />

        <p className="min-w-0 shrink-0 truncate text-xs text-slate-600">
          {hasTasks
            ? `Выполнено ${completedTasks} из ${totalTasks} задач`
            : "Пока нет задач для расчёта прогресса"}
        </p>
      </CardContent>
    </Card>
  )
}
