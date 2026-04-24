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
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-950">Привычек пока нет</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[720px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-3 text-left font-semibold text-slate-950">
              Привычка
            </th>
            {weekDates.map((iso, i) => (
              <th
                key={iso}
                className="w-12 px-1 py-3 text-center font-semibold text-slate-950"
              >
                <div className="flex flex-col items-center gap-0.5">
                  <span>{WEEKDAY_SHORT[i]}</span>
                  <span className="text-xs font-normal text-slate-600">
                    {format(parseISO(iso), "d", { locale: ru })}
                  </span>
                </div>
              </th>
            ))}
            <th className="whitespace-nowrap px-2 py-3 text-center font-semibold text-slate-950">
              % за неделю
            </th>
            <th className="whitespace-nowrap px-2 py-3 text-center font-semibold text-slate-950">
              Общий compliance
            </th>
            <th className="whitespace-nowrap px-2 py-3 text-right font-semibold text-slate-950">
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
