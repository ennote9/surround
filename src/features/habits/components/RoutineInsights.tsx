import { useMemo } from "react"
import { AlertTriangle, BarChart3, MessageSquareText, Sparkles } from "lucide-react"
import {
  getHabitEntryStatus,
  getHabitReasonLabel,
  getHabitRecoverySuggestion,
} from "@/shared/lib/habitEntries"
import type { Habit, HabitEntryReason } from "@/store/appState.types"
import { isHabitActiveOnDate, isHabitScheduledOnDate } from "@/store/selectors"

type RoutineInsightsProps = {
  habits: Habit[]
  todayISO: string
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function toISO(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function RoutineInsights({ habits, todayISO }: RoutineInsightsProps) {
  const insights = useMemo(() => {
    const reasonCounts = new Map<HabitEntryReason, number>()
    let completed = 0
    let partial = 0
    let skipped = 0
    let rescheduled = 0
    let comments = 0

    for (const habit of habits) {
      for (const entry of Object.values(habit.dailyEntries ?? {})) {
        const status = getHabitEntryStatus(entry)
        if (status === "completed") completed += 1
        if (status === "partial") partial += 1
        if (status === "skipped") skipped += 1
        if (status === "rescheduled") rescheduled += 1
        if (entry.note?.trim()) comments += 1
        if (entry.reason) {
          reasonCounts.set(entry.reason, (reasonCounts.get(entry.reason) ?? 0) + 1)
        }
      }
    }

    const topReason = [...reasonCounts.entries()].sort((a, b) => b[1] - a[1])[0]

    const weekdayStats = Array.from({ length: 7 }, () => ({
      planned: 0,
      completed: 0,
    }))
    const today = new Date(todayISO + "T12:00:00")
    const start = addDays(today, -27)

    for (let cursor = start; cursor <= today; cursor = addDays(cursor, 1)) {
      const date = toISO(cursor)
      const weekday = (cursor.getDay() + 6) % 7

      for (const habit of habits) {
        const mode = habit.schedule?.mode ?? "times-per-week"
        if (mode === "times-per-week") continue
        if (!isHabitActiveOnDate(habit, date) || !isHabitScheduledOnDate(habit, date)) {
          continue
        }
        weekdayStats[weekday].planned += 1
        if (habit.dailyStatus[date] === true) {
          weekdayStats[weekday].completed += 1
        }
      }
    }

    const weekdayLabels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    const weakest = weekdayStats
      .map((item, index) => ({
        ...item,
        index,
        rate: item.planned === 0 ? null : Math.round((item.completed / item.planned) * 100),
      }))
      .filter((item) => item.rate !== null)
      .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0))[0]

    return {
      completed,
      partial,
      skipped,
      rescheduled,
      comments,
      topReason,
      weakestDay: weakest ? weekdayLabels[weakest.index] : undefined,
      weakestRate: weakest?.rate ?? undefined,
    }
  }, [habits, todayISO])

  const totalOutcomes =
    insights.completed + insights.partial + insights.skipped + insights.rescheduled

  if (totalOutcomes === 0) {
    return (
      <section className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <BarChart3 className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            Аналитика рутины
          </h2>
        </div>
        <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
          После нескольких отметок здесь появятся причины пропусков, слабые дни и подсказки по корректировке режима.
        </p>
      </section>
    )
  }

  const reason = insights.topReason?.[0]
  const suggestion = getHabitRecoverySuggestion(reason)

  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          Понимание
        </p>
        <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Что влияет на ритм
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] text-slate-400">Частично</p>
          <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
            {insights.partial}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] text-slate-400">Пропуски</p>
          <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
            {insights.skipped}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] text-slate-400">Комментарии</p>
          <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-slate-100">
            {insights.comments}
          </p>
        </div>
      </div>

      {reason ? (
        <div className="rounded-[22px] border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
            <div>
              <p className="text-xs font-semibold text-amber-900 dark:text-amber-200">
                Частая причина: {getHabitReasonLabel(reason)}
              </p>
              <p className="mt-1 text-xs leading-5 text-amber-800/80 dark:text-amber-200/70">
                {insights.topReason?.[1]} отметок с этой причиной.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {insights.weakestDay ? (
        <div className="rounded-[22px] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-start gap-3">
            <MessageSquareText className="mt-0.5 size-4 shrink-0 text-slate-500" aria-hidden />
            <div>
              <p className="text-xs font-semibold text-slate-950 dark:text-slate-100">
                Слабый день: {insights.weakestDay}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                За последние 4 недели выполнено около {insights.weakestRate}% фиксированного плана этого дня.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {suggestion ? (
        <div className="rounded-[22px] border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="flex items-start gap-3">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-300" aria-hidden />
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                Что можно скорректировать
              </p>
              <p className="mt-1 text-xs leading-5 text-blue-800/80 dark:text-blue-200/70">
                {suggestion}
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
