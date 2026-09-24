import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  FolderKanban,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

type MobileGoalFilter = "all" | GoalStatus

const MOBILE_FILTERS: Array<{ value: MobileGoalFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "active", label: "Сейчас" },
  { value: "later", label: "Позже" },
  { value: "archived", label: "Архив" },
]

function getStatusLabel(status: GoalStatus): string {
  if (status === "active") return "Сейчас"
  if (status === "later") return "Позже"
  return "Архив"
}

function getStatusClassName(status: GoalStatus): string {
  if (status === "active") {
    return "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300"
  }
  if (status === "later") {
    return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300"
  }
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
}

function GoalProgressRing({ value }: { value: number }) {
  const size = 58
  const strokeWidth = 6
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Прогресс цели ${clamped}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-blue-600 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold tabular-nums text-slate-950 dark:text-slate-100">
        {clamped}%
      </span>
    </div>
  )
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
  const [mobileFilter, setMobileFilter] = useState<MobileGoalFilter>("all")

  const sortedGoals = useMemo(() => {
    return [...state.goals].sort((a, b) => {
      const byStatus = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
      if (byStatus !== 0) return byStatus
      return a.title.localeCompare(b.title, "ru")
    })
  }, [state.goals])

  const mobileGoals = useMemo(
    () =>
      mobileFilter === "all"
        ? sortedGoals
        : sortedGoals.filter((goal) => goal.status === mobileFilter),
    [sortedGoals, mobileFilter],
  )

  const activeGoals = sortedGoals.filter((goal) => goal.status === "active")
  const activeGoalIds = new Set(activeGoals.map((goal) => goal.id))
  const activeProjects = state.projects.filter((project) =>
    project.goalId ? activeGoalIds.has(project.goalId) : false,
  )
  const activeTaskStats = activeProjects.reduce(
    (totals, project) => {
      for (const group of project.groups) {
        totals.total += group.tasks.length
        totals.completed += group.tasks.filter((task) => task.completed).length
      }
      return totals
    },
    { completed: 0, total: 0 },
  )
  const activeProgress =
    activeTaskStats.total === 0
      ? 0
      : Math.round((activeTaskStats.completed / activeTaskStats.total) * 100)

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
    <div className="mx-auto max-w-5xl">
      <div className="space-y-5 md:hidden">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
              Направления
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Цели
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {activeGoals.length} в фокусе · {activeProjects.length} проектов
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            className="size-11 shrink-0 rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
            onClick={openAddGoal}
            aria-label="Добавить цель"
          >
            <Plus className="size-5" aria-hidden />
          </Button>
        </header>

        <section className="overflow-hidden rounded-[26px] border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:via-slate-900 dark:to-indigo-500/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Портфель целей
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {activeProgress}%
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                прогресс активных направлений
              </p>
            </div>
            <GoalProgressRing value={activeProgress} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/70 p-2.5 dark:bg-slate-950/45">
              <Target className="size-4 text-blue-600 dark:text-blue-300" aria-hidden />
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {activeGoals.length}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                активных
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-2.5 dark:bg-slate-950/45">
              <FolderKanban className="size-4 text-blue-600 dark:text-blue-300" aria-hidden />
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {activeProjects.length}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                проектов
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-2.5 dark:bg-slate-950/45">
              <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-300" aria-hidden />
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {activeTaskStats.completed}/{activeTaskStats.total}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                задач
              </p>
            </div>
          </div>
        </section>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {MOBILE_FILTERS.map((filter) => {
            const selected = mobileFilter === filter.value
            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setMobileFilter(filter.value)}
                className={
                  selected
                    ? "whitespace-nowrap rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm"
                    : "whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }
              >
                {filter.label}
              </button>
            )
          })}
        </div>

        {mobileGoals.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
            <Target className="mx-auto size-8 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-slate-100">
              Здесь пока пусто
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              В выбранном статусе целей пока нет.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {mobileGoals.map((goal) => {
              const progress = getGoalProgress(goal.id, state.projects)
              const taskStats = getGoalTaskStats(goal.id, state.projects)
              const projectsForGoal = getProjectsForGoal(state.projects, goal.id)

              return (
                <section
                  key={goal.id}
                  className="rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium ${getStatusClassName(goal.status)}`}
                    >
                      {getStatusLabel(goal.status)}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label={`Действия с целью «${goal.title}»`}
                        >
                          <MoreHorizontal className="size-5" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-52 p-1.5 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <DropdownMenuItem
                          className="gap-2 px-2.5 py-2"
                          onSelect={() => openEditGoal(goal)}
                        >
                          <Pencil className="size-4" aria-hidden />
                          Редактировать
                        </DropdownMenuItem>
                        {goal.status !== "archived" ? (
                          <DropdownMenuItem
                            className="gap-2 px-2.5 py-2"
                            onSelect={() => handleArchiveGoal(goal.id)}
                          >
                            <Archive className="size-4" aria-hidden />
                            Архивировать
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          className="gap-2 px-2.5 py-2"
                          onSelect={() => openDeleteGoalDialog(goal)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl font-semibold leading-6 tracking-tight text-slate-950 dark:text-slate-100">
                        {goal.title}
                      </h2>
                      {goal.description ? (
                        <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
                          {goal.description}
                        </p>
                      ) : null}
                    </div>
                    <GoalProgressRing value={progress} />
                  </div>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/55">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <FolderKanban className="size-3.5" aria-hidden />
                        <span className="text-[10px]">Проекты</span>
                      </div>
                      <p className="mt-1.5 text-base font-semibold text-slate-950 dark:text-slate-100">
                        {projectsForGoal.length}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/55">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <ListChecks className="size-3.5" aria-hidden />
                        <span className="text-[10px]">Задачи</span>
                      </div>
                      <p className="mt-1.5 text-base font-semibold text-slate-950 dark:text-slate-100">
                        {taskStats.completed}/{taskStats.total}
                      </p>
                    </div>
                  </div>

                  {goal.targetDate ? (
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <CalendarDays className="size-4" aria-hidden />
                      <span>До {formatDateOnly(goal.targetDate)}</span>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleOpenGoal(goal.id)}
                    className="mt-4 flex min-h-11 w-full items-center justify-between rounded-2xl bg-blue-600 px-4 py-3 text-left text-sm font-semibold text-white shadow-sm shadow-blue-600/15 transition-colors hover:bg-blue-700 active:bg-blue-800"
                  >
                    <span>Открыть проекты</span>
                    <ChevronRight className="size-4" aria-hidden />
                  </button>
                </section>
              )
            })}
          </div>
        )}
      </div>

      <div className="hidden space-y-6 md:block">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Цели</h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400">
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
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="font-medium text-slate-950 dark:text-slate-100">Целей пока нет</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
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
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-slate-950 dark:text-slate-100">
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

                  <Progress value={progress} className="mt-3 h-2 bg-slate-100 dark:bg-slate-800" />

                  <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                    <p>Проектов: {projectsForGoal.length}</p>
                    <p>
                      Задач: {taskStats.completed} / {taskStats.total}
                    </p>
                    {goal.targetDate ? <p>Цель: {formatDateOnly(goal.targetDate)}</p> : null}
                  </div>

                  {goal.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                      {goal.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-300 dark:border-slate-700"
                      onClick={() => handleOpenGoal(goal.id)}
                    >
                      Открыть
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-slate-300 dark:border-slate-700"
                      onClick={() => openEditGoal(goal)}
                    >
                      Редактировать
                    </Button>
                    {goal.status !== "archived" ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="border-slate-300 dark:border-slate-700"
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
      </div>

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
