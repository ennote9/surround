import { useMemo } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { getCurrentWeekDates } from "@/shared/lib/dates"
import {
  getHabitWeeklyCompleted,
  getHabitWeeklyTarget,
} from "@/store/selectors"
import type { Habit } from "@/store/appState.types"

export type TodayRoutinesCardProps = {
  habits: Habit[]
  todayISO: string
}

export function TodayRoutinesCard({ habits, todayISO }: TodayRoutinesCardProps) {
  const { totalHabits, completedToday, weekCompleted, weekTarget, weekProgress } =
    useMemo(() => {
      const total = habits.length
      const completedToday = habits.filter(
        (habit) => habit.dailyStatus[todayISO] === true,
      ).length
      const weekDates = getCurrentWeekDates()
      const weekTarget = habits.reduce(
        (sum, habit) => sum + getHabitWeeklyTarget(habit, weekDates),
        0,
      )
      const weekCompleted = habits.reduce((sum, habit) => {
        const target = getHabitWeeklyTarget(habit, weekDates)
        return (
          sum +
          Math.min(getHabitWeeklyCompleted(habit, weekDates), target)
        )
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
        "min-h-[116px] min-w-0 gap-0 overflow-hidden rounded-2xl border border-slate-200 bg-white py-0 text-slate-950 shadow-sm ring-0 md:h-[116px]",
      )}
    >
      <CardContent className="flex min-h-[116px] flex-1 flex-col justify-between gap-2 p-4 md:min-h-0 md:h-full">
        <div className="flex shrink-0 items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="min-w-0 text-sm leading-snug">
              <Link
                to="/routine"
                title="Ритм рутины"
                className="block break-words font-semibold text-slate-950 transition-colors hover:text-blue-600 hover:underline focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 md:truncate"
              >
                Ритм рутины
              </Link>
            </h3>
          </div>
          <span className="shrink-0 text-lg font-semibold tabular-nums text-blue-600 md:text-xl">
            {weekProgress}%
          </span>
        </div>

        <Progress
          value={weekProgress}
          className="h-2 w-full min-w-0 shrink-0 bg-slate-200 [&>[data-slot=progress-indicator]]:bg-blue-600"
        />

        <p className="min-w-0 shrink-0 text-pretty text-xs leading-snug text-slate-600 md:truncate">
          {totalHabits === 0
            ? "Привычек пока нет"
            : `Неделя: ${weekCompleted}/${weekTarget} · отметок сегодня: ${completedToday}`}
        </p>
      </CardContent>
    </Card>
  )
}
