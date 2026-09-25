import { parseISO, format } from "date-fns"
import { ru } from "date-fns/locale"
import type { Habit } from "@/store/appState.types"
import {
  getHabitTotalCompliance,
  getHabitWeeklyCompliance,
} from "@/store/selectors"
import { HabitRow } from "./HabitRow"

const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const

type HabitTableProps = {
  habits: Habit[]
  weekDates: string[]
  onToggleHabitDate: (habitId: string, date: string) => void
  onEditHabit: (habitId: string) => void
  onDeleteHabit: (habitId: string) => void
}

export function HabitTable({
  habits,
  weekDates,
  onToggleHabitDate,
  onEditHabit,
  onDeleteHabit,
}: HabitTableProps) {
  if (habits.length === 0) {
    return (
      <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white px-4 py-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:px-6 sm:py-12">
        <p className="break-words text-sm font-medium text-slate-950 dark:text-slate-100">
          Привычек пока нет
        </p>
      </div>
    )
  }

  return (
    <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/60">
            <th className="min-w-[140px] max-w-[min(40vw,280px)] px-3 py-3 text-left font-semibold text-slate-950 dark:text-slate-100">
              Привычка
            </th>
            {weekDates.map((iso, i) => (
              <th
                key={iso}
                className="min-w-11 w-12 px-1 py-3 text-center font-semibold text-slate-950 dark:text-slate-100"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{WEEKDAY_SHORT[i]}</span>
                  <span className="text-xs font-normal text-slate-600 dark:text-slate-400">
                    {format(parseISO(iso), "d", { locale: ru })}
                  </span>
                </div>
              </th>
            ))}
            <th className="whitespace-nowrap px-2 py-3 text-center font-semibold text-slate-950 dark:text-slate-100">
              % за неделю
            </th>
            <th className="whitespace-nowrap px-2 py-3 text-center font-semibold text-slate-950 dark:text-slate-100">
              Общий compliance
            </th>
            <th className="whitespace-nowrap px-2 py-3 text-right font-semibold text-slate-950 dark:text-slate-100">
              Действия
            </th>
          </tr>
        </thead>
        <tbody>
          {habits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              weekDates={weekDates}
              weekCompliance={getHabitWeeklyCompliance(habit, weekDates)}
              totalCompliance={getHabitTotalCompliance(habit)}
              onToggleDate={(date) => onToggleHabitDate(habit.id, date)}
              onEdit={() => onEditHabit(habit.id)}
              onDelete={() => onDeleteHabit(habit.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
