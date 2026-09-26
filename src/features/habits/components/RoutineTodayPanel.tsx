import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import {
  Check,
  CheckCircle2,
  Clock3,
  MoreHorizontal,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  getHabitEntryStatus,
  getHabitTimingLabel,
  getHabitTimingOrder,
  HABIT_STATUS_LABELS,
} from "@/shared/lib/habitEntries"
import type { Habit } from "@/store/appState.types"
import {
  getHabitCompletionType,
  isHabitActiveOnDate,
  isHabitScheduledOnDate,
} from "@/store/selectors"

type RoutineTodayPanelProps = {
  habits: Habit[]
  weekDates: string[]
  selectedDate: string
  todayISO: string
  onSelectDate: (date: string) => void
  onQuickToggle: (habitId: string, date: string) => void
  onOpenLog: (habitId: string, date: string) => void
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const

export function RoutineTodayPanel({
  habits,
  weekDates,
  selectedDate,
  todayISO,
  onSelectDate,
  onQuickToggle,
  onOpenLog,
}: RoutineTodayPanelProps) {
  const planned = habits
    .filter(
      (habit) =>
        isHabitActiveOnDate(habit, selectedDate) &&
        isHabitScheduledOnDate(habit, selectedDate),
    )
    .sort((a, b) => getHabitTimingOrder(a) - getHabitTimingOrder(b))

  const pending = planned.filter((habit) => {
    const status = getHabitEntryStatus(habit.dailyEntries?.[selectedDate])
    return status === "planned" || status === "partial"
  })
  const nextHabit = pending[0]
  const future = selectedDate > todayISO
  const isToday = selectedDate === todayISO

  return (
    <section className="space-y-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
          План
        </p>
        <div className="mt-0.5 flex items-end justify-between gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            {isToday ? "Сегодня" : format(parseISO(selectedDate), "d MMMM", { locale: ru })}
          </h2>
          <span className="text-xs text-slate-400">
            {planned.length} запланировано
          </span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {weekDates.map((date, index) => {
          const active = date === selectedDate
          const today = date === todayISO
          return (
            <button
              key={date}
              type="button"
              onClick={() => onSelectDate(date)}
              className={
                active
                  ? "rounded-2xl bg-blue-600 px-1 py-2 text-center text-white shadow-sm shadow-blue-600/20"
                  : today
                    ? "rounded-2xl border border-blue-500/50 bg-blue-50 px-1 py-2 text-center text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                    : "rounded-2xl bg-slate-100 px-1 py-2 text-center text-slate-500 dark:bg-slate-900 dark:text-slate-400"
              }
            >
              <span className="block text-[10px] font-medium">{WEEKDAYS[index]}</span>
              <span className="mt-0.5 block text-sm font-semibold">
                {format(parseISO(date), "d", { locale: ru })}
              </span>
            </button>
          )
        })}
      </div>

      {nextHabit && !future ? (
        <div className="rounded-[22px] border border-blue-200/80 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
          <div className="flex items-start gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
              <Sparkles className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-blue-700 dark:text-blue-300">
                Следующее действие
              </p>
              <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                {nextHabit.name}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {getHabitTimingLabel(nextHabit)}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              onClick={() =>
                getHabitCompletionType(nextHabit) === "check"
                  ? onQuickToggle(nextHabit.id, selectedDate)
                  : onOpenLog(nextHabit.id, selectedDate)
              }
            >
              {getHabitCompletionType(nextHabit) === "check" ? "Готово" : "Отметить"}
            </Button>
          </div>
        </div>
      ) : null}

      {planned.length === 0 ? (
        <div className="rounded-[22px] border border-dashed border-slate-300 px-4 py-6 text-center dark:border-slate-700">
          <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            На этот день ничего не запланировано
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Можно оставить день свободным или изменить расписание привычек.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {planned.map((habit) => {
            const entry = habit.dailyEntries?.[selectedDate]
            const status = getHabitEntryStatus(entry)
            const done = status === "completed"
            const completionType = getHabitCompletionType(habit)

            return (
              <div
                key={habit.id}
                className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <span
                  className={
                    done
                      ? "flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"
                      : "flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }
                >
                  {done ? <Check className="size-4" aria-hidden /> : <Clock3 className="size-4" aria-hidden />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {habit.name}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                    {status === "planned"
                      ? getHabitTimingLabel(habit)
                      : HABIT_STATUS_LABELS[status]}
                    {entry?.rescheduledTo ? ` · на ${entry.rescheduledTo}` : ""}
                  </p>
                </div>

                {!future && status === "planned" ? (
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() =>
                      completionType === "check"
                        ? onQuickToggle(habit.id, selectedDate)
                        : onOpenLog(habit.id, selectedDate)
                    }
                  >
                    {completionType === "check" ? (
                      <CheckCircle2 className="size-4" aria-hidden />
                    ) : (
                      "Отметить"
                    )}
                  </Button>
                ) : future && status === "planned" ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                    onClick={() => onOpenLog(habit.id, selectedDate)}
                  >
                    Перенести
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9 rounded-xl text-slate-500 dark:text-slate-400"
                    onClick={() => onOpenLog(habit.id, selectedDate)}
                    aria-label="Открыть отметку"
                  >
                    <MoreHorizontal className="size-4" aria-hidden />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
