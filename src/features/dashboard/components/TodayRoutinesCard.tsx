import { useMemo } from "react"
import { ArrowUpRight, CalendarCheck2 } from "lucide-react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getCurrentWeekDates } from "@/shared/lib/dates"
import {
  getHabitWeeklyCompleted,
  getHabitWeeklyTarget,
  isHabitScheduledOnDate,
} from "@/store/selectors"
import type { Habit } from "@/store/appState.types"

export type TodayRoutinesCardProps = {
  habits: Habit[]
  todayISO: string
}

export function TodayRoutinesCard({ habits, todayISO }: TodayRoutinesCardProps) {
  const { totalHabits, completedToday, weekCompleted, weekTarget, weekProgress } =
    useMemo(() => {
      const todayHabits = habits.filter((habit) =>
        isHabitScheduledOnDate(habit, todayISO),
      )
      const total = todayHabits.length
      const completedToday = todayHabits.filter(
        (habit) => habit.dailyStatus[todayISO] === true,
      ).length
      const weekDates = getCurrentWeekDates()
      const weekTarget = habits.reduce(
        (sum, habit) => sum + getHabitWeeklyTarget(habit, weekDates),
        0,
      )
      const weekCompleted = habits.reduce((sum, habit) => {
        const target = getHabitWeeklyTarget(habit, weekDates)
        return sum + Math.min(getHabitWeeklyCompleted(habit, weekDates), target)
      }, 0)
      const weekProgress =
        weekTarget === 0 ? 0 : Math.round((weekCompleted / weekTarget) * 100)

      return {
        totalHabits: total,
        completedToday,
        weekCompleted,
        weekTarget,
        weekProgress,
      }
    }, [habits, todayISO])

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
            <div className="hidden size-10 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300 md:flex">
              <CalendarCheck2 className="size-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500 md:block">
                Привычки
              </p>
              <h3 className="min-w-0 text-sm leading-snug md:mt-1 md:text-[15px]">
                <Link
                  to="/routine"
                  title="Ритм рутины"
                  className="group inline-flex max-w-full items-center gap-1.5 break-words font-semibold text-slate-950 transition-colors hover:text-blue-600 focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-100 md:truncate"
                >
                  <span className="truncate">Ритм рутины</span>
                  <ArrowUpRight className="hidden size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 md:block" aria-hidden />
                </Link>
              </h3>
            </div>
          </div>

          <span className="shrink-0 text-xl font-semibold tabular-nums tracking-tight text-blue-600 md:text-3xl">
            {weekProgress}%
          </span>
        </div>

        <div className="space-y-2">
          <Progress
            value={weekProgress}
            className="h-2 w-full min-w-0 shrink-0 bg-slate-200 dark:bg-slate-800 [&>[data-slot=progress-indicator]]:bg-blue-600 md:h-2.5"
          />

          <div className="flex items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <p className="min-w-0 truncate">
              {totalHabits === 0
                ? "Привычек пока нет"
                : `Неделя: ${weekCompleted}/${weekTarget}`}
            </p>
            {totalHabits > 0 ? (
              <span className="shrink-0 font-medium text-slate-500 dark:text-slate-400">
                Сегодня {completedToday}/{totalHabits}
              </span>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
