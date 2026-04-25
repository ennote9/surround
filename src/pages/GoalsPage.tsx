import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  GoalDialog,
  type GoalFormValues,
} from "@/features/goals/components/GoalDialog"
import { formatDateOnly } from "@/shared/lib/dateFormat"
import { SELECTED_GOAL_STORAGE_KEY } from "@/shared/lib/storageKeys"
import type { Goal, GoalStatus } from "@/store/appState.types"
import {
  getGoalProgress,
  getGoalTaskStats,
  getProjectsForGoal,
} from "@/store/selectors"
import { useAppState } from "@/store/useAppState"

const STATUS_PRIORITY: Record<GoalStatus, number> = {
  active: 0,
  later: 1,
  archived: 2,
}

function getStatusLabel(status: GoalStatus): string {
  if (status === "active") return "Сейчас"
  if (status === "later") return "Позже"
  return "Архив"
}

function getStatusClassName(status: GoalStatus): string {
  if (status === "active") {
    return "border-blue-200 bg-blue-50 text-blue-700"
  }
  if (status === "later") {
    return "border-amber-200 bg-amber-50 text-amber-700"
  }
  return "border-slate-200 bg-slate-100 text-slate-700"
}

export default function GoalsPage() {
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)

  const sortedGoals = useMemo(() => {
    return [...state.goals].sort((a, b) => {
      const byStatus = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
      if (byStatus !== 0) return byStatus
      return a.title.localeCompare(b.title, "ru")
    })
  }, [state.goals])

  const openAddGoal = () => {
    setEditingGoal(null)
    setDialogOpen(true)
  }

  const openEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    setDialogOpen(true)
  }

  const handleGoalSubmit = (values: GoalFormValues) => {
    if (editingGoal) {
      dispatch({
        type: "UPDATE_GOAL",
        payload: {
          goalId: editingGoal.id,
          patch: {
            title: values.title,
            description: values.description,
            targetDate: values.targetDate,
            status: values.status,
            showOnDashboard: values.showOnDashboard,
          },
        },
      })
      return
    }

    dispatch({
      type: "ADD_GOAL",
      payload: {
        title: values.title,
        description: values.description,
        targetDate: values.targetDate,
        status: values.status,
        showOnDashboard: values.showOnDashboard,
      },
    })
  }

  const handleArchiveGoal = (goalId: string) => {
    dispatch({ type: "ARCHIVE_GOAL", payload: { goalId } })
  }

  const handleOpenGoal = (goalId: string) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(
          SELECTED_GOAL_STORAGE_KEY,
          JSON.stringify(goalId),
        )
      }
    } catch {
      // ignore quota / private mode
    }
    navigate("/projects")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Цели</h1>
          <p className="mt-3 text-slate-600">
            Большие жизненные направления, внутри которых сгруппированы проекты.
          </p>
        </div>
        <Button
          type="button"
          className="bg-blue-600 text-white hover:bg-blue-700"
          onClick={openAddGoal}
        >
          Добавить цель
        </Button>
      </header>

      {sortedGoals.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="font-medium text-slate-950">Целей пока нет</p>
          <p className="mt-2 text-sm text-slate-600">
            Создайте первую цель, чтобы сгруппировать проекты.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedGoals.map((goal) => {
            const progress = getGoalProgress(goal.id, state.projects)
            const taskStats = getGoalTaskStats(goal.id, state.projects)
            const projectsForGoal = getProjectsForGoal(state.projects, goal.id)

            return (
              <section
                key={goal.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-semibold text-slate-950">
                      {goal.title}
                    </h2>
                    <span
                      className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClassName(goal.status)}`}
                    >
                      {getStatusLabel(goal.status)}
                    </span>
                  </div>
                  <p className="text-lg font-semibold text-blue-600">{progress}%</p>
                </div>

                <Progress value={progress} className="mt-3 h-2 bg-slate-100" />

                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
                  <p>Проектов: {projectsForGoal.length}</p>
                  <p>
                    Задач: {taskStats.completed} / {taskStats.total}
                  </p>
                  {goal.targetDate ? <p>Цель: {formatDateOnly(goal.targetDate)}</p> : null}
                </div>

                {goal.description ? (
                  <p className="mt-3 text-sm leading-relaxed text-slate-700">
                    {goal.description}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300"
                    onClick={() => handleOpenGoal(goal.id)}
                  >
                    Открыть
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-300"
                    onClick={() => openEditGoal(goal)}
                  >
                    Редактировать
                  </Button>
                  {goal.status !== "archived" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-300"
                      onClick={() => handleArchiveGoal(goal.id)}
                    >
                      Архивировать
                    </Button>
                  ) : null}
                </div>
              </section>
            )
          })}
        </div>
      )}

      <GoalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        goal={editingGoal ?? undefined}
        onSubmit={handleGoalSubmit}
      />
    </div>
  )
}
