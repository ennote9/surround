import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { addWeeks } from "date-fns"
import { startOfWeek } from "date-fns"
import { DeleteHabitDialog } from "@/features/habits/components/DeleteHabitDialog"
import { HabitDialog, type HabitFormValues } from "@/features/habits/components/HabitDialog"
import { HabitDetailDialog } from "@/features/habits/components/HabitDetailDialog"
import { HabitLogDialog } from "@/features/habits/components/HabitLogDialog"
import { HabitTable } from "@/features/habits/components/HabitTable"
import { HabitWeekControls } from "@/features/habits/components/HabitWeekControls"
import {
  RoutinePauseDialog,
  type RoutinePauseValues,
} from "@/features/habits/components/RoutinePauseDialog"
import { MobileRoutineWorkspace } from "@/features/habits/components/MobileRoutineWorkspace"
import { Button } from "@/components/ui/button"
import { getWeekISODatesFromMonday } from "@/shared/lib/dates"
import { getHabitCompletionType } from "@/store/selectors"
import type { Habit } from "@/store/appState.types"
import { useAppState } from "@/store/useAppState"

export default function RoutinePage() {
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const habits = state.habits

  const [weekStartDate, setWeekStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  )

  const weekDates = useMemo(
    () => getWeekISODatesFromMonday(weekStartDate),
    [weekStartDate],
  )

  const [habitDialogOpen, setHabitDialogOpen] = useState(false)
  const [routinePauseOpen, setRoutinePauseOpen] = useState(false)
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null)

  const [deletingHabit, setDeletingHabit] = useState<Habit | null>(null)
  const [detailHabit, setDetailHabit] = useState<Habit | null>(null)
  const [loggingHabit, setLoggingHabit] = useState<{
    habit: Habit
    date: string
  } | null>(null)

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

  const handleHabitSubmit = (values: HabitFormValues) => {
    if (editingHabit) {
      dispatch({
        type: "UPDATE_HABIT",
        payload: {
          id: editingHabit.id,
          patch: {
            name: values.name,
            description: values.description,
            projectId: values.projectId,
            goalId: undefined,
            schedule: values.schedule,
            settings: values.settings,
          },
        },
      })
      toast.success("Привычка обновлена")
    } else {
      dispatch({
        type: "ADD_HABIT",
        payload: {
          name: values.name,
          description: values.description,
          projectId: values.projectId,
          schedule: values.schedule,
          settings: values.settings,
        },
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

  const handleRoutinePause = (values: RoutinePauseValues) => {
    for (const habit of habits) {
      const existingRanges = habit.settings?.period?.pauseRanges ?? []
      const duplicate = existingRanges.some(
        (range) =>
          range.startDate === values.startDate &&
          range.endDate === values.endDate &&
          (range.reason ?? "") === (values.reason ?? ""),
      )
      if (duplicate) continue

      dispatch({
        type: "UPDATE_HABIT",
        payload: {
          id: habit.id,
          patch: {
            settings: {
              ...(habit.settings ?? {}),
              period: {
                ...(habit.settings?.period ?? {}),
                pauseRanges: [...existingRanges, values],
              },
            },
          },
        },
      })
    }
    toast.success("Пауза рутины сохранена")
  }

  const openHabitLog = (habitId: string, date: string) => {
    const habit = habits.find((item) => item.id === habitId)
    if (habit) {
      setLoggingHabit({ habit, date })
    }
  }

  const handleHabitDateAction = (habitId: string, date: string) => {
    const habit = habits.find((item) => item.id === habitId)
    if (!habit) return

    if (getHabitCompletionType(habit) === "check") {
      dispatch({ type: "TOGGLE_HABIT_DATE", payload: { id: habitId, date } })
      return
    }

    setLoggingHabit({ habit, date })
  }

  return (
    <div className="mx-auto min-w-0 w-full max-w-6xl">
      <MobileRoutineWorkspace
        habits={habits}
        projects={state.projects}
        weekDates={weekDates}
        onPreviousWeek={() =>
          setWeekStartDate((d) => startOfWeek(addWeeks(d, -1), { weekStartsOn: 1 }))
        }
        onCurrentWeek={() =>
          setWeekStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))
        }
        onNextWeek={() =>
          setWeekStartDate((d) => startOfWeek(addWeeks(d, 1), { weekStartsOn: 1 }))
        }
        onAddHabit={openAddHabit}
        onPauseRoutine={() => setRoutinePauseOpen(true)}
        onToggleHabitDate={handleHabitDateAction}
        onOpenHabitLog={openHabitLog}
        onOpenHabitDetails={(habitId) => {
          const h = habits.find((item) => item.id === habitId)
          if (h) setDetailHabit(h)
        }}
        onOpenProject={(projectId) =>
          navigate("/projects", { state: { openProjectId: projectId } })
        }
        onEditHabit={openEditHabit}
        onDeleteHabit={(habitId) => {
          const h = habits.find((x) => x.id === habitId)
          if (h) setDeletingHabit(h)
        }}
      />

      <div className="hidden space-y-6 md:block">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <header className="min-w-0">
            <h1 className="text-balance break-words text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-3xl">
              Ежедневная рутина
            </h1>
            <p className="mt-2 max-w-full text-pretty text-sm text-slate-600 dark:text-slate-400 sm:mt-3 sm:max-w-2xl sm:text-base">
              Трекер привычек и ежедневных действий, влияющих на общий прогресс.
            </p>
          </header>
          <div className="flex w-full shrink-0 gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              className="min-h-10 flex-1 border-slate-300 dark:border-slate-700 dark:bg-slate-900 sm:flex-none sm:min-h-9"
              onClick={() => setRoutinePauseOpen(true)}
            >
              Пауза рутины
            </Button>
            <Button
              type="button"
              className="min-h-10 flex-1 bg-blue-600 text-white hover:bg-blue-700 sm:flex-none sm:min-h-9"
              onClick={openAddHabit}
            >
              Добавить привычку
            </Button>
          </div>
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
          <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
            <p className="break-words text-base font-semibold text-slate-950 dark:text-slate-100">
              Привычек пока нет
            </p>
            <p className="mx-auto mt-2 max-w-full text-pretty text-sm text-slate-600 dark:text-slate-400 sm:max-w-md">
              Добавьте первую привычку, чтобы отслеживать ежедневную рутину и
              compliance по неделям.
            </p>
            <Button
              type="button"
              className="mt-6 min-h-10 w-full max-w-xs bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
              onClick={openAddHabit}
            >
              Добавить привычку
            </Button>
          </div>
        ) : (
          <HabitTable
            habits={habits}
            weekDates={weekDates}
            onToggleHabitDate={handleHabitDateAction}
            onOpenHabitDetails={(habitId) => {
              const h = habits.find((item) => item.id === habitId)
              if (h) setDetailHabit(h)
            }}
            onEditHabit={openEditHabit}
            onDeleteHabit={(habitId) => {
              const h = habits.find((x) => x.id === habitId)
              if (h) setDeletingHabit(h)
            }}
          />
        )}
      </div>

      <RoutinePauseDialog
        open={routinePauseOpen}
        onOpenChange={setRoutinePauseOpen}
        onSubmit={handleRoutinePause}
      />

      <HabitDialog
        open={habitDialogOpen}
        onOpenChange={setHabitDialogOpen}
        initialHabit={editingHabit ?? undefined}
        projects={state.projects}
        onSubmit={handleHabitSubmit}
      />

      <HabitLogDialog
        open={loggingHabit !== null}
        onOpenChange={(open) => {
          if (!open) setLoggingHabit(null)
        }}
        habit={loggingHabit?.habit ?? null}
        date={loggingHabit?.date ?? null}
        onSave={(entry) => {
          if (!loggingHabit) return
          dispatch({
            type: "SET_HABIT_ENTRY",
            payload: {
              id: loggingHabit.habit.id,
              date: loggingHabit.date,
              entry,
            },
          })
          toast.success(
            entry.status === "skipped"
              ? "Пропуск сохранён"
              : entry.status === "rescheduled"
                ? "Перенос сохранён"
                : entry.status === "partial"
                  ? "Частичное выполнение сохранено"
                  : "Результат сохранён",
          )
          setLoggingHabit(null)
        }}
      />

      <HabitDetailDialog
        open={detailHabit !== null}
        onOpenChange={(open) => {
          if (!open) setDetailHabit(null)
        }}
        habit={detailHabit}
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
