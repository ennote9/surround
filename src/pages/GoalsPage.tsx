import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useAuth } from "@/features/auth/useAuth"
import { DeleteGoalDialog } from "@/features/goals/components/DeleteGoalDialog"
import {
  GoalDialog,
  type GoalFormValues,
} from "@/features/goals/components/GoalDialog"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import { deleteGoalOnly, deleteGoalWithProjects } from "@/shared/api/goalDeletion"
import { formatDateOnly } from "@/shared/lib/dateFormat"
import { ALL_GOALS_SCOPE } from "@/shared/lib/selectedGoal"
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
  const { user } = useAuth()
  const navigate = useNavigate()
  const [rawSelectedGoalId, setRawSelectedGoalId] = useLocalStorage<string>(
    SELECTED_GOAL_STORAGE_KEY,
    ALL_GOALS_SCOPE,
  )
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [deletingGoal, setDeletingGoal] = useState<Goal | null>(null)
  const [deleteGoalError, setDeleteGoalError] = useState<string | null>(null)
  const [isDeletingGoal, setIsDeletingGoal] = useState(false)

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

  const openDeleteGoalDialog = (goal: Goal) => {
    setDeleteGoalError(null)
    setDeletingGoal(goal)
  }

  const handleDeleteGoalDialogOpenChange = (open: boolean) => {
    if (!open) {
      if (isDeletingGoal) return
      setDeletingGoal(null)
      setDeleteGoalError(null)
    }
  }

  const clearSelectedGoalIfDeleted = (deletedGoalId: string) => {
    const raw = String(rawSelectedGoalId ?? "").trim()
    if (raw === deletedGoalId) {
      setRawSelectedGoalId(ALL_GOALS_SCOPE)
    }
  }

  const handleDeleteGoalOnly = async () => {
    const goal = deletingGoal
    if (!goal) return
    if (!user) {
      setDeleteGoalError("Нужно войти в аккаунт, чтобы удалить цель.")
      return
    }
    setIsDeletingGoal(true)
    setDeleteGoalError(null)
    const result = await deleteGoalOnly(user.id, goal.id)
    setIsDeletingGoal(false)
    if (result.error) {
      setDeleteGoalError(result.error)
      return
    }
    dispatch({
      type: "DELETE_GOAL",
      payload: { goalId: goal.id, mode: "goal-only" },
    })
    clearSelectedGoalIfDeleted(goal.id)
    setDeletingGoal(null)
    setDeleteGoalError(null)
  }

  const handleDeleteGoalWithProjects = async () => {
    const goal = deletingGoal
    if (!goal) return
    if (!user) {
      setDeleteGoalError("Нужно войти в аккаунт, чтобы удалить цель.")
      return
    }
    setIsDeletingGoal(true)
    setDeleteGoalError(null)
    const result = await deleteGoalWithProjects(user.id, goal.id)
    setIsDeletingGoal(false)
    if (result.error) {
      setDeleteGoalError(result.error)
      return
    }
    dispatch({
      type: "DELETE_GOAL",
      payload: { goalId: goal.id, mode: "with-projects" },
    })
    clearSelectedGoalIfDeleted(goal.id)
    setDeletingGoal(null)
    setDeleteGoalError(null)
  }

  const handleOpenGoal = (goalId: string) => {
    setRawSelectedGoalId(goalId)
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
                  <Button
                    type="button"
                    variant="destructive"
                    className="h-10 min-h-10 border-0 bg-red-600 text-white hover:bg-red-700"
                    onClick={() => openDeleteGoalDialog(goal)}
                  >
                    Удалить
                  </Button>
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

      <DeleteGoalDialog
        open={deletingGoal !== null}
        goal={deletingGoal}
        projectCount={
          deletingGoal
            ? getProjectsForGoal(state.projects, deletingGoal.id).length
            : 0
        }
        onOpenChange={handleDeleteGoalDialogOpenChange}
        onDeleteGoalOnly={handleDeleteGoalOnly}
        onDeleteWithProjects={handleDeleteGoalWithProjects}
        loading={isDeletingGoal}
        error={deleteGoalError}
      />
    </div>
  )
}
