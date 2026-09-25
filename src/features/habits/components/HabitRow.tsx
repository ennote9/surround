import { Check, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { getTodayISO } from "@/shared/lib/dates"
import {
  getHabitCompletionType,
  getHabitScheduleMode,
  getHabitTargetValue,
  getHabitUnit,
  isHabitActiveOnDate,
  isHabitScheduledOnDate,
} from "@/store/selectors"
import type { Habit } from "@/store/appState.types"

type HabitRowProps = {
  habit: Habit
  weekDates: string[]
  weekCompliance: number
  totalCompliance: number
  onToggleDate: (date: string) => void
  onEdit: () => void
  onDelete: () => void
}

function formatSchedule(habit: Habit): string {
  const mode = getHabitScheduleMode(habit)
  if (mode === "daily") return "Каждый день"
  if (mode === "specific-days") {
    const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    return (habit.schedule?.daysOfWeek ?? [])
      .map((day) => labels[day - 1])
      .filter(Boolean)
      .join(" · ")
  }
  return `${habit.schedule?.targetPerWeek ?? 7}× в неделю`
}

function formatTarget(habit: Habit): string {
  const type = getHabitCompletionType(habit)
  if (type === "check") return "Галочка"
  const target = getHabitTargetValue(habit)
  const unit = getHabitUnit(habit)
  if (!target) return type === "duration" ? "Время" : "Количество"
  return `${target} ${unit}`
}

function formatEntryValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    const compact = value / 1000
    return `${Number.isInteger(compact) ? compact : compact.toFixed(1)}k`
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function HabitRow({
  habit,
  weekDates,
  weekCompliance,
  totalCompliance,
  onToggleDate,
  onEdit,
  onDelete,
}: HabitRowProps) {
  const completionType = getHabitCompletionType(habit)
  const paused = habit.settings?.period?.paused === true
  const todayISO = getTodayISO()

  return (
    <tr className="border-b border-slate-200 last:border-0 dark:border-slate-800">
      <td className="min-w-[180px] max-w-[min(40vw,320px)] px-3 py-3 align-top">
        <p className="break-words font-medium text-slate-950 dark:text-slate-100">
          {habit.name}
        </p>
        {habit.description ? (
          <p className="mt-1 text-pretty text-xs break-words text-slate-600 dark:text-slate-400">
            {habit.description}
          </p>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {formatSchedule(habit)}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {formatTarget(habit)}
          </span>
          {paused ? (
            <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              На паузе
            </span>
          ) : null}
        </div>
      </td>

      {weekDates.map((date) => {
        const done = habit.dailyStatus[date] === true
        const entry = habit.dailyEntries?.[date]
        const active = isHabitActiveOnDate(habit, date)
        const scheduled = isHabitScheduledOnDate(habit, date)
        const enabled = active && scheduled && date <= todayISO

        return (
          <td
            key={date}
            className={cn(
              "min-w-12 w-14 px-1 py-2 text-center align-middle sm:py-3",
              done && "bg-blue-50/70 dark:bg-blue-500/5",
            )}
          >
            <div className="mx-auto flex min-h-11 min-w-11 items-center justify-center touch-manipulation">
              {completionType === "check" ? (
                <Checkbox
                  id={`habit-${habit.id}-${date}`}
                  checked={done}
                  disabled={!enabled}
                  onCheckedChange={() => onToggleDate(date)}
                  className="size-5 border-slate-400 data-checked:border-blue-600 data-checked:bg-blue-600 disabled:opacity-30 sm:size-4"
                  aria-label={`${habit.name} ${date}`}
                />
              ) : (
                <button
                  type="button"
                  disabled={!enabled}
                  onClick={() => onToggleDate(date)}
                  className={cn(
                    "flex min-h-9 min-w-9 items-center justify-center rounded-xl px-1 text-[10px] font-semibold transition-colors",
                    entry?.skipped
                      ? "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                      : done
                        ? "bg-blue-600 text-white"
                        : entry?.value != null
                          ? "border border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
                    !enabled && "cursor-not-allowed opacity-30",
                  )}
                  aria-label={`${habit.name} ${date}`}
                  title={
                    entry?.value != null
                      ? `${entry.value} ${getHabitUnit(habit)}`
                      : undefined
                  }
                >
                  {entry?.skipped ? (
                    "—"
                  ) : entry?.value != null ? (
                    formatEntryValue(entry.value)
                  ) : done ? (
                    <Check className="size-4" aria-hidden />
                  ) : (
                    "+"
                  )}
                </button>
              )}
            </div>
          </td>
        )
      })}

      <td className="whitespace-nowrap px-2 py-3 text-center text-sm font-semibold text-blue-600">
        {paused ? "—" : `${weekCompliance}%`}
      </td>
      <td className="whitespace-nowrap px-2 py-3 text-center text-sm font-semibold text-blue-600">
        {paused ? "—" : `${totalCompliance}%`}
      </td>
      <td className="whitespace-nowrap px-2 py-2 text-right sm:py-3">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="min-h-10 min-w-10 text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 sm:min-h-8 sm:min-w-8"
            aria-label="Редактировать"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="min-h-10 min-w-10 text-slate-600 hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/30 dark:hover:text-red-300 sm:min-h-8 sm:min-w-8"
            aria-label="Удалить"
            onClick={onDelete}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </td>
    </tr>
  )
}
