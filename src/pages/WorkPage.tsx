import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { format, startOfWeek } from "date-fns"
import { ru } from "date-fns/locale"
import {
  AlertTriangle,
  ArrowRight,
  BriefcaseBusiness,
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

function offsetISO(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`)
  date.setDate(date.getDate() + days)
  return format(date, "yyyy-MM-dd")
}

function priorityWeight(priority?: Task["priority"]): number {
  if (priority === "high") return 3
  if (priority === "medium") return 2
  return 1
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
                Следующая задача проекта
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
            title="Назначить следующей задачей проекта"
            aria-label="Назначить следующей задачей проекта"
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
  const [inboxDeadlines, setInboxDeadlines] = useState<Record<string, string>>({})
  const [inboxPriorities, setInboxPriorities] = useState<Record<string, Task["priority"]>>({})

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
  const focusCandidates = focusEligibleTasks
    .filter((item) => !activeFocusIds.includes(item.task.id))
    .sort((a, b) => {
      if (a.task.isNextAction !== b.task.isNextAction) {
        return a.task.isNextAction ? -1 : 1
      }
      const priorityDelta =
        priorityWeight(b.task.priority) - priorityWeight(a.task.priority)
      if (priorityDelta !== 0) return priorityDelta
      return (a.task.deadline ?? "9999-99-99").localeCompare(
        b.task.deadline ?? "9999-99-99",
      )
    })
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

  const dueTodayTasks = activeTasks.filter(
    (item) => item.task.deadline === todayISO,
  )

  const attentionIds = new Set<string>([
    ...activeTasks
      .filter((item) => item.task.deadline && item.task.deadline < todayISO)
      .map((item) => item.task.id),
    ...dueTodayTasks.map((item) => item.task.id),
    ...dueControlTasks.map((item) => item.task.id),
    ...deferredDueTasks.map((item) => item.task.id),
  ])

  const attentionTasks = activeTasks
    .filter((item) => attentionIds.has(item.task.id))
    .sort((a, b) => {
      const deadlineDelta = (a.task.deadline ?? "9999-99-99").localeCompare(
        b.task.deadline ?? "9999-99-99",
      )
      if (deadlineDelta !== 0) return deadlineDelta
      return priorityWeight(b.task.priority) - priorityWeight(a.task.priority)
    })

  const controlLaneTasks = activeTasks
    .filter((item) => CONTROL_STATUSES.has(getTaskStatus(item.task)))
    .sort((a, b) =>
      (a.task.followUpDate ?? "9999-99-99").localeCompare(
        b.task.followUpDate ?? "9999-99-99",
      ),
    )

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
    setInboxTargets((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    setInboxDeadlines((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    setInboxPriorities((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const convertInboxItem = (item: WorkInboxItem, deadlineOverride?: string) => {
    const target = inboxTargets[item.id]
    if (!target) {
      toast.info("Сначала выбери проект и этап.")
      return
    }
    const [projectId, groupId] = target.split("::")
    if (!projectId || !groupId) return

    dispatch({
      type: "ADD_TASK",
      payload: {
        projectId,
        groupId,
        title: item.title,
        status: "planned",
        priority: inboxPriorities[item.id] ?? "medium",
        deadline: (deadlineOverride ?? inboxDeadlines[item.id]) || undefined,
      },
    })
    removeInboxItem(item.id)
    toast.success("Входящее превращено в задачу")
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

  const moveFocus = (taskId: string, direction: -1 | 1) => {
    const index = activeFocusIds.indexOf(taskId)
    if (index < 0) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= activeFocusIds.length) return
    const next = [...activeFocusIds]
    ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
    setFocus(next)
  }

  const startFirstFocusTask = () => {
    const first = focusTasks[0]
    if (!first) {
      toast.info("Сначала добавь задачу в план дня.")
      return
    }
    changeTaskStatus(first, "in_progress")
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
      toast.info("Следующей задачей проекта можно назначить только задачу, которую можно выполнять сейчас.")
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
          <div className="rounded-2xl border border-blue-200 bg-blue-50/70 px-3 py-2.5 text-center dark:border-blue-500/20 dark:bg-blue-500/10">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">{focusTasks.length}/3</p>
            <p className="text-[10px] text-slate-500">план дня</p>
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
            <p className="text-[10px] text-slate-500">в работе</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">{controlLaneTasks.length}</p>
            <p className="text-[10px] text-slate-500">жду / контроль</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">{overdue}</p>
            <p className="text-[10px] text-slate-500">просрочено</p>
          </div>
        </div>
      </header>

      <section
        id="work-inbox"
        className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5"
      >
        <div className="flex items-center gap-2">
          <Inbox className="size-5 text-slate-600 dark:text-slate-300" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-950 dark:text-white">Inbox</h2>
            <p className="text-xs text-slate-500">
              Быстро зафиксируй входящее. Разобрать по проектам можно сразу или позже.
            </p>
          </div>
          {inboxItems.length > 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
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
            placeholder="Быстро записать задачу, запрос или идею…"
            className="min-w-0 flex-1"
          />
          <Button type="button" onClick={addInboxItem} disabled={!inboxTitle.trim()}>
            <Plus className="size-4" aria-hidden />
            Добавить
          </Button>
        </div>

        {inboxItems.length > 0 ? (
          <details className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40">
            <summary className="cursor-pointer px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300">
              Разобрать входящие · {inboxItems.length}
            </summary>
            <div className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-800">
              {inboxItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    {format(new Date(item.createdAt), "d MMM, HH:mm", { locale: ru })}
                  </p>
                  <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(220px,1fr)_120px_150px_auto]">
                    <select
                      value={inboxTargets[item.id] ?? ""}
                      onChange={(event) =>
                        setInboxTargets((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      className="h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">Проект и этап…</option>
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
                    <select
                      value={inboxPriorities[item.id] ?? "medium"}
                      onChange={(event) =>
                        setInboxPriorities((current) => ({
                          ...current,
                          [item.id]: event.target.value as Task["priority"],
                        }))
                      }
                      className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                      aria-label="Приоритет"
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
                      className="h-9 text-xs"
                      aria-label="Дедлайн"
                    />
                    <div className="flex gap-1.5">
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
                        variant="outline"
                        onClick={() => convertInboxItem(item, offsetISO(todayISO, 1))}
                        disabled={!inboxTargets[item.id]}
                      >
                        Завтра
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
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[24px] border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/5 sm:p-5">
          <div className="flex items-center gap-2">
            <ListChecks className="size-5 text-blue-600 dark:text-blue-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950 dark:text-white">План дня</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                До трёх результатов в явном порядке. Первая задача — главный фокус.
              </p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300">
              {focusTasks.length}/3
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {focusTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-blue-200 p-4 text-sm text-slate-500 dark:border-blue-500/20 dark:text-slate-400">
                План дня пока пуст. Выбери первую задачу ниже — она станет главным фокусом.
              </div>
            ) : (
              focusTasks.map((item, index) => (
                <div
                  key={item.task.id}
                  className={
                    index === 0
                      ? "flex items-center gap-3 rounded-xl border border-blue-200 bg-white p-3 shadow-sm dark:border-blue-500/20 dark:bg-slate-900"
                      : "flex items-center gap-3 rounded-xl bg-white/80 p-3 dark:bg-slate-900"
                  }
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {index === 0 ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                          Главный фокус
                        </span>
                      ) : null}
                      {item.task.deadline ? (
                        <span className="text-[10px] text-slate-400">
                          дедлайн {formatShortDate(item.task.deadline)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 truncate text-sm font-semibold text-slate-950 dark:text-white">
                      {item.task.title}
                    </p>
                    <p className="truncate text-xs text-slate-500">{item.projectTitle}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveFocus(item.task.id, -1)}
                      disabled={index === 0}
                      className="flex size-8 items-center justify-center rounded-lg text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label="Поднять выше"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFocus(item.task.id, 1)}
                      disabled={index === focusTasks.length - 1}
                      className="flex size-8 items-center justify-center rounded-lg text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-20 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      aria-label="Опустить ниже"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFocus(item.task.id)}
                      className="px-2 text-xs font-medium text-slate-400 hover:text-red-500"
                    >
                      убрать
                    </button>
                  </div>
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
                <option value="">Добавить задачу в план…</option>
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
                Добавить
              </Button>
            </div>
          ) : null}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-2">
            <Gauge className="size-5 text-slate-600 dark:text-slate-300" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950 dark:text-white">В работе сейчас</h2>
              <p className="text-xs text-slate-500">Только то, что реально начато.</p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {inProgressTasks.length}/{wipLimit}
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {inProgressTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-3 dark:border-slate-800">
                <p className="text-sm text-slate-500">Сейчас ничего не выполняется.</p>
                {focusTasks.length > 0 ? (
                  <Button type="button" size="sm" className="mt-3" onClick={startFirstFocusTask}>
                    <ArrowRight className="size-3.5" aria-hidden />
                    Начать №1
                  </Button>
                ) : null}
              </div>
            ) : (
              inProgressTasks.map((item) => (
                <div
                  key={item.task.id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {item.task.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.projectTitle}</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Button type="button" size="sm" onClick={() => changeTaskStatus(item, "done")}>
                      Готово
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => changeTaskStatus(item, "waiting")}
                    >
                      Жду
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => changeTaskStatus(item, "control")}
                    >
                      На контроль
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/60">
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
            <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
              WIP превышен на {wipOverBy}. Новые задачи в работу временно блокируются.
            </p>
          ) : null}
        </div>
      </section>

      {attentionTasks.length > 0 ? (
        <section className="rounded-[24px] border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-500/20 dark:bg-amber-500/5 sm:p-5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-amber-600" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950 dark:text-white">Требует реакции</h2>
              <p className="text-xs text-slate-500">
                Только исключения: дедлайн, просрочка, наступивший контроль или вернувшийся перенос.
              </p>
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-slate-900 dark:text-amber-300">
              {attentionTasks.length}
            </span>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-2">
            {attentionTasks.map((item) => {
              const status = getTaskStatus(item.task)
              return (
                <div
                  key={item.task.id}
                  className="rounded-xl border border-amber-200/80 bg-white p-3 dark:border-amber-500/20 dark:bg-slate-900"
                >
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {item.task.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">{item.projectTitle}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
                    {item.task.deadline && item.task.deadline < todayISO ? (
                      <span className="rounded-full bg-red-50 px-2 py-0.5 font-medium text-red-700 dark:bg-red-500/10 dark:text-red-300">
                        Просрочено
                      </span>
                    ) : item.task.deadline === todayISO ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                        Дедлайн сегодня
                      </span>
                    ) : null}
                    {CONTROL_STATUSES.has(status) &&
                    item.task.followUpDate &&
                    item.task.followUpDate <= todayISO ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                        Контроль
                      </span>
                    ) : null}
                    {item.task.deferredUntil && item.task.deferredUntil <= todayISO ? (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        Вернулась из переноса
                      </span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-2">
            <Clock3 className="size-5 text-slate-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950 dark:text-white">Жду / контроль</h2>
              <p className="text-xs text-slate-500">Не занимает текущий фокус, но не должно потеряться.</p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{controlLaneTasks.length}</span>
          </div>
          <div className="mt-4 space-y-2">
            {controlLaneTasks.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-200 p-3 text-sm text-slate-400 dark:border-slate-800">
                Ожиданий и задач на контроле нет.
              </p>
            ) : (
              controlLaneTasks.map((item) => (
                <div
                  key={item.task.id}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-950 dark:text-white">{item.task.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.projectTitle} · {getTaskStatusLabel(item.task)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right text-[10px] text-slate-400">
                    {item.task.assignee ? <p>{item.task.assignee}</p> : null}
                    {item.task.followUpDate ? (
                      <p>контроль {formatShortDate(item.task.followUpDate)}</p>
                    ) : (
                      <p className="text-amber-600">без даты</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <div className="flex items-center gap-2">
            <Star className="size-5 text-violet-600 dark:text-violet-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950 dark:text-white">Следующие задачи проектов</h2>
              <p className="text-xs text-slate-500">Куда двигается каждый активный проект дальше.</p>
            </div>
            {projectsWithoutNextAction.length > 0 ? (
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                без задачи: {projectsWithoutNextAction.length}
              </span>
            ) : null}
          </div>

          <div className="mt-4 space-y-2">
            {activeWorkProjects
              .map((project) => {
                const openTasks = getProjectOpenTasks(project)
                const current = openTasks.find(
                  (item) => item.task.isNextAction && isNextActionEligible(item),
                )
                return current ? { project, current } : null
              })
              .filter(
                (
                  item,
                ): item is {
                  project: Project
                  current: WorkTaskRef
                } => Boolean(item),
              )
              .map(({ project, current }) => (
                <div
                  key={project.id}
                  className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <p className="text-xs font-semibold text-slate-500">{project.title}</p>
                  <p className="mt-1 text-sm font-medium text-slate-950 dark:text-white">
                    → {current.task.title}
                  </p>
                </div>
              ))}
          </div>

          {activeWorkProjects.length > 0 ? (
            <details className="mt-3 rounded-xl border border-slate-200 dark:border-slate-800">
              <summary className="cursor-pointer px-3 py-2.5 text-xs font-medium text-slate-500">
                Изменить следующие задачи проектов
              </summary>
              <div className="grid gap-2 border-t border-slate-200 p-3 dark:border-slate-800">
                {activeWorkProjects.map((project) => {
                  const actionableTasks = getProjectOpenTasks(project).filter(isNextActionEligible)
                  const current = actionableTasks.find((item) => item.task.isNextAction)
                  return (
                    <div key={project.id}>
                      <p className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {project.title}
                      </p>
                      {actionableTasks.length === 0 ? (
                        <p className="text-xs text-slate-400">Нет доступной задачи.</p>
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
                          className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                        >
                          <option value="">Не выбрана</option>
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
            </details>
          ) : null}
        </div>
      </section>

      <details className="rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <summary className="cursor-pointer list-none p-4 sm:p-5">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="size-5 text-slate-500" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-slate-950 dark:text-white">Все рабочие задачи</h2>
              <p className="text-xs text-slate-500">
                Полный операционный список по статусам. Открывай, когда нужно разбирать детали.
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-400">{activeTasks.length}</span>
          </div>
        </summary>
        <div className="space-y-5 border-t border-slate-200 p-4 dark:border-slate-800 sm:p-5">
          {deferredFutureTasks.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Отложено</h3>
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
                    onDeferReasonChange={(deferReason) => updateTask(item, { deferReason })}
                    onDeferNoteChange={(deferNote) => updateTask(item, { deferNote })}
                    onDelegationNoteChange={(delegationNote) =>
                      updateTask(item, { delegationNote })
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          {workProjects.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">
              Рабочих проектов пока нет.
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
                        onFollowUpChange={(followUpDate) => updateTask(item, { followUpDate })}
                        onAssigneeChange={(assignee) => updateTask(item, { assignee })}
                        onToggleFocus={() => toggleFocus(item.task.id)}
                        onSetNextAction={() => toggleNextAction(item)}
                        onDeferredChange={(deferredUntil) => {
                          updateTask(item, {
                            deferredUntil,
                            ...(deferredUntil ? { isNextAction: false } : {}),
                          })
                          if (deferredUntil && activeFocusIds.includes(item.task.id)) {
                            setFocus(activeFocusIds.filter((id) => id !== item.task.id))
                          }
                        }}
                        onDeferReasonChange={(deferReason) => updateTask(item, { deferReason })}
                        onDeferNoteChange={(deferNote) => updateTask(item, { deferNote })}
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
        </div>
      </details>

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
