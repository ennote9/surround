import { useMemo } from "react"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import {
  CalendarDays,
  Flame,
  MessageSquareText,
  TrendingUp,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  getHabitEntryStatus,
  getHabitReasonLabel,
  HABIT_STATUS_LABELS,
} from "@/shared/lib/habitEntries"
import type { Habit, HabitEntryReason } from "@/store/appState.types"
import {
  getHabitTotalCompliance,
  isHabitActiveOnDate,
  isHabitScheduledOnDate,
} from "@/store/selectors"

type HabitDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit | null
}

function toISO(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function addDays(date: Date, days: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function getStreakStats(habit: Habit) {
  const today = new Date()
  const start = new Date(habit.createdAt)
  const startDate = Number.isNaN(start.getTime())
    ? addDays(today, -365)
    : new Date(start.getFullYear(), start.getMonth(), start.getDate())

  let current = 0
  let cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  while (cursor >= startDate) {
    const date = toISO(cursor)
    if (isHabitActiveOnDate(habit, date) && isHabitScheduledOnDate(habit, date)) {
      if (habit.dailyStatus[date] === true) {
        current += 1
      } else if (date < toISO(today)) {
        break
      }
    }
    cursor = addDays(cursor, -1)
  }

  let best = 0
  let running = 0
  for (
    let day = new Date(startDate);
    day <= today;
    day = addDays(day, 1)
  ) {
    const date = toISO(day)
    if (!isHabitActiveOnDate(habit, date) || !isHabitScheduledOnDate(habit, date)) {
      continue
    }
    if (habit.dailyStatus[date] === true) {
      running += 1
      best = Math.max(best, running)
    } else {
      running = 0
    }
  }

  return { current, best }
}

export function HabitDetailDialog({
  open,
  onOpenChange,
  habit,
}: HabitDetailDialogProps) {
  const data = useMemo(() => {
    if (!habit) return null

    const today = new Date()
    const days = Array.from({ length: 28 }, (_, index) =>
      toISO(addDays(today, index - 27)),
    )
    const entries = Object.entries(habit.dailyEntries ?? {})
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)

    const reasonCounts = new Map<HabitEntryReason, number>()
    for (const [, entry] of Object.entries(habit.dailyEntries ?? {})) {
      if (entry.reason) {
        reasonCounts.set(entry.reason, (reasonCounts.get(entry.reason) ?? 0) + 1)
      }
    }

    return {
      days,
      entries,
      reasons: [...reasonCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3),
      streaks: getStreakStats(habit),
      compliance: getHabitTotalCompliance(habit),
    }
  }, [habit])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[92vh] max-w-[calc(100vw-1rem)] flex-col overflow-hidden border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:max-w-xl"
      >
        {habit && data ? (
          <>
            <DialogHeader className="text-left">
              <DialogTitle className="text-slate-950 dark:text-slate-100">
                {habit.name}
              </DialogTitle>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                История и закономерности
              </p>
            </DialogHeader>

            <div className="min-h-0 space-y-5 overflow-y-auto pr-0.5">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/55">
                  <TrendingUp className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                    {data.compliance}%
                  </p>
                  <p className="text-[10px] text-slate-400">общий ритм</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/55">
                  <Flame className="size-4 text-orange-500" aria-hidden />
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                    {data.streaks.current}
                  </p>
                  <p className="text-[10px] text-slate-400">текущая серия</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/55">
                  <Flame className="size-4 text-slate-400" aria-hidden />
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-slate-100">
                    {data.streaks.best}
                  </p>
                  <p className="text-[10px] text-slate-400">лучшая серия</p>
                </div>
              </div>

              <section>
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-slate-500" aria-hidden />
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                    Последние 28 дней
                  </h3>
                </div>
                <div className="mt-3 grid grid-cols-7 gap-1.5">
                  {data.days.map((date) => {
                    const status = getHabitEntryStatus(habit.dailyEntries?.[date])
                    const scheduled =
                      isHabitActiveOnDate(habit, date) &&
                      isHabitScheduledOnDate(habit, date)
                    return (
                      <div
                        key={date}
                        title={`${date}: ${scheduled ? HABIT_STATUS_LABELS[status] : "не запланировано"}`}
                        className={
                          !scheduled
                            ? "aspect-square rounded-lg bg-slate-50 dark:bg-slate-950/40"
                            : status === "completed"
                              ? "aspect-square rounded-lg bg-blue-600"
                              : status === "partial"
                                ? "aspect-square rounded-lg bg-amber-300 dark:bg-amber-500/60"
                                : status === "skipped"
                                  ? "aspect-square rounded-lg bg-orange-200 dark:bg-orange-500/30"
                                  : status === "rescheduled"
                                    ? "aspect-square rounded-lg bg-violet-300 dark:bg-violet-500/50"
                                    : "aspect-square rounded-lg bg-slate-200 dark:bg-slate-800"
                        }
                      />
                    )
                  })}
                </div>
              </section>

              {data.reasons.length > 0 ? (
                <section>
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                    Частые причины
                  </h3>
                  <div className="mt-2 space-y-2">
                    {data.reasons.map(([reason, count]) => (
                      <div
                        key={reason}
                        className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/55"
                      >
                        <span className="text-xs text-slate-600 dark:text-slate-300">
                          {getHabitReasonLabel(reason)}
                        </span>
                        <span className="text-xs font-semibold text-slate-950 dark:text-slate-100">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              <section>
                <div className="flex items-center gap-2">
                  <MessageSquareText className="size-4 text-slate-500" aria-hidden />
                  <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                    Последние отметки
                  </h3>
                </div>
                {data.entries.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    История пока пуста.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {data.entries.map(([date, entry]) => {
                      const status = getHabitEntryStatus(entry)
                      return (
                        <div
                          key={date}
                          className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-medium text-slate-950 dark:text-slate-100">
                              {format(parseISO(date), "d MMMM", { locale: ru })}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">
                              {HABIT_STATUS_LABELS[status]}
                            </span>
                          </div>
                          {entry.reason ? (
                            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                              Причина: {getHabitReasonLabel(entry.reason)}
                            </p>
                          ) : null}
                          {entry.helped ? (
                            <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
                              Помогло: {entry.helped}
                            </p>
                          ) : null}
                          {entry.note ? (
                            <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                              {entry.note}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
