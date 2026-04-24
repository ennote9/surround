import { useMemo, useState } from "react"
import { toast } from "sonner"
import { addWeeks } from "date-fns"
import { startOfWeek } from "date-fns"
import { DeleteHabitDialog } from "@/features/habits/components/DeleteHabitDialog"
import { HabitDialog } from "@/features/habits/components/HabitDialog"
import { HabitTable } from "@/features/habits/components/HabitTable"
import { HabitWeekControls } from "@/features/habits/components/HabitWeekControls"
import { Button } from "@/components/ui/button"
import { getWeekISODatesFromMonday } from "@/shared/lib/dates"
import type { Habit } from "@/store/appState.types"
import { useAppState } from "@/store/useAppState"

export default function RoutinePage() {
  const { state, dispatch } = useAppState()
  const habits = state.habits

  const [weekStartDate, setWeekStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )

  const weekDates = useMemo(
    () => getWeekISODatesFromMonday(weekStartDate),
    [weekStartDate],
  )

  const [habitDialogOpen, setHabitDialogOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)

  const openAddHabit = () => {
    setEditingHabit(null)
    setHabitDialogOpen(true)
  }

  const openEditHabit = (habitId: string) => {
    const h = habits.find((x) => x.id === habitId)
    if (h) {
      setEditingHabit(h)
      setHabitDialogOpen(true)
    }
  }

  const handleHabitSubmit = (values: { name: string; description?: string }) => {
    if (editingHabit) {
      dispatch({
        type: "UPDATE_HABIT",
        payload: {
          id: editingHabit.id,
          patch: { name: values.name, description: values.description },
        },
      })
      toast.success("Привычка обновлена")
    } else {
      dispatch({
        type: "ADD_HABIT",
        payload: { name: values.name, description: values.description },
      })
      toast.success("Привычка создана")
    }
  }

  const confirmDeleteHabit = () => {
    if (!deletingHabit) return
    dispatch({ type: "DELETE_HABIT", payload: { id: deletingHabit.id } })
    toast.success("Привычка удалена")
    setDeletingHabit(null)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Ежедневная рутина
          </h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Трекер привычек и ежедневных действий, влияющих на общий прогресс.
          </p>
        </header>
        <Button
          type="button"
          className="shrink-0 bg-blue-600 text-white hover:bg-blue-700"
          onClick={openAddHabit}
        >
          Добавить привычку
        </Button>
      </div>

      <HabitWeekControls
        weekStartDate={weekStartDate}
        onPreviousWeek={() =>
          setWeekStartDate((d) => startOfWeek(addWeeks(d, -1), { weekStartsOn: 1 }))
        }
        onCurrentWeek={() =>
          setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))
        }
        onNextWeek={() =>
          setWeekStartDate((d) => startOfWeek(addWeeks(d, 1), { weekStartsOn: 1 }))
        }
      />

      {habits.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <p className="text-base font-semibold text-slate-950">
            Привычек пока нет
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
            Добавьте первую привычку, чтобы отслеживать ежедневную рутину и
            compliance по неделям.
          </p>
          <Button
            type="button"
            className="mt-6 bg-blue-600 text-white hover:bg-blue-700"
            onClick={openAddHabit}
          >
            Добавить привычку
          </Button>
        </div>
      ) : (
        <HabitTable
          habits={habits}
          weekDates={weekDates}
          onToggleHabitDate={(habitId, date) =>
            dispatch({ type: "TOGGLE_HABIT_DATE", payload: { id: habitId, date } })
          }
          onEditHabit={openEditHabit}
          onDeleteHabit={(habitId) => {
            const h = habits.find((x) => x.id === habitId)
            if (h) setDeletingHabit(h)
          }}
        />
      )}

      <HabitDialog
        open={habitDialogOpen}
        onOpenChange={setHabitDialogOpen}
        initialHabit={editingHabit ?? undefined}
        onSubmit={handleHabitSubmit}
      />

      <DeleteHabitDialog
        open={deletingHabit !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingHabit(null)
        }}
        habitName={deletingHabit?.name}
        onConfirm={confirmDeleteHabit}
      />
    </div>
  )
}
