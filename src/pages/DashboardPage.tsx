import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock3,
  Gauge,
  Inbox,
  Layers3,
  ListTodo,
  Plus,
  Sparkles,
  Target,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import { DashboardGoalSwitcher } from "@/features/dashboard/components/DashboardGoalSwitcher"
import {
  CHARACTER_STATS,
  getCharacterStatLevel,
  getCharacterStatProgress,
} from "@/features/dashboard/characterStats"
import {
  DEFAULT_DASHBOARD_STAT_VISIBILITY,
  normalizeDashboardStatVisibility,
} from "@/features/dashboard/dashboardStatVisibility"
import {
  DEFAULT_DASHBOARD_WIDGETS,
  type DashboardWidgetId,
  normalizeDashboardWidgets,
} from "@/features/dashboard/dashboardWidgets"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import { getTodayISO } from "@/shared/lib/dates"
import {
  ALL_GOALS_SCOPE,
  getSelectedGoalTitle,
  normalizeSelectedGoalId,
} from "@/shared/lib/selectedGoal"
import {
  DASHBOARD_STAT_VISIBILITY_STORAGE_KEY,
  DASHBOARD_WIDGETS_STORAGE_KEY,
  SELECTED_GOAL_STORAGE_KEY,
  SELECTED_PROJECT_STORAGE_KEY,
} from "@/shared/lib/storageKeys"
import {
  getProjectContext,
  getTaskStatus,
  getTaskStatusLabel,
} from "@/shared/lib/workManagement"
import type {
  LifeContext,
  Project,
  Task,
  WorkInboxItem,
  WorkspaceMode,
} from "@/store/appState.types"
import {
  getHabitWeeklyCompleted,
  getHabitWeeklyTarget,
  getOverallProgress,
  getProjectProgress,
  getProjectTaskStats,
  isHabitScheduledOnDate,
} from "@/store/selectors"
import { useAppState } from "@/store/useAppState"

type TaskRef = {
  project: Project
  groupId: string
  groupTitle: string
  task: Task
}

const CONTROL_STATUSES = new Set(["waiting", "delegated", "control"])

function isWidgetEnabled(
  widgets: ReturnType<typeof normalizeDashboardWidgets>,
  id: DashboardWidgetId,
): boolean {
  return widgets.find((item) => item.id === id)?.enabled ?? false
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `home-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatDashboardDate(isoDate: string): string {
  const value = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(`${isoDate}T12:00:00`))
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function formatShortDate(value?: string): string {
  if (!value) return "—"
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  })
    .format(new Date(`${value.slice(0, 10)}T12:00:00`))
    .replace(".", "")
}

function getLastDays(todayISO: string, count: number): string[] {
  const base = new Date(`${todayISO}T12:00:00`)
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(base)
    date.setDate(base.getDate() - (count - 1 - index))
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  })
}

function flattenOpenTasks(projects: Project[]): TaskRef[] {
  return projects.flatMap((project) =>
    project.groups.flatMap((group) =>
      group.tasks
        .filter((task) => getTaskStatus(task) !== "done")
        .map((task) => ({
          project,
          groupId: group.id,
          groupTitle: group.title,
          task,
        })),
    ),
  )
}

function priorityWeight(priority?: Task["priority"]): number {
  if (priority === "high") return 3
  if (priority === "medium") return 2
  return 1
}

function sortTaskRefs(a: TaskRef, b: TaskRef): number {
  const deadline = (a.task.deadline ?? "9999-99-99").localeCompare(
    b.task.deadline ?? "9999-99-99",
  )
  if (deadline !== 0) return deadline
  return priorityWeight(b.task.priority) - priorityWeight(a.task.priority)
}

function getInboxContext(item: WorkInboxItem): LifeContext {
  return item.context === "personal" ? "personal" : "work"
}

function CompactMetric({
  value,
  label,
  warning = false,
}: {
  value: string | number
  label: string
  warning?: boolean
}) {
  return (
    <div
      className={
        warning
          ? "min-w-0 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-center dark:border-amber-500/20 dark:bg-amber-500/10"
          : "min-w-0 rounded-xl border border-slate-200 bg-white px-2.5 py-2 text-center dark:border-slate-800 dark:bg-slate-900"
      }
    >
      <p
        className={
          warning
            ? "text-lg font-semibold leading-none tabular-nums text-amber-700 dark:text-amber-300"
            : "text-lg font-semibold leading-none tabular-nums text-slate-950 dark:text-white"
        }
      >
        {value}
      </p>
      <p className="mt-1 truncate text-[9px] font-medium text-slate-500 dark:text-slate-400 sm:text-[10px]">
        {label}
      </p>
    </div>
  )
}

function SectionHeader({
  icon: Icon,
  title,
  action,
}: {
  icon: typeof Target
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon className="size-4 shrink-0 text-slate-500 dark:text-slate-400" aria-hidden />
      <h2 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
        {title}
      </h2>
      {action}
    </div>
  )
}

function TaskLine({
  item,
  context,
  onOpenProject,
  badge,
}: {
  item: TaskRef
  context: LifeContext
  onOpenProject: (projectId: string) => void
  badge?: string
}) {
  return (
    <Link
      to="/projects"
      onClick={() => onOpenProject(item.project.id)}
      className="group flex min-w-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <span
        className={
          context === "work"
            ? "flex size-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300"
            : "flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
        }
      >
        {context === "work" ? (
          <BriefcaseBusiness className="size-3.5" aria-hidden />
        ) : (
          <UserRound className="size-3.5" aria-hidden />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
          {item.task.title}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-slate-400">
          {item.project.title}
          {item.task.deadline ? ` · ${formatShortDate(item.task.deadline)}` : ""}
        </p>
      </div>
      {badge ? (
        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {badge}
        </span>
      ) : null}
      <ChevronRight className="size-3.5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 dark:text-slate-600" aria-hidden />
    </Link>
  )
}

function ProjectLine({
  project,
  onOpenProject,
  nextTitle,
}: {
  project: Project
  onOpenProject: (projectId: string) => void
  nextTitle?: string
}) {
  const progress = getProjectProgress(project)
  const stats = getProjectTaskStats(project)
  const open = Math.max(0, stats.total - stats.completed)

  return (
    <Link
      to="/projects"
      onClick={() => onOpenProject(project.id)}
      className="block rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex min-w-0 items-center gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {project.title}
          </p>
          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {nextTitle ? `→ ${nextTitle}` : `${open} открытых задач`}
          </p>
        </div>
        <span className="shrink-0 text-xs font-semibold tabular-nums text-slate-500">
          {progress}%
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-600"
          style={{ width: `${stats.total > 0 ? progress : 0}%` }}
        />
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { state, dispatch } = useAppState()
  const todayISO = getTodayISO()
  const mode: WorkspaceMode = state.settings.workspaceMode ?? "all"

  const [rawSelectedGoalId] = useLocalStorage(
    SELECTED_GOAL_STORAGE_KEY,
    ALL_GOALS_SCOPE,
  )
  const dashboardGoals = useMemo(
    () => state.goals.filter((goal) => goal.showOnDashboard !== false),
    [state.goals],
  )
  const selectedGoalId = normalizeSelectedGoalId(rawSelectedGoalId, dashboardGoals)
  const selectedGoalTitle = getSelectedGoalTitle(selectedGoalId, dashboardGoals)

  const [widgetsStored] = useLocalStorage(
    DASHBOARD_WIDGETS_STORAGE_KEY,
    DEFAULT_DASHBOARD_WIDGETS,
  )
  const widgets = useMemo(
    () => normalizeDashboardWidgets(widgetsStored),
    [widgetsStored],
  )
  const showToday = isWidgetEnabled(widgets, "todayRoutines")
  const showProjects = isWidgetEnabled(widgets, "projects")
  const showMetrics = isWidgetEnabled(widgets, "metrics")

  const [statVisibilityStored] = useLocalStorage(
    DASHBOARD_STAT_VISIBILITY_STORAGE_KEY,
    DEFAULT_DASHBOARD_STAT_VISIBILITY,
  )
  const visibleStatIds = useMemo(
    () =>
      normalizeDashboardStatVisibility(statVisibilityStored)
        .filter((item) => item.enabled)
        .map((item) => item.id),
    [statVisibilityStored],
  )

  const visibleActiveGoalIds = useMemo(
    () =>
      new Set(
        dashboardGoals
          .filter((goal) => goal.status === "active")
          .map((goal) => goal.id),
      ),
    [dashboardGoals],
  )
  const knownGoalIds = useMemo(
    () => new Set(state.goals.map((goal) => goal.id)),
    [state.goals],
  )

  const basePersonalProjects = useMemo(
    () =>
      state.projects.filter((project) => {
        if (getProjectContext(project) !== "personal") return false
        const goalId = project.goalId?.trim()
        if (!goalId || !knownGoalIds.has(goalId)) return true
        return visibleActiveGoalIds.has(goalId)
      }),
    [state.projects, knownGoalIds, visibleActiveGoalIds],
  )

  const personalProjects = useMemo(() => {
    if (selectedGoalId === ALL_GOALS_SCOPE) return basePersonalProjects
    return basePersonalProjects.filter(
      (project) => project.goalId?.trim() === selectedGoalId,
    )
  }, [basePersonalProjects, selectedGoalId])

  const workProjects = useMemo(
    () => state.projects.filter((project) => getProjectContext(project) === "work"),
    [state.projects],
  )

  const activeWorkProjects = useMemo(
    () =>
      workProjects.filter(
        (project) => project.phase === undefined || project.phase === "active",
      ),
    [workProjects],
  )
  const activePersonalProjects = useMemo(
    () =>
      personalProjects.filter(
        (project) => project.phase === undefined || project.phase === "active",
      ),
    [personalProjects],
  )

  const allWorkOpenTasks = useMemo(
    () => flattenOpenTasks(activeWorkProjects),
    [activeWorkProjects],
  )
  const allPersonalOpenTasks = useMemo(
    () => flattenOpenTasks(activePersonalProjects),
    [activePersonalProjects],
  )

  const workFocusIds = state.settings.dailyFocus?.[todayISO] ?? []
  const workFocusTasks = workFocusIds
    .map((id) => allWorkOpenTasks.find((item) => item.task.id === id))
    .filter((item): item is TaskRef => Boolean(item))
    .slice(0, 3)

  const workInProgress = allWorkOpenTasks
    .filter((item) => getTaskStatus(item.task) === "in_progress")
    .sort(sortTaskRefs)
  const workControl = allWorkOpenTasks
    .filter((item) => CONTROL_STATUSES.has(getTaskStatus(item.task)))
    .sort((a, b) =>
      (a.task.followUpDate ?? "9999-99-99").localeCompare(
        b.task.followUpDate ?? "9999-99-99",
      ),
    )
  const workOverdue = allWorkOpenTasks.filter(
    (item) => item.task.deadline && item.task.deadline < todayISO,
  )

  const workAttentionIds = new Set<string>()
  for (const item of allWorkOpenTasks) {
    const status = getTaskStatus(item.task)
    if (item.task.deadline && item.task.deadline <= todayISO) {
      workAttentionIds.add(item.task.id)
    }
    if (
      CONTROL_STATUSES.has(status) &&
      item.task.followUpDate &&
      item.task.followUpDate <= todayISO
    ) {
      workAttentionIds.add(item.task.id)
    }
    if (item.task.deferredUntil && item.task.deferredUntil <= todayISO) {
      workAttentionIds.add(item.task.id)
    }
  }
  const workAttention = allWorkOpenTasks
    .filter((item) => workAttentionIds.has(item.task.id))
    .sort(sortTaskRefs)

  const personalDueTasks = allPersonalOpenTasks
    .filter((item) => item.task.deadline && item.task.deadline <= todayISO)
    .sort(sortTaskRefs)
  const personalNextTasks = allPersonalOpenTasks
    .filter((item) => item.task.isNextAction)
    .sort(sortTaskRefs)
  const personalQueue = [...personalDueTasks]
  for (const item of personalNextTasks) {
    if (!personalQueue.some((candidate) => candidate.task.id === item.task.id)) {
      personalQueue.push(item)
    }
  }
  const personalOverdue = allPersonalOpenTasks.filter(
    (item) => item.task.deadline && item.task.deadline < todayISO,
  )

  const personalProjectIds = new Set(personalProjects.map((project) => project.id))
  const personalHabits = state.habits.filter((habit) => {
    const projectId = habit.projectId?.trim()
    if (projectId) return personalProjectIds.has(projectId)
    if (selectedGoalId !== ALL_GOALS_SCOPE) {
      return habit.goalId?.trim() === selectedGoalId
    }
    const goalId = habit.goalId?.trim()
    return !goalId || visibleActiveGoalIds.has(goalId)
  })
  const todayHabits = personalHabits.filter((habit) =>
    isHabitScheduledOnDate(habit, todayISO),
  )
  const completedHabits = todayHabits.filter(
    (habit) => habit.dailyStatus[todayISO] === true,
  ).length

  const weekDays = getLastDays(todayISO, 7)
  let weeklyCompleted = 0
  let weeklyExpected = 0
  for (const habit of personalHabits) {
    const target = getHabitWeeklyTarget(habit, weekDays)
    weeklyExpected += target
    weeklyCompleted += Math.min(getHabitWeeklyCompleted(habit, weekDays), target)
  }
  const weeklyRoutine = {
    completed: weeklyCompleted,
    expected: weeklyExpected,
    progress:
      weeklyExpected === 0
        ? 0
        : Math.round((weeklyCompleted / weeklyExpected) * 100),
  }

  const personalProgress = getOverallProgress(activePersonalProjects)
  const personalDashboardProjects = activePersonalProjects
    .filter((project) => project.showOnDashboard !== false)
    .sort((a, b) => {
      const aNext = flattenOpenTasks([a]).some((item) => item.task.isNextAction)
      const bNext = flattenOpenTasks([b]).some((item) => item.task.isNextAction)
      if (aNext !== bNext) return aNext ? -1 : 1
      return getProjectProgress(a) - getProjectProgress(b)
    })

  const workProjectNext = activeWorkProjects
    .map((project) => {
      const open = flattenOpenTasks([project])
      const next = open.find((item) => {
        const status = getTaskStatus(item.task)
        return (
          item.task.isNextAction &&
          status !== "waiting" &&
          status !== "delegated" &&
          status !== "done"
        )
      })
      return next ? { project, next } : null
    })
    .filter(
      (
        item,
      ): item is {
        project: Project
        next: TaskRef
      } => Boolean(item),
    )

  const statsToShow = CHARACTER_STATS.filter((stat) =>
    visibleStatIds.includes(stat.id),
  )
    .map((stat) => ({
      stat,
      progressData: getCharacterStatProgress(
        personalProjects,
        stat.id,
        personalHabits,
        weekDays,
      ),
    }))
    .filter(
      ({ progressData }) =>
        progressData.linkedProjects + progressData.linkedHabits > 0,
    )
    .sort((a, b) => b.progressData.progress - a.progressData.progress)
    .slice(0, 4)

  const workCurrent = workInProgress[0] ?? workFocusTasks[0]
  const personalCurrent = personalQueue[0]
  const currentTask =
    mode === "work"
      ? workCurrent
      : mode === "personal"
        ? personalCurrent
        : workCurrent ?? personalCurrent

  const workNextQueue = [...workFocusTasks]
  for (const item of workAttention) {
    if (!workNextQueue.some((candidate) => candidate.task.id === item.task.id)) {
      workNextQueue.push(item)
    }
  }

  const allTodayQueue = [
    ...workFocusTasks.map((item) => ({ item, context: "work" as const })),
    ...personalQueue.map((item) => ({ item, context: "personal" as const })),
  ].filter(
    (entry, index, list) =>
      list.findIndex((candidate) => candidate.item.task.id === entry.item.task.id) ===
      index,
  )

  const totalOverdue = workOverdue.length + personalOverdue.length
  const allInboxItems = state.settings.workInbox ?? []
  const visibleInboxItems = allInboxItems.filter((item) => {
    if (mode === "all") return true
    return getInboxContext(item) === mode
  })

  const [inboxTitle, setInboxTitle] = useState("")
  const [captureContext, setCaptureContext] = useState<LifeContext>("work")
  const [inboxTargets, setInboxTargets] = useState<Record<string, string>>({})
  const [inboxPriorities, setInboxPriorities] = useState<
    Record<string, Task["priority"]>
  >({})
  const [inboxDeadlines, setInboxDeadlines] = useState<Record<string, string>>({})

  const effectiveCaptureContext: LifeContext =
    mode === "personal" ? "personal" : mode === "work" ? "work" : captureContext

  const updateSettings = (patch: Partial<typeof state.settings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { patch } })
  }

  const addInboxItem = () => {
    const title = inboxTitle.trim()
    if (!title) return
    const item: WorkInboxItem = {
      id: makeId(),
      title,
      createdAt: new Date().toISOString(),
      context: effectiveCaptureContext,
    }
    updateSettings({ workInbox: [item, ...allInboxItems] })
    setInboxTitle("")
    toast.success("Добавлено во входящие")
  }

  const removeInboxItem = (id: string) => {
    updateSettings({
      workInbox: allInboxItems.filter((item) => item.id !== id),
    })
  }

  const convertInboxItem = (item: WorkInboxItem) => {
    const target = inboxTargets[item.id]
    if (!target) {
      toast.info("Выбери проект и этап")
      return
    }
    const [projectId, groupId] = target.split("::")
    const project = state.projects.find((candidate) => candidate.id === projectId)
    if (!project || getProjectContext(project) !== getInboxContext(item)) {
      toast.error("Проект не соответствует контексту входящего")
      return
    }
    const group = project.groups.find((candidate) => candidate.id === groupId)
    if (!group) return

    dispatch({
      type: "ADD_TASK",
      payload: {
        projectId,
        groupId,
        title: item.title,
        status: "planned",
        priority: inboxPriorities[item.id] ?? "medium",
        deadline: inboxDeadlines[item.id] || undefined,
      },
    })
    removeInboxItem(item.id)
    toast.success("Входящее превращено в задачу")
  }

  const handleOpenProject = (projectId: string) => {
    try {
      window.localStorage.setItem(
        SELECTED_PROJECT_STORAGE_KEY,
        JSON.stringify(projectId),
      )
    } catch {
      // Navigation hint is optional.
    }
  }

  const renderQuickCapture = () => (
    <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <Inbox className="size-4 shrink-0 text-slate-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Быстрый Inbox
          </p>
          <p className="truncate text-[10px] text-slate-400">
            Зафиксировать сейчас, разобрать позже.
          </p>
        </div>
        {visibleInboxItems.length > 0 ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {visibleInboxItems.length}
          </span>
        ) : null}
      </div>

      {mode === "all" ? (
        <div className="mt-2 flex gap-1">
          {([
            ["work", "Работа"],
            ["personal", "Личное"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setCaptureContext(value)}
              className={
                captureContext === value
                  ? "rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white dark:bg-white dark:text-slate-950"
                  : "rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex gap-2">
        <Input
          value={inboxTitle}
          onChange={(event) => setInboxTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addInboxItem()
          }}
          placeholder={
            effectiveCaptureContext === "work"
              ? "Новая рабочая задача или запрос…"
              : "Мысль, задача или идея…"
          }
          className="h-9 min-w-0 flex-1 text-sm"
        />
        <Button
          type="button"
          size="sm"
          onClick={addInboxItem}
          disabled={!inboxTitle.trim()}
          className="h-9 px-3"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">Добавить</span>
        </Button>
      </div>

      {visibleInboxItems.length > 0 ? (
        <details className="mt-2 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40">
          <summary className="cursor-pointer px-3 py-2 text-[11px] font-medium text-slate-500">
            Разобрать входящие · {visibleInboxItems.length}
          </summary>
          <div className="space-y-2 border-t border-slate-100 p-2 dark:border-slate-800">
            {visibleInboxItems.map((item) => {
              const context = getInboxContext(item)
              const projectOptions = state.projects.filter(
                (project) => getProjectContext(project) === context,
              )
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className={
                        context === "work"
                          ? "rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                          : "rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                      }
                    >
                      {context === "work" ? "Работа" : "Личное"}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                      {item.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeInboxItem(item.id)}
                      className="shrink-0 text-[10px] text-slate-400 hover:text-red-500"
                    >
                      удалить
                    </button>
                  </div>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(180px,1fr)_110px_140px_auto]">
                    <select
                      value={inboxTargets[item.id] ?? ""}
                      onChange={(event) =>
                        setInboxTargets((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      className="h-8 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[11px] dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">Проект и этап…</option>
                      {projectOptions.flatMap((project) =>
                        project.groups.map((group) => (
                          <option
                            key={`${project.id}::${group.id}`}
                            value={`${project.id}::${group.id}`}
                          >
                            {project.title} — {group.title}
                          </option>
                        )),
                      )}
                    </select>
                    <select
                      value={inboxPriorities[item.id] ?? "medium"}
                      onChange={(event) =>
                        setInboxPriorities((current) => ({
                          ...current,
                          [item.id]: event.target.value as Task["priority"],
                        }))
                      }
                      className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-[11px] dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                    <Input
                      type="date"
                      value={inboxDeadlines[item.id] ?? ""}
                      onChange={(event) =>
                        setInboxDeadlines((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      className="h-8 text-[11px]"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => convertInboxItem(item)}
                      disabled={!inboxTargets[item.id]}
                      className="h-8"
                    >
                      В задачу
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </details>
      ) : null}
    </section>
  )

  const renderWork = () => (
    <>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <CompactMetric value={workFocusTasks.length + "/3"} label="план дня" />
        <CompactMetric
          value={workInProgress.length + "/" + (state.settings.workWipLimit ?? 4)}
          label="в работе"
        />
        <CompactMetric value={workControl.length} label="жду / контроль" />
        <CompactMetric
          value={workOverdue.length}
          label="просрочено"
          warning={workOverdue.length > 0}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-500/20 dark:bg-blue-500/5">
          <SectionHeader
            icon={Gauge}
            title="Сейчас"
            action={
              <Link to="/work" className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                Рабочий центр
              </Link>
            }
          />
          {workCurrent ? (
            <div className="mt-2.5">
              <p className="text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                {workCurrent.task.title}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {workCurrent.project.title} · {getTaskStatusLabel(workCurrent.task)}
              </p>
              {workCurrent.task.deadline ? (
                <p className="mt-1 text-[10px] text-slate-400">
                  Дедлайн {formatShortDate(workCurrent.task.deadline)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2.5 text-xs text-slate-400">
              Текущая задача не выбрана. Начни с первого пункта плана дня.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader icon={ListTodo} title="Дальше сегодня" />
          <div className="mt-2 space-y-1.5">
            {workNextQueue
              .filter((item) => item.task.id !== workCurrent?.task.id)
              .slice(0, 4)
              .map((item) => (
                <TaskLine
                  key={item.task.id}
                  item={item}
                  context="work"
                  onOpenProject={handleOpenProject}
                  badge={
                    workFocusTasks.some((focus) => focus.task.id === item.task.id)
                      ? "план"
                      : undefined
                  }
                />
              ))}
            {workNextQueue.filter((item) => item.task.id !== workCurrent?.task.id).length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 px-3 py-2.5 text-xs text-slate-400 dark:border-slate-800">
                Очередь пуста.
              </p>
            ) : null}
          </div>
        </section>
      </div>

      {workAttention.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
          <SectionHeader
            icon={AlertTriangle}
            title="Требует реакции"
            action={
              <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-slate-900 dark:text-amber-300">
                {workAttention.length}
              </span>
            }
          />
          <div className="mt-2 grid gap-1.5 md:grid-cols-2">
            {workAttention.slice(0, 6).map((item) => (
              <TaskLine
                key={item.task.id}
                item={item}
                context="work"
                onOpenProject={handleOpenProject}
                badge={
                  item.task.deadline && item.task.deadline < todayISO
                    ? "просрочено"
                    : item.task.followUpDate && item.task.followUpDate <= todayISO
                      ? "контроль"
                      : item.task.deadline === todayISO
                        ? "сегодня"
                        : "вернулось"
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader
            icon={Clock3}
            title="Жду / контроль"
            action={
              <span className="text-[10px] font-semibold text-slate-400">
                {workControl.length}
              </span>
            }
          />
          <div className="mt-2 space-y-1.5">
            {workControl.slice(0, 5).map((item) => (
              <div
                key={item.task.id}
                className="flex min-w-0 items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-950/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                    {item.task.title}
                  </p>
                  <p className="mt-0.5 truncate text-[9px] text-slate-400">
                    {item.task.assignee ?? item.project.title}
                  </p>
                </div>
                <span className="shrink-0 text-[9px] text-slate-400">
                  {item.task.followUpDate
                    ? formatShortDate(item.task.followUpDate)
                    : "без даты"}
                </span>
              </div>
            ))}
            {workControl.length === 0 ? (
              <p className="text-xs text-slate-400">Ничего не ждём.</p>
            ) : null}
          </div>
        </section>

        {showProjects ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader
              icon={Target}
              title="Следующие задачи проектов"
              action={
                <Link to="/projects" className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  Все проекты
                </Link>
              }
            />
            <div className="mt-2 space-y-1.5">
              {workProjectNext.slice(0, 5).map(({ project, next }) => (
                <ProjectLine
                  key={project.id}
                  project={project}
                  nextTitle={next.task.title}
                  onOpenProject={handleOpenProject}
                />
              ))}
              {workProjectNext.length === 0 ? (
                <p className="text-xs text-slate-400">
                  Следующие задачи проектов пока не выбраны.
                </p>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </>
  )

  const renderPersonal = () => (
    <>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <CompactMetric value={personalQueue.length} label="задачи сегодня" />
        <CompactMetric
          value={completedHabits + "/" + todayHabits.length}
          label="привычки"
        />
        <CompactMetric value={activePersonalProjects.length} label="проекты" />
        <CompactMetric value={personalProgress + "%"} label="прогресс" />
      </div>

      <div className="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-2xl border border-violet-200 bg-violet-50/40 p-3 dark:border-violet-500/20 dark:bg-violet-500/5">
          <SectionHeader
            icon={Sparkles}
            title="Сегодня"
            action={
              personalOverdue.length > 0 ? (
                <span className="text-[10px] font-semibold text-amber-600">
                  просрочено {personalOverdue.length}
                </span>
              ) : undefined
            }
          />
          <div className="mt-2 space-y-1.5">
            {personalQueue.slice(0, 5).map((item) => (
              <TaskLine
                key={item.task.id}
                item={item}
                context="personal"
                onOpenProject={handleOpenProject}
                badge={item.task.isNextAction ? "следующая" : undefined}
              />
            ))}
            {personalQueue.length === 0 ? (
              <p className="rounded-xl border border-dashed border-violet-200 px-3 py-2.5 text-xs text-slate-400 dark:border-violet-500/20">
                Срочных личных задач нет.
              </p>
            ) : null}
          </div>
        </section>

        {showToday ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <SectionHeader
              icon={CheckCircle2}
              title="Привычки сегодня"
              action={
                <Link to="/routine" className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                  Рутинa
                </Link>
              }
            />
            <div className="mt-2 space-y-1">
              {todayHabits.slice(0, 6).map((habit) => {
                const done = habit.dailyStatus[todayISO] === true
                return (
                  <Link
                    key={habit.id}
                    to="/routine"
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                  >
                    <span
                      className={
                        done
                          ? "flex size-5 items-center justify-center rounded-md bg-emerald-500 text-white"
                          : "flex size-5 items-center justify-center rounded-md bg-slate-100 text-slate-400 dark:bg-slate-800"
                      }
                    >
                      {done ? (
                        <Check className="size-3" aria-hidden />
                      ) : (
                        <Circle className="size-3" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
                      {habit.name}
                    </span>
                  </Link>
                )
              })}
              {todayHabits.length === 0 ? (
                <p className="text-xs text-slate-400">На сегодня привычек нет.</p>
              ) : null}
              <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] text-slate-400 dark:border-slate-800">
                <span>Ритм недели</span>
                <span className="font-semibold text-slate-600 dark:text-slate-300">
                  {weeklyRoutine.completed}/{weeklyRoutine.expected} · {weeklyRoutine.progress}%
                </span>
              </div>
            </div>
          </section>
        ) : null}
      </div>

      {showProjects ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader
            icon={Target}
            title="Активные проекты"
            action={
              <Link to="/projects" className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                Все проекты
              </Link>
            }
          />
          <div className="mt-2 grid gap-1.5 md:grid-cols-2">
            {personalDashboardProjects.slice(0, 6).map((project) => {
              const next = flattenOpenTasks([project]).find((item) => item.task.isNextAction)
              return (
                <ProjectLine
                  key={project.id}
                  project={project}
                  nextTitle={next?.task.title}
                  onOpenProject={handleOpenProject}
                />
              )
            })}
            {personalDashboardProjects.length === 0 ? (
              <p className="text-xs text-slate-400">Активных проектов нет.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {showMetrics && statsToShow.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader
            icon={Layers3}
            title="Статы"
            action={
              <Link to="/analytics" className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                Аналитика
              </Link>
            }
          />
          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {statsToShow.map(({ stat, progressData }) => (
              <Link
                key={stat.id}
                to="/analytics"
                className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-950/60"
              >
                <div className="flex items-center gap-1.5">
                  <CharacterStatIcon statType={stat.id} className="size-3.5 text-blue-600" />
                  <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-500">
                    {stat.title}
                  </span>
                </div>
                <div className="mt-1.5 flex items-end justify-between">
                  <span className="text-base font-semibold text-slate-900 dark:text-white">
                    {progressData.progress}%
                  </span>
                  <span className="text-[9px] text-slate-400">
                    Lv.{getCharacterStatLevel(progressData.progress)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  )

  const renderAll = () => (
    <>
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        <CompactMetric value={workFocusTasks.length + "/3"} label="работа" />
        <CompactMetric value={personalQueue.length} label="личные задачи" />
        <CompactMetric
          value={completedHabits + "/" + todayHabits.length}
          label="привычки"
        />
        <CompactMetric
          value={totalOverdue}
          label="просрочено"
          warning={totalOverdue > 0}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-blue-200 bg-blue-50/40 p-3 dark:border-blue-500/20 dark:bg-blue-500/5">
          <SectionHeader icon={Gauge} title="Сейчас" />
          {currentTask ? (
            <div className="mt-2.5">
              <span
                className={
                  getProjectContext(currentTask.project) === "work"
                    ? "rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                    : "rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-semibold text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                }
              >
                {getProjectContext(currentTask.project) === "work"
                  ? "Работа"
                  : "Личное"}
              </span>
              <p className="mt-1.5 text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                {currentTask.task.title}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {currentTask.project.title}
              </p>
            </div>
          ) : (
            <p className="mt-2.5 text-xs text-slate-400">
              Нет задачи, требующей немедленного внимания.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <SectionHeader icon={ListTodo} title="Сегодня" />
          <div className="mt-2 space-y-1.5">
            {allTodayQueue
              .filter((entry) => entry.item.task.id !== currentTask?.task.id)
              .slice(0, 5)
              .map(({ item, context }) => (
                <TaskLine
                  key={item.task.id}
                  item={item}
                  context={context}
                  onOpenProject={handleOpenProject}
                />
              ))}
            {allTodayQueue.filter((entry) => entry.item.task.id !== currentTask?.task.id).length === 0 ? (
              <p className="text-xs text-slate-400">Очередь на сегодня пуста.</p>
            ) : null}
          </div>
        </section>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <section className="rounded-2xl border border-blue-200 bg-white p-3 dark:border-blue-500/20 dark:bg-slate-900">
          <SectionHeader
            icon={BriefcaseBusiness}
            title="Работа"
            action={
              <Link to="/work" className="text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                Открыть
              </Link>
            }
          />
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-950/60">
              <p className="text-base font-semibold">{workInProgress.length}</p>
              <p className="text-[9px] text-slate-400">в работе</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-950/60">
              <p className="text-base font-semibold">{workControl.length}</p>
              <p className="text-[9px] text-slate-400">контроль</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-950/60">
              <p className="text-base font-semibold">{workAttention.length}</p>
              <p className="text-[9px] text-slate-400">реакция</p>
            </div>
          </div>
          {workFocusTasks[0] ? (
            <p className="mt-2 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
              → {workFocusTasks[0].task.title}
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-violet-200 bg-white p-3 dark:border-violet-500/20 dark:bg-slate-900">
          <SectionHeader
            icon={UserRound}
            title="Личное"
            action={
              <Link to="/projects" className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                Открыть
              </Link>
            }
          />
          <div className="mt-2 grid grid-cols-3 gap-1.5">
            <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-950/60">
              <p className="text-base font-semibold">{personalProgress}%</p>
              <p className="text-[9px] text-slate-400">прогресс</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-950/60">
              <p className="text-base font-semibold">{personalQueue.length}</p>
              <p className="text-[9px] text-slate-400">задачи</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-950/60">
              <p className="text-base font-semibold">{completedHabits}/{todayHabits.length}</p>
              <p className="text-[9px] text-slate-400">привычки</p>
            </div>
          </div>
          {personalQueue[0] ? (
            <p className="mt-2 truncate text-xs font-medium text-slate-700 dark:text-slate-300">
              → {personalQueue[0].task.title}
            </p>
          ) : null}
        </section>
      </div>

      {totalOverdue > 0 || workAttention.length > 0 ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
          <SectionHeader icon={AlertTriangle} title="Требует внимания" />
          <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
            {workAttention.length > 0 ? (
              <Link
                to="/work"
                className="rounded-full bg-white px-2.5 py-1 font-medium text-amber-700 dark:bg-slate-900 dark:text-amber-300"
              >
                Работа: {workAttention.length}
              </Link>
            ) : null}
            {personalOverdue.length > 0 ? (
              <Link
                to="/projects"
                className="rounded-full bg-white px-2.5 py-1 font-medium text-amber-700 dark:bg-slate-900 dark:text-amber-300"
              >
                Личное просрочено: {personalOverdue.length}
              </Link>
            ) : null}
          </div>
        </section>
      ) : null}
    </>
  )

  return (
    <div className="mx-auto w-full max-w-6xl space-y-3.5 pb-4">
      <header className="flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {formatDashboardDate(todayISO)}
          </p>
          <div className="mt-0.5 flex min-w-0 items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Главная
            </h1>
            <span
              className={
                mode === "work"
                  ? "rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                  : mode === "personal"
                    ? "rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                    : "rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }
            >
              {mode === "work" ? "Работа" : mode === "personal" ? "Личное" : "Всё"}
            </span>
          </div>
          <p className="mt-1 truncate text-[11px] text-slate-400">
            {mode === "work"
              ? "Что делать сейчас, что ждём и где требуется реакция."
              : mode === "personal"
                ? selectedGoalId === ALL_GOALS_SCOPE
                  ? "Личный ритм, задачи и движение по проектам."
                  : `Фокус: ${selectedGoalTitle}`
                : "Короткая картина дня без смешивания рабочих и личных систем."}
          </p>
        </div>
        {mode === "personal" ? (
          <DashboardGoalSwitcher className="max-w-[44%] sm:max-w-[280px]" />
        ) : null}
      </header>

      {renderQuickCapture()}

      {mode === "work"
        ? renderWork()
        : mode === "personal"
          ? renderPersonal()
          : renderAll()}

      <div className="flex flex-wrap items-center gap-3 pt-1 text-[10px] text-slate-400">
        <span className="inline-flex items-center gap-1">
          <Inbox className="size-3" aria-hidden />
          Inbox: {visibleInboxItems.length}
        </span>
        {mode !== "work" && showToday ? (
          <span className="inline-flex items-center gap-1">
            <CheckCircle2 className="size-3" aria-hidden />
            Ритм недели: {weeklyRoutine.progress}%
          </span>
        ) : null}
        <span className="inline-flex items-center gap-1">
          <AlertTriangle className="size-3" aria-hidden />
          Просрочено: {mode === "work" ? workOverdue.length : mode === "personal" ? personalOverdue.length : totalOverdue}
        </span>
      </div>
    </div>
  )
}
