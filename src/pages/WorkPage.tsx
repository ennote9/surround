import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { format, startOfWeek } from "date-fns"
import { ru } from "date-fns/locale"
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
  CalendarRange,
  CheckCircle2,
  Clock3,
  Gauge,
  Inbox,
  ListChecks,
  Plus,
  RotateCcw,
  Send,
  Star,
  UserRound,
  Users,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getTodayISO } from "@/shared/lib/dates"
import { SELECTED_PROJECT_STORAGE_KEY } from "@/shared/lib/storageKeys"
import {
  getProjectContext,
  getTaskDeferReasonLabel,
  getTaskStatus,
  getTaskStatusLabel,
  TASK_DEFER_REASON_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/shared/lib/workManagement"
import type {
  Project,
  Task,
  TaskDeferReason,
  TaskStatus,
  WorkInboxItem,
  WorkWeeklyReview,
} from "@/store/appState.types"
import { useAppState } from "@/store/useAppState"

type WorkTaskRef = {
  projectId: string
  projectTitle: string
  groupId: string
  groupTitle: string
  task: Task
}

const CONTROL_STATUSES = new Set<TaskStatus>([
  "waiting",
  "delegated",
  "control",
])

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `work-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function dateOnly(value?: string): string | undefined {
  return value?.slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  const fromTime = new Date(`${from}T12:00:00`).getTime()
  const toTime = new Date(`${to}T12:00:00`).getTime()
  return Math.floor((toTime - fromTime) / 86_400_000)
}

function getWeekStartISO(): string {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")
}

function getWeekEndISO(weekStartISO: string): string {
  const date = new Date(`${weekStartISO}T12:00:00`)
  date.setDate(date.getDate() + 6)
  return format(date, "yyyy-MM-dd")
}

function formatShortDate(value: string): string {
  return format(new Date(`${value}T12:00:00`), "d MMM", { locale: ru })
}

function getProjectOpenTasks(project: Project): WorkTaskRef[] {
  return project.groups.flatMap((group) =>
    group.tasks
      .filter((task) => getTaskStatus(task) !== "done")
      .map((task) => ({
        projectId: project.id,
        projectTitle: project.title,
        groupId: group.id,
        groupTitle: group.title,
        task,
      })),
  )
}

function TaskRow({
  item,
  focused,
  todayISO,
  onStatusChange,
  onFollowUpChange,
  onAssigneeChange,
  onToggleFocus,
  onSetNextAction,
  onDeferredChange,
  onDeferReasonChange,
  onDeferNoteChange,
  onDelegationNoteChange,
}: {
  item: WorkTaskRef
  focused: boolean
  todayISO: string
  onStatusChange: (status: TaskStatus) => void
  onFollowUpChange: (value?: string) => void
  onAssigneeChange: (value?: string) => void
  onToggleFocus: () => void
  onSetNextAction: () => void
  onDeferredChange: (value?: string) => void
  onDeferReasonChange: (value?: TaskDeferReason) => void
  onDeferNoteChange: (value?: string) => void
  onDelegationNoteChange: (value?: string) => void
}) {
  const status = getTaskStatus(item.task)
  const deferredFuture =
    item.task.deferredUntil !== undefined && item.task.deferredUntil > todayISO

  const openProject = () => {
    try {
      window.localStorage.setItem(
        SELECTED_PROJECT_STORAGE_KEY,
        JSON.stringify(item.projectId),
      )
    } catch {
      // local navigation hint is optional
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.task.isNextAction ? (
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300">
                Следующий шаг
              </span>
            ) : null}
            {deferredFuture ? (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                Отложено до {formatShortDate(item.task.deferredUntil!)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 break-words text-sm font-semibold text-slate-950 dark:text-slate-100">
            {item.task.title}
          </p>
          <Link
            to="/projects"
            onClick={openProject}
            className="mt-1 inline-block max-w-full truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            {item.projectTitle} · {item.groupTitle}
          </Link>
        </div>

        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={onSetNextAction}
            className={
              item.task.isNextAction
                ? "flex size-8 items-center justify-center rounded-lg bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300"
                : "flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400 hover:text-violet-600 dark:bg-slate-800"
            }
            title="Сделать следующим шагом проекта"
            aria-label="Сделать следующим шагом проекта"
          >
            <Star className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={onToggleFocus}
            className={
              focused
                ? "rounded-lg bg-blue-600 px-2.5 text-[11px] font-semibold text-white"
                : "rounded-lg bg-slate-100 px-2.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
            }
          >
            {focused ? "Фокус" : "+ Фокус"}
          </button>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
          className="h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          aria-label="Статус задачи"
        >
          {TASK_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Input
          type="date"
          value={item.task.followUpDate ?? ""}
          onChange={(event) => onFollowUpChange(event.target.value || undefined)}
          className="h-9 text-xs"
          aria-label="Дата контроля"
        />

        <Input
          defaultValue={item.task.assignee ?? ""}
          onBlur={(event) => onAssigneeChange(event.target.value.trim() || undefined)}
          className="h-9 text-xs"
          placeholder="Ответственный"
          aria-label="Ответственный"
        />
      </div>

      {CONTROL_STATUSES.has(status) && !item.task.followUpDate ? (
        <p className="mt-2 text-[11px] font-medium text-amber-600 dark:text-amber-400">
          Для этого статуса лучше задать дату контроля.
        </p>
      ) : null}

      <details className="mt-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2 dark:border-slate-800 dark:bg-slate-950/50">
        <summary className="cursor-pointer text-[11px] font-medium text-slate-500">
          Перенос и делегирование
        </summary>
        <div className="mt-3 grid gap-3">
          <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
            <Input
              type="date"
              value={item.task.deferredUntil ?? ""}
              onChange={(event) => onDeferredChange(event.target.value || undefined)}
              className="h-9 text-xs"
              aria-label="Отложить до"
            />
            <select
              value={item.task.deferReason ?? ""}
              onChange={(event) =>
                onDeferReasonChange(
                  (event.target.value || undefined) as TaskDeferReason | undefined,
                )
              }
              className="h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              aria-label="Причина переноса"
            >
              <option value="">Причина не указана</option>
              {TASK_DEFER_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Input
            defaultValue={item.task.deferNote ?? ""}
            onBlur={(event) =>
              onDeferNoteChange(event.target.value.trim() || undefined)
            }
            className="h-9 text-xs"
            placeholder="Комментарий: что изменилось и когда вернуться"
            aria-label="Комментарий к переносу"
          />
          <Textarea
            defaultValue={item.task.delegationNote ?? ""}
            onBlur={(event) =>
              onDelegationNoteChange(event.target.value.trim() || undefined)
            }
            rows={2}
            className="text-xs"
            placeholder="Что передано, что ждём, какой результат должен вернуться"
            aria-label="Комментарий по делегированию"
          />
        </div>
      </details>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        {item.task.deadline ? <span>Дедлайн: {item.task.deadline}</span> : null}
        {item.task.assignee ? <span>Ответственный: {item.task.assignee}</span> : null}
        {item.task.statusChangedAt ? (
          <span>Статус с: {dateOnly(item.task.statusChangedAt)}</span>
        ) : null}
      </div>
    </div>
  )
}

export default function WorkPage() {
  const { state, dispatch } = useAppState()
  const todayISO = getTodayISO()
  const weekStartISO = getWeekStartISO()
  const weekEndISO = getWeekEndISO(weekStartISO)
  const [inboxTitle, setInboxTitle] = useState("")
  const [focusCandidate, setFocusCandidate] = useState("")
  const [closureNote, setClosureNote] = useState(
    state.settings.workDayClosures?.[todayISO]?.note ?? "",
  )
  const [inboxTargets, setInboxTargets] = useState<Record<string, string>>({})

  const savedWeeklyReview = state.settings.workWeeklyReviews?.[weekStartISO]
  const [reviewWins, setReviewWins] = useState(savedWeeklyReview?.wins ?? "")
  const [reviewBlockers, setReviewBlockers] = useState(
    savedWeeklyReview?.blockers ?? "",
  )
  const [reviewDecisions, setReviewDecisions] = useState(
    savedWeeklyReview?.decisions ?? "",
  )
  const [reviewNextWeek, setReviewNextWeek] = useState(
    savedWeeklyReview?.nextWeek ?? "",
  )

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

  const workTasks = useMemo<WorkTaskRef[]>(
    () => workProjects.flatMap((project) => getProjectOpenTasks(project)),
    [workProjects],
  )

  const allWorkTasks = useMemo<WorkTaskRef[]>(
    () =>
      workProjects.flatMap((project) =>
        project.groups.flatMap((group) =>
          group.tasks.map((task) => ({
            projectId: project.id,
            projectTitle: project.title,
            groupId: group.id,
            groupTitle: group.title,
            task,
          })),
        ),
      ),
    [workProjects],
  )

  const activeTasks = workTasks
  const wipLimit = state.settings.workWipLimit ?? 4
  const inProgressTasks = activeTasks.filter(
    (item) => getTaskStatus(item.task) === "in_progress",
  )
  const wipOverBy = Math.max(0, inProgressTasks.length - wipLimit)

  const focusEligibleTasks = activeTasks.filter((item) => {
    const status = getTaskStatus(item.task)
    const deferredFuture =
      item.task.deferredUntil !== undefined && item.task.deferredUntil > todayISO
    return (
      !deferredFuture &&
      (status === "planned" || status === "in_progress" || status === "control")
    )
  })

  const focusIds = state.settings.dailyFocus?.[todayISO] ?? []
  const focusTasks = focusIds
    .map((id) => focusEligibleTasks.find((item) => item.task.id === id))
    .filter((item): item is WorkTaskRef => Boolean(item))
    .slice(0, 3)

  const activeFocusIds = focusTasks.map((item) => item.task.id)
  const focusCandidates = focusEligibleTasks.filter(
    (item) => !activeFocusIds.includes(item.task.id),
  )
  const inboxItems = state.settings.workInbox ?? []
  const dayClosure = state.settings.workDayClosures?.[todayISO]

  const overdue = activeTasks.filter(
    (item) => item.task.deadline && item.task.deadline < todayISO,
  ).length

  const dueControlTasks = activeTasks.filter((item) => {
    const status = getTaskStatus(item.task)
    return (
      CONTROL_STATUSES.has(status) &&
      item.task.followUpDate !== undefined &&
      item.task.followUpDate <= todayISO
    )
  })

  const deferredFutureTasks = activeTasks.filter(
    (item) =>
      getTaskStatus(item.task) === "planned" &&
      item.task.deferredUntil !== undefined &&
      item.task.deferredUntil > todayISO,
  )

  const deferredDueTasks = activeTasks.filter(
    (item) =>
      item.task.deferredUntil !== undefined &&
      item.task.deferredUntil <= todayISO,
  )

  const todayTaskIds = new Set<string>(activeFocusIds)
  for (const item of activeTasks) {
    if (item.task.deadline && item.task.deadline <= todayISO) {
      todayTaskIds.add(item.task.id)
    }
  }
  for (const item of dueControlTasks) todayTaskIds.add(item.task.id)
  for (const item of deferredDueTasks) todayTaskIds.add(item.task.id)

  const todayQueue = activeTasks
    .filter((item) => todayTaskIds.has(item.task.id))
    .sort((a, b) => {
      const aFocus = activeFocusIds.indexOf(a.task.id)
      const bFocus = activeFocusIds.indexOf(b.task.id)
      if (aFocus >= 0 || bFocus >= 0) {
        if (aFocus < 0) return 1
        if (bFocus < 0) return -1
        return aFocus - bFocus
      }
      return (a.task.deadline ?? "9999-99-99").localeCompare(
        b.task.deadline ?? "9999-99-99",
      )
    })

  const staleInProgress = inProgressTasks.filter((item) => {
    const since = dateOnly(item.task.statusChangedAt ?? item.task.updatedAt)
    return since ? daysBetween(since, todayISO) >= 3 : false
  })

  const projectsWithoutNextAction = activeWorkProjects.filter((project) => {
    const openTasks = getProjectOpenTasks(project)
    return openTasks.length > 0 && !openTasks.some((item) => item.task.isNextAction)
  })

  const completedThisWeek = allWorkTasks.filter((item) => {
    const completed = dateOnly(item.task.completedAt)
    return completed !== undefined && completed >= weekStartISO && completed <= weekEndISO
  })

  const delegatedTasks = activeTasks.filter(
    (item) => getTaskStatus(item.task) === "delegated",
  )

  const deferReasonCounts = deferredFutureTasks.reduce<
    Partial<Record<TaskDeferReason, number>>
  >((acc, item) => {
    const reason = item.task.deferReason
    if (reason) acc[reason] = (acc[reason] ?? 0) + 1
    return acc
  }, {})
  const deferReasonSummary = TASK_DEFER_REASON_OPTIONS
    .map((option) => ({
      label: option.label,
      count: deferReasonCounts[option.value] ?? 0,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)

  const operationalTasks = activeTasks.filter(
    (item) =>
      !(
        getTaskStatus(item.task) === "planned" &&
        item.task.deferredUntil !== undefined &&
        item.task.deferredUntil > todayISO
      ),
  )

  const statusSections: Array<{ status: TaskStatus; title: string }> = [
    { status: "in_progress", title: "В работе" },
    { status: "control", title: "На контроле" },
    { status: "waiting", title: "Жду ответ" },
    { status: "delegated", title: "Делегировано" },
    { status: "planned", title: "Запланировано" },
  ]

  const updateSettings = (patch: Partial<typeof state.settings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { patch } })
  }

  const updateTask = (item: WorkTaskRef, patch: Partial<Task>) => {
    dispatch({
      type: "UPDATE_TASK",
      payload: {
        projectId: item.projectId,
        groupId: item.groupId,
        taskId: item.task.id,
        patch,
      },
    })
  }

  const changeTaskStatus = (item: WorkTaskRef, status: TaskStatus) => {
    const currentStatus = getTaskStatus(item.task)
    if (
      status === "in_progress" &&
      currentStatus !== "in_progress" &&
      inProgressTasks.length >= wipLimit
    ) {
      toast.warning(
        `WIP-лимит ${wipLimit} уже достигнут. Заверши или выведи из работы одну из текущих задач.`,
      )
      return
    }

    updateTask(item, { status })

    if (status === "delegated" && !item.task.followUpDate) {
      toast.info("Для делегированной задачи задай дату контроля.")
    }

    if (status === "done" && activeFocusIds.includes(item.task.id)) {
      setFocus(activeFocusIds.filter((id) => id !== item.task.id))
    }
  }

  const addInboxItem = () => {
    const title = inboxTitle.trim()
    if (!title) return
    const item: WorkInboxItem = {
      id: makeId(),
      title,
      createdAt: new Date().toISOString(),
    }
    updateSettings({ workInbox: [item, ...inboxItems] })
    setInboxTitle("")
  }

  const removeInboxItem = (id: string) => {
    updateSettings({ workInbox: inboxItems.filter((item) => item.id !== id) })
  }

  const convertInboxItem = (item: WorkInboxItem) => {
    const target = inboxTargets[item.id]
    if (!target) return
    const [projectId, groupId] = target.split("::")
    if (!projectId || !groupId) return

    dispatch({
      type: "ADD_TASK",
      payload: {
        projectId,
        groupId,
        title: item.title,
        status: "planned",
      },
    })
    removeInboxItem(item.id)
  }

  const setFocus = (nextIds: string[]) => {
    updateSettings({
      dailyFocus: {
        ...(state.settings.dailyFocus ?? {}),
        [todayISO]: [...new Set(nextIds)].slice(0, 3),
      },
    })
  }

  const toggleFocus = (taskId: string) => {
    if (activeFocusIds.includes(taskId)) {
      setFocus(activeFocusIds.filter((id) => id !== taskId))
      return
    }
    if (activeFocusIds.length >= 3) {
      toast.warning("На день можно выбрать не больше трёх результатов.")
      return
    }
    setFocus([...activeFocusIds, taskId])
  }

  const addSelectedFocus = () => {
    if (!focusCandidate || activeFocusIds.length >= 3) return
    toggleFocus(focusCandidate)
    setFocusCandidate("")
  }

  const isNextActionEligible = (item: WorkTaskRef) => {
    const status = getTaskStatus(item.task)
    const deferredFuture =
      item.task.deferredUntil !== undefined && item.task.deferredUntil > todayISO
    return (
      !deferredFuture &&
      status !== "waiting" &&
      status !== "delegated" &&
      status !== "done"
    )
  }

  const setProjectNextAction = (projectId: string, taskId: string) => {
    const projectTasks = activeTasks.filter((item) => item.projectId === projectId)
    const current = projectTasks.find((item) => item.task.isNextAction)

    if (current && current.task.id !== taskId) {
      updateTask(current, { isNextAction: false })
    }

    const next = projectTasks.find((item) => item.task.id === taskId)
    if (next && isNextActionEligible(next)) {
      updateTask(next, { isNextAction: true })
    }
  }

  const toggleNextAction = (item: WorkTaskRef) => {
    if (item.task.isNextAction) {
      updateTask(item, { isNextAction: false })
      return
    }
    if (!isNextActionEligible(item)) {
      toast.info("Следующий шаг должен быть задачей, которую можно выполнять сейчас.")
      return
    }
    setProjectNextAction(item.projectId, item.task.id)
  }

  const closeDay = () => {
    updateSettings({
      workDayClosures: {
        ...(state.settings.workDayClosures ?? {}),
        [todayISO]: {
          closedAt: new Date().toISOString(),
          ...(closureNote.trim() ? { note: closureNote.trim() } : {}),
        },
      },
    })
  }

  const reopenDay = () => {
    const next = { ...(state.settings.workDayClosures ?? {}) }
    delete next[todayISO]
    updateSettings({ workDayClosures: next })
  }

  const saveWeeklyReview = () => {
    const review: WorkWeeklyReview = {
      reviewedAt: new Date().toISOString(),
      ...(reviewWins.trim() ? { wins: reviewWins.trim() } : {}),
      ...(reviewBlockers.trim() ? { blockers: reviewBlockers.trim() } : {}),
      ...(reviewDecisions.trim() ? { decisions: reviewDecisions.trim() } : {}),
      ...(reviewNextWeek.trim() ? { nextWeek: reviewNextWeek.trim() } : {}),
    }
    updateSettings({
      workWeeklyReviews: {
        ...(state.settings.workWeeklyReviews ?? {}),
        [weekStartISO]: review,
      },
    })
    toast.success("Недельный обзор сохранён")
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <BriefcaseBusiness className="size-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Рабочий контур
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Центр управления работой
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Сегодня, текущая работа, ожидания, делегирование и контроль в одном месте.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">{activeTasks.length}</p>
            <p className="text-[10px] text-slate-500">активных</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">{overdue}</p>
            <p className="text-[10px] text-slate-500">просрочено</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">{dueControlTasks.length}</p>
            <p className="text-[10px] text-slate-500">контроль</p>
          </div>
          <div
            className={
              wipOverBy > 0
                ? "rounded-2xl border border-amber-300 bg-amber-50 px-3 py-2.5 text-center dark:border-amber-500/30 dark:bg-amber-500/10"
                : "rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900"
            }
          >
            <p className="text-lg font-semibold text-slate-950 dark:text-white">
              {inProgressTasks.length}/{wipLimit}
            </p>
            <p className="text-[10px] text-slate-500">WIP</p>
          </div>
        </div>
      </header>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[24px] border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/5 sm:p-5">
          <div className="flex items-center gap-2">
            <CalendarRange className="size-5 text-blue-600 dark:text-blue-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950 dark:text-white">Сегодня</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Фокус + дедлайны + наступивший контроль + отложенное, которое вернулось.
              </p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
              {todayQueue.length}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {todayQueue.length === 0 ? (
              <p className="rounded-xl border border-dashed border-blue-200 p-3 text-sm text-slate-500 dark:border-blue-500/20 dark:text-slate-400">
                На сегодня нет задач, требующих немедленного внимания.
              </p>
            ) : (
              todayQueue.map((item) => {
                const status = getTaskStatus(item.task)
                return (
                  <div
                    key={item.task.id}
                    className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900 sm:flex-row sm:items-center"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
                        {item.task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] text-slate-500">
                        <span>{item.projectTitle}</span>
                        <span>·</span>
                        <span>{getTaskStatusLabel(item.task)}</span>
                        {activeFocusIds.includes(item.task.id) ? (
                          <span className="rounded-full bg-blue-50 px-1.5 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                            Фокус
                          </span>
                        ) : null}
                        {item.task.followUpDate && item.task.followUpDate <= todayISO ? (
                          <span className="rounded-full bg-amber-50 px-1.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                            Контроль
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      {status !== "in_progress" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => changeTaskStatus(item, "in_progress")}
                        >
                          <ArrowRight className="size-3.5" aria-hidden />
                          В работу
                        </Button>
                      ) : null}
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => changeTaskStatus(item, "done")}
                      >
                        Готово
                      </Button>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div
          className={
            wipOverBy > 0 || projectsWithoutNextAction.length > 0 || staleInProgress.length > 0
              ? "rounded-[24px] border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/5 sm:p-5"
              : "rounded-[24px] border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-500/20 dark:bg-emerald-500/5 sm:p-5"
          }
        >
          <div className="flex items-center gap-2">
            <Gauge className="size-5 text-slate-600 dark:text-slate-300" aria-hidden />
            <div>
              <h2 className="font-semibold text-slate-950 dark:text-white">Нагрузка</h2>
              <p className="text-xs text-slate-500">Сигналы, что система начинает перегружаться.</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
              <p className="text-lg font-semibold">{inProgressTasks.length}</p>
              <p className="text-[10px] text-slate-500">в работе</p>
            </div>
            <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
              <p className="text-lg font-semibold">{staleInProgress.length}</p>
              <p className="text-[10px] text-slate-500">зависли 3+ дня</p>
            </div>
            <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
              <p className="text-lg font-semibold">{projectsWithoutNextAction.length}</p>
              <p className="text-[10px] text-slate-500">без след. шага</p>
            </div>
            <div className="rounded-xl bg-white p-3 dark:bg-slate-900">
              <p className="text-lg font-semibold">{inboxItems.length}</p>
              <p className="text-[10px] text-slate-500">не разобрано</p>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-slate-500">WIP-лимит</span>
            <Input
              type="number"
              min={1}
              max={12}
              value={wipLimit}
              onChange={(event) => {
                const value = Number(event.target.value)
                if (!Number.isFinite(value)) return
                updateSettings({
                  workWipLimit: Math.max(1, Math.min(12, Math.round(value))),
                })
              }}
              className="h-8 w-20"
            />
          </div>

          {wipOverBy > 0 ? (
            <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
              Лимит превышен на {wipOverBy}. Новые задачи в «В работе» блокируются.
            </p>
          ) : null}
        </div>
      </section>

      <section className="rounded-[24px] border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/5 sm:p-5">
        <div className="flex items-center gap-2">
          <ListChecks className="size-5 text-blue-600 dark:text-blue-400" aria-hidden />
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">3 результата дня</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Не больше трёх задач, которые действительно должны сдвинуть день.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {focusTasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-blue-200 p-3 text-sm text-slate-500 dark:border-blue-500/20 dark:text-slate-400">
              Фокус на сегодня ещё не выбран.
            </p>
          ) : (
            focusTasks.map((item, index) => (
              <div
                key={item.task.id}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
                    {item.task.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">{item.projectTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFocus(item.task.id)}
                  className="text-xs font-medium text-slate-400 hover:text-red-500"
                >
                  убрать
                </button>
              </div>
            ))
          )}
        </div>

        {focusTasks.length < 3 && focusCandidates.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={focusCandidate}
              onChange={(event) => setFocusCandidate(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-xl border border-blue-200 bg-white px-3 text-sm text-slate-800 dark:border-blue-500/20 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Выбрать задачу…</option>
              {focusCandidates.map((item) => (
                <option key={item.task.id} value={item.task.id}>
                  {item.projectTitle} — {item.task.title}
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={addSelectedFocus}
              disabled={!focusCandidate}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Добавить в фокус
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center gap-2">
          <Star className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-950 dark:text-white">Следующий шаг проектов</h2>
            <p className="text-xs text-slate-500">
              У каждого активного рабочего проекта должен быть один понятный следующий ход.
            </p>
          </div>
          {projectsWithoutNextAction.length > 0 ? (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
              без шага: {projectsWithoutNextAction.length}
            </span>
          ) : null}
        </div>

        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {activeWorkProjects.map((project) => {
            const openTasks = getProjectOpenTasks(project)
            const actionableTasks = openTasks.filter(isNextActionEligible)
            const current = actionableTasks.find((item) => item.task.isNextAction)
            return (
              <div
                key={project.id}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {project.title}
                </p>
                {actionableTasks.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Нет задачи, которую можно назначить следующим шагом.
                  </p>
                ) : (
                  <select
                    value={current?.task.id ?? ""}
                    onChange={(event) => {
                      if (!event.target.value) {
                        if (current) updateTask(current, { isNextAction: false })
                        return
                      }
                      setProjectNextAction(project.id, event.target.value)
                    }}
                    className="mt-2 h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Не выбран</option>
                    {actionableTasks.map((item) => (
                      <option key={item.task.id} value={item.task.id}>
                        {item.task.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center gap-2">
          <Inbox className="size-5 text-slate-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-950 dark:text-white">Inbox</h2>
            <p className="text-xs text-slate-500">Сначала зафиксировать, потом разобрать.</p>
          </div>
          {inboxItems.length > 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800">
              {inboxItems.length}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <Input
            value={inboxTitle}
            onChange={(event) => setInboxTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addInboxItem()
            }}
            placeholder="Например: проверить зависшие возвраты"
            className="min-w-0 flex-1"
          />
          <Button type="button" onClick={addInboxItem} disabled={!inboxTitle.trim()}>
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Добавить</span>
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {inboxItems.length === 0 ? (
            <p className="text-sm text-slate-400">Входящих нет.</p>
          ) : (
            inboxItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.title}
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <select
                    value={inboxTargets[item.id] ?? ""}
                    onChange={(event) =>
                      setInboxTargets((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Выбрать проект и этап…</option>
                    {workProjects.flatMap((project) =>
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
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => convertInboxItem(item)}
                    disabled={!inboxTargets[item.id]}
                  >
                    <Send className="size-3.5" aria-hidden />
                    В задачу
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeInboxItem(item.id)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {deferredFutureTasks.length > 0 ? (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Отложено</h2>
              <p className="text-xs text-slate-500">
                Эти задачи не участвуют в текущем фокусе до назначенной даты.
              </p>
            </div>
            <span className="text-xs text-slate-400">{deferredFutureTasks.length}</span>
          </div>
          <div className="grid gap-2.5 xl:grid-cols-2">
            {deferredFutureTasks.map((item) => (
              <TaskRow
                key={item.task.id}
                item={item}
                todayISO={todayISO}
                focused={activeFocusIds.includes(item.task.id)}
                onStatusChange={(status) => changeTaskStatus(item, status)}
                onFollowUpChange={(followUpDate) => updateTask(item, { followUpDate })}
                onAssigneeChange={(assignee) => updateTask(item, { assignee })}
                onToggleFocus={() => toggleFocus(item.task.id)}
                onSetNextAction={() => toggleNextAction(item)}
                onDeferredChange={(deferredUntil) => {
                  updateTask(item, {
                    deferredUntil,
                    ...(deferredUntil && deferredUntil > todayISO
                      ? { isNextAction: false }
                      : {}),
                  })
                  if (
                    deferredUntil &&
                    deferredUntil > todayISO &&
                    activeFocusIds.includes(item.task.id)
                  ) {
                    setFocus(activeFocusIds.filter((id) => id !== item.task.id))
                  }
                }}
                onDeferReasonChange={(deferReason) =>
                  updateTask(item, { deferReason })
                }
                onDeferNoteChange={(deferNote) =>
                  updateTask(item, { deferNote })
                }
                onDelegationNoteChange={(delegationNote) =>
                  updateTask(item, { delegationNote })
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Рабочий поток</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Ожидания и делегирование остаются в системе, но возвращаются в оперативное внимание по дате контроля.
          </p>
        </div>

        {workProjects.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">
            Рабочих проектов пока нет. Создай проект и выбери для него контекст «Работа».
          </div>
        ) : (
          statusSections.map((section) => {
            const items = operationalTasks.filter(
              (item) => getTaskStatus(item.task) === section.status,
            )
            if (items.length === 0) return null
            return (
              <div key={section.status} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {section.title}
                  </h3>
                  <span className="text-xs text-slate-400">{items.length}</span>
                </div>
                <div className="grid gap-2.5 xl:grid-cols-2">
                  {items.map((item) => (
                    <TaskRow
                      key={item.task.id}
                      item={item}
                      todayISO={todayISO}
                      focused={activeFocusIds.includes(item.task.id)}
                      onStatusChange={(status) => changeTaskStatus(item, status)}
                      onFollowUpChange={(followUpDate) =>
                        updateTask(item, { followUpDate })
                      }
                      onAssigneeChange={(assignee) => updateTask(item, { assignee })}
                      onToggleFocus={() => toggleFocus(item.task.id)}
                      onSetNextAction={() => toggleNextAction(item)}
                      onDeferredChange={(deferredUntil) =>
                        updateTask(item, { deferredUntil })
                      }
                      onDeferReasonChange={(deferReason) =>
                        updateTask(item, { deferReason })
                      }
                      onDelegationNoteChange={(delegationNote) =>
                        updateTask(item, { delegationNote })
                      }
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">Недельный обзор</h2>
            <p className="text-xs text-slate-500">
              {formatShortDate(weekStartISO)} — {formatShortDate(weekEndISO)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
            <p className="text-lg font-semibold">{completedThisWeek.length}</p>
            <p className="text-[10px] text-slate-500">завершено</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
            <p className="text-lg font-semibold">{delegatedTasks.length}</p>
            <p className="text-[10px] text-slate-500">делегировано</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
            <p className="text-lg font-semibold">{deferredFutureTasks.length}</p>
            <p className="text-[10px] text-slate-500">отложено</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
            <p className="text-lg font-semibold">{overdue}</p>
            <p className="text-[10px] text-slate-500">просрочено</p>
          </div>
        </div>

        {deferReasonSummary.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-slate-500">Причины переносов:</span>
            {deferReasonSummary.map((item) => (
              <span
                key={item.label}
                className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                {item.label}: {item.count}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Textarea
            value={reviewWins}
            onChange={(event) => setReviewWins(event.target.value)}
            rows={3}
            placeholder="Что реально продвинулось / основные результаты недели"
          />
          <Textarea
            value={reviewBlockers}
            onChange={(event) => setReviewBlockers(event.target.value)}
            rows={3}
            placeholder="Что мешало / где зависли"
          />
          <Textarea
            value={reviewDecisions}
            onChange={(event) => setReviewDecisions(event.target.value)}
            rows={3}
            placeholder="Какие решения приняты"
          />
          <Textarea
            value={reviewNextWeek}
            onChange={(event) => setReviewNextWeek(event.target.value)}
            rows={3}
            placeholder="Фокус следующей недели"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button type="button" onClick={saveWeeklyReview}>
            <CheckCircle2 className="size-4" aria-hidden />
            Сохранить обзор
          </Button>
          {savedWeeklyReview ? (
            <span className="text-xs text-emerald-600 dark:text-emerald-400">
              Обзор этой недели уже сохранён
            </span>
          ) : null}
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center gap-2">
          {dayClosure ? (
            <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
          ) : (
            <Clock3 className="size-5 text-slate-500" aria-hidden />
          )}
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">
              Закрытие рабочего дня
            </h2>
            <p className="text-xs text-slate-500">
              Зафиксируй хвосты и оставь работу внутри системы, а не в голове.
            </p>
          </div>
        </div>

        {dayClosure ? (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Рабочий день закрыт
            </p>
            {dayClosure.note ? (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {dayClosure.note}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={reopenDay}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Открыть снова
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Textarea
              value={closureNote}
              onChange={(event) => setClosureNote(event.target.value)}
              placeholder="Например: жду ответ по поставщику; завтра первым делом проверить РЦ 780."
              rows={3}
            />
            <Button type="button" onClick={closeDay}>
              <CheckCircle2 className="size-4" aria-hidden />
              Закрыть рабочий день
            </Button>
          </div>
        )}
      </section>

      {(staleInProgress.length > 0 ||
        projectsWithoutNextAction.length > 0 ||
        dueControlTasks.length > 0) ? (
        <section className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/5 sm:p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" aria-hidden />
            <h2 className="font-semibold text-slate-950 dark:text-white">
              Требует внимания
            </h2>
          </div>
          <div className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300">
            {staleInProgress.length > 0 ? (
              <p>В работе без смены статуса 3+ дня: {staleInProgress.length}.</p>
            ) : null}
            {projectsWithoutNextAction.length > 0 ? (
              <p>Активных проектов без следующего шага: {projectsWithoutNextAction.length}.</p>
            ) : null}
            {dueControlTasks.length > 0 ? (
              <p>Задач, у которых наступила дата контроля: {dueControlTasks.length}.</p>
            ) : null}
          </div>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <UserRound className="size-3.5" aria-hidden />
          Делегированное не занимает WIP, но возвращается по дате контроля.
        </span>
        <span className="inline-flex items-center gap-1">
          <Gauge className="size-3.5" aria-hidden />
          WIP ограничивает только задачи со статусом «В работе».
        </span>
      </div>
    </div>
  )
}
