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
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <p className="min-w-0 break-words text-center text-sm font-medium text-slate-700 sm:text-left">
        {rangeLabel}
      </p>
      <div className="grid w-full grid-cols-1 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-center sm:gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10 w-full border-slate-300 text-slate-700 sm:w-auto sm:min-h-9"
          onClick={onPreviousWeek}
        >
          ← Предыдущая
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10 w-full border-slate-300 text-slate-700 sm:w-auto sm:min-h-9"
          onClick={onCurrentWeek}
        >
          Текущая
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-10 w-full border-slate-300 text-slate-700 sm:w-auto sm:min-h-9"
          onClick={onNextWeek}
        >
          Следующая →
        </Button>
      </div>
    </div>
  )
}
