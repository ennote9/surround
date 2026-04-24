import { addDays, format } from "date-fns"
import { ru } from "date-fns/locale"
import { Button } from "@/components/ui/button"

type HabitWeekControlsProps = {
  weekStartDate: Date
  onPreviousWeek: () => void
  onCurrentWeek: () => void
  onNextWeek: () => void
}

export function HabitWeekControls({
  weekStartDate,
  onPreviousWeek,
  onCurrentWeek,
  onNextWeek,
}: HabitWeekControlsProps) {
  const weekEnd = addDays(weekStartDate, 6)
  const rangeLabel = `${format(weekStartDate, "d MMM", { locale: ru })} — ${format(weekEnd, "d MMM", { locale: ru })}`

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-center text-sm font-medium text-slate-700 sm:text-left">
        {rangeLabel}
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700"
          onClick={onPreviousWeek}
        >
          ← Предыдущая
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700"
          onClick={onCurrentWeek}
        >
          Текущая
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-slate-300 text-slate-700"
          onClick={onNextWeek}
        >
          Следующая →
        </Button>
      </div>
    </div>
  )
}
