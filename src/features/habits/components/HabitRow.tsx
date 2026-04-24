import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
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

export function HabitRow({
  habit,
  weekDates,
  weekCompliance,
  totalCompliance,
  onToggleDate,
  onEdit,
  onDelete,
}: HabitRowProps) {
  return (
    <tr className="border-b border-slate-200 last:border-0">
      <td className="min-w-[140px] px-3 py-3 align-top">
        <p className="font-medium text-slate-950">{habit.name}</p>
        {habit.description ? (
          <p className="mt-1 text-xs text-slate-600">{habit.description}</p>
        ) : null}
      </td>
      {weekDates.map((date) => {
        const done = habit.dailyStatus[date] === true
        return (
          <td
            key={date}
            className={cn(
              "w-12 px-1 py-3 text-center align-middle",
              done && "bg-blue-50",
            )}
          >
            <div className="flex justify-center">
              <Checkbox
                id={`habit-${habit.id}-${date}`}
                checked={done}
                onCheckedChange={() => onToggleDate(date)}
                className="border-slate-400 data-checked:border-blue-600 data-checked:bg-blue-600"
                aria-label={`${habit.name} ${date}`}
              />
            </div>
          </td>
        )
      })}
      <td className="whitespace-nowrap px-2 py-3 text-center text-sm font-semibold text-blue-600">
        {weekCompliance}%
      </td>
      <td className="whitespace-nowrap px-2 py-3 text-center text-sm font-semibold text-blue-600">
        {totalCompliance}%
      </td>
      <td className="whitespace-nowrap px-2 py-3 text-right">
        <div className="flex justify-end gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-slate-600 hover:bg-slate-100 hover:text-slate-950"
            aria-label="Редактировать"
            onClick={onEdit}
          >
            <Pencil className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-slate-600 hover:bg-red-50 hover:text-red-600"
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
