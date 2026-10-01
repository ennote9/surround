import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns"
import { ru } from "date-fns/locale"
import {
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Filter,
  GripVertical,
  LockKeyhole,
  RotateCcw,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { CalendarEventDialog } from "@/features/calendar/components/CalendarEventDialog"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import {
  ALL_GOALS_SCOPE,
  getScopedProjectsForSelectedGoal,
  getSelectedGoalTitle,
  normalizeSelectedGoalId,
} from "@/shared/lib/selectedGoal"
import { SELECTED_GOAL_STORAGE_KEY } from "@/shared/lib/storageKeys"
import {
  getTaskCalendarEvents,
  groupTaskCalendarEventsByDate,
  type TaskCalendarEvent,
} from "@/shared/lib/taskCalendar"
import { isTaskOverdue } from "@/shared/lib/taskSchedule"
import {
  getIncompleteTaskBlockers,
  getProjectTasks,
  getTaskById,
} from "@/shared/lib/taskDependencies"
import {
  getTaskStatus,
  projectMatchesWorkspaceMode,
  TASK_STATUS_OPTIONS,
} from "@/shared/lib/workManagement"
import { getTodayISO, toISODate } from "@/shared/lib/dates"
import { useAppState } from "@/store/useAppState"

type CalendarViewMode = "week" | "month"
type CalendarKindFilter = "all" | TaskCalendarEvent["kind"]
type CalendarBlockingFilter = "all" | "blocked" | "available"
type CalendarStatusFilter = "all" | NonNullable<TaskCalendarEvent["task"]["status"]>

const WEEKDAY_LABELS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

function capitalize(value: string): string {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value
}

function eventKindLabel(kind: TaskCalendarEvent["kind"]): string {
  return kind === "deadline" ? "Дедлайн" : "Контроль"
}

function taskHasCalendarRelations(event: TaskCalendarEvent): boolean {
  if (
    (event.task.blockedByTaskIds?.length ?? 0) > 0 ||
    event.task.completionNextTaskId
  ) {
    return true
  }

  return getProjectTasks(event.project).some(
    (task) =>
      task.id !== event.task.id &&
      (
        (task.blockedByTaskIds ?? []).includes(event.task.id) ||
        task.completionNextTaskId === event.task.id
      ),
  )
}

function CalendarEventCard({
  event,
  compact = false,
  onOpen,
  onDragStart,
}: {
  event: TaskCalendarEvent
  compact?: boolean
  onOpen: () => void
  onDragStart?: (event: React.DragEvent<HTMLButtonElement>) => void
}) {
  const overdue =
    event.kind === "deadline" && isTaskOverdue(event.task)
  const completed = event.task.completed
  const incompleteBlockers = getIncompleteTaskBlockers(
    event.project,
    event.task,
  )
  const successor = event.task.completionNextTaskId
    ? getTaskById(event.project, event.task.completionNextTaskId)
    : undefined

  return (
    <button
      type="button"
      draggable={Boolean(onDragStart)}
      onDragStart={onDragStart}
      onClick={onOpen}
      className={cn(
        "group w-full min-w-0 rounded-xl border text-left transition-colors",
        onDragStart && "cursor-grab active:cursor-grabbing",
        compact ? "px-2 py-1.5" : "px-3 py-2.5",
        overdue
          ? "border-red-200 bg-red-50/70 hover:bg-red-50 dark:border-red-500/20 dark:bg-red-500/5 dark:hover:bg-red-500/10"
          : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800/80",
        completed && "opacity-55",
      )}
      aria-label={`Открыть календарное событие: ${event.task.title}`}
    >
      <div className="flex min-w-0 items-start gap-2">
        <span
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg",
            event.kind === "deadline"
              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              : "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300",
          )}
        >
          {event.kind === "deadline" ? (
            <Flag className="size-3.5" aria-hidden />
          ) : (
            <Clock3 className="size-3.5" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-1.5">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5">
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-[0.08em]",
                  event.kind === "deadline"
                    ? "text-slate-500 dark:text-slate-400"
                    : "text-blue-600 dark:text-blue-300",
                )}
              >
                {eventKindLabel(event.kind)}
              </span>
              <span className="text-[10px] font-medium text-slate-400">
                {event.time ?? "Весь день"}
              </span>
            </div>
            {onDragStart ? (
              <GripVertical
                className="size-3.5 shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100 dark:text-slate-600"
                aria-hidden
              />
            ) : null}
          </div>

          <p
            className={cn(
              "mt-0.5 break-words font-medium leading-4 text-slate-900 dark:text-slate-100",
              compact ? "text-[11px]" : "text-xs",
              completed && "line-through",
            )}
          >
            {event.task.title}
          </p>

          {!compact ? (
            <p className="mt-1 truncate text-[11px] text-slate-400">
              {event.project.title} · {event.group.title}
            </p>
          ) : null}

          {!compact && (event.blocked || completed || successor) ? (
            <div className="mt-1.5 space-y-1">
              <div className="flex flex-wrap gap-1.5">
                {event.blocked ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    <LockKeyhole className="size-3" aria-hidden />
                    Заблокировано
                  </span>
                ) : null}
                {completed ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <CheckCircle2 className="size-3" aria-hidden />
                    Выполнено
                  </span>
                ) : null}
              </div>

              {incompleteBlockers.length > 0 ? (
                <p className="truncate text-[10px] text-amber-700 dark:text-amber-400">
                  Ждёт: {incompleteBlockers.map((task) => task.title).join(", ")}
                </p>
              ) : null}
              {successor ? (
                <p className="truncate text-[10px] text-blue-600 dark:text-blue-300">
                  После выполнения → {successor.title}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function EmptyDay() {
  return (
    <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
      Событий нет
    </p>
  )
}

export default function CalendarPage() {
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<CalendarViewMode>("week")
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(getTodayISO())
  const [kindFilter, setKindFilter] =
    useState<CalendarKindFilter>("all")
  const [statusFilter, setStatusFilter] =
    useState<CalendarStatusFilter>("all")
  const [blockingFilter, setBlockingFilter] =
    useState<CalendarBlockingFilter>("all")
  const [projectFilter, setProjectFilter] = useState("all")
  const [editingEvent, setEditingEvent] =
    useState<TaskCalendarEvent | null>(null)

  const [rawSelectedGoalId] = useLocalStorage(
    SELECTED_GOAL_STORAGE_KEY,
    ALL_GOALS_SCOPE,
  )
  const selectedGoalId = normalizeSelectedGoalId(
    rawSelectedGoalId,
    state.goals,
  )

  const scopedProjects = useMemo(() => {
    const goalScoped = getScopedProjectsForSelectedGoal(
      state.projects,
      selectedGoalId,
      state.goals,
    )

    return goalScoped.filter((project) =>
      projectMatchesWorkspaceMode(
        project,
        state.settings.workspaceMode ?? "all",
      ),
    )
  }, [
    selectedGoalId,
    state.goals,
    state.projects,
    state.settings.workspaceMode,
  ])

  const events = useMemo(
    () => getTaskCalendarEvents(scopedProjects),
    [scopedProjects],
  )
  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        if (kindFilter !== "all" && event.kind !== kindFilter) {
          return false
        }
        if (
          statusFilter !== "all" &&
          getTaskStatus(event.task) !== statusFilter
        ) {
          return false
        }
        if (
          blockingFilter === "blocked" &&
          !event.blocked
        ) {
          return false
        }
        if (
          blockingFilter === "available" &&
          event.blocked
        ) {
          return false
        }
        if (
          projectFilter !== "all" &&
          event.project.id !== projectFilter
        ) {
          return false
        }
        return true
      }),
    [
      blockingFilter,
      events,
      kindFilter,
      projectFilter,
      statusFilter,
    ],
  )
  const eventsByDate = useMemo(
    () => groupTaskCalendarEventsByDate(filteredEvents),
    [filteredEvents],
  )

  const weekStart = useMemo(
    () => startOfWeek(anchorDate, { weekStartsOn: 1 }),
    [anchorDate],
  )
  const weekEnd = useMemo(
    () => endOfWeek(anchorDate, { weekStartsOn: 1 }),
    [anchorDate],
  )
  const weekDays = useMemo(
    () => eachDayOfInterval({ start: weekStart, end: weekEnd }),
    [weekEnd, weekStart],
  )

  const monthStart = useMemo(() => startOfMonth(anchorDate), [anchorDate])
  const monthEnd = useMemo(() => endOfMonth(anchorDate), [anchorDate])
  const monthGridStart = useMemo(
    () => startOfWeek(monthStart, { weekStartsOn: 1 }),
    [monthStart],
  )
  const monthGridEnd = useMemo(
    () => endOfWeek(monthEnd, { weekStartsOn: 1 }),
    [monthEnd],
  )
  const monthDays = useMemo(
    () =>
      eachDayOfInterval({
        start: monthGridStart,
        end: monthGridEnd,
      }),
    [monthGridEnd, monthGridStart],
  )

  const visibleStart =
    viewMode === "week" ? toISODate(weekStart) : toISODate(monthStart)
  const visibleEnd =
    viewMode === "week" ? toISODate(weekEnd) : toISODate(monthEnd)
  const visibleEvents = filteredEvents.filter(
    (event) => event.date >= visibleStart && event.date <= visibleEnd,
  )

  const visibleDeadlines = visibleEvents.filter(
    (event) => event.kind === "deadline",
  ).length
  const visibleControls = visibleEvents.filter(
    (event) => event.kind === "control",
  ).length
  const exactTimeEvents = visibleEvents.filter((event) => event.time).length

  const periodTitle =
    viewMode === "week"
      ? `${format(weekStart, "d MMM", { locale: ru })} — ${format(
          weekEnd,
          "d MMM yyyy",
          { locale: ru },
        )}`
      : capitalize(format(anchorDate, "LLLL yyyy", { locale: ru }))

  const scopeTitle =
    selectedGoalId === ALL_GOALS_SCOPE
      ? "Все цели"
      : getSelectedGoalTitle(selectedGoalId, state.goals)

  const goPrevious = () => {
    setAnchorDate((current) =>
      viewMode === "week" ? subWeeks(current, 1) : subMonths(current, 1),
    )
  }

  const goNext = () => {
    setAnchorDate((current) =>
      viewMode === "week" ? addWeeks(current, 1) : addMonths(current, 1),
    )
  }

  const goToday = () => {
    const now = new Date()
    setAnchorDate(now)
    setSelectedDate(getTodayISO())
  }

  const openTask = (event: TaskCalendarEvent) => {
    navigate(
      `/projects?task=${encodeURIComponent(
        event.task.id,
      )}&project=${encodeURIComponent(event.project.id)}`,
    )
  }

  const updateEventSchedule = (
    event: TaskCalendarEvent,
    date?: string,
    time?: string,
    reason = "Изменено из календаря",
  ) => {
    const patch =
      event.kind === "deadline"
        ? {
            deadline: date,
            deadlineTime: date ? time : undefined,
            ...(date ? {} : { deadlineReminder: undefined }),
          }
        : {
            followUpDate: date,
            followUpTime: date ? time : undefined,
            ...(date ? {} : { followUpReminder: undefined }),
          }

    dispatch({
      type: "UPDATE_TASK",
      payload: {
        projectId: event.project.id,
        groupId: event.group.id,
        taskId: event.task.id,
        changeReason: reason,
        patch,
      },
    })

    toast.success(
      date
        ? `${eventKindLabel(event.kind)} обновлён`
        : `${eventKindLabel(event.kind)} удалён`,
    )
  }

  const moveEventToDate = (
    event: TaskCalendarEvent,
    nextDate: string,
  ) => {
    if (!nextDate || nextDate === event.date) return

    const risky =
      (event.kind === "deadline" && isTaskOverdue(event.task)) ||
      taskHasCalendarRelations(event)

    if (
      risky &&
      !window.confirm(
        `${eventKindLabel(event.kind)} будет перенесён с ${event.date} на ${nextDate}. Связи задачи сохранятся. Продолжить?`,
      )
    ) {
      return
    }

    updateEventSchedule(
      event,
      nextDate,
      event.time,
      `Перенос из календаря: ${eventKindLabel(event.kind)} ${event.date} → ${nextDate}`,
    )
  }

  const handleDropOnDate = (
    targetDate: string,
    dragEvent: React.DragEvent<HTMLElement>,
  ) => {
    dragEvent.preventDefault()
    const eventId = dragEvent.dataTransfer.getData(
      "application/x-life-calendar-event",
    )
    const event = events.find((item) => item.id === eventId)
    if (!event) return
    moveEventToDate(event, targetDate)
  }

  const startEventDrag = (
    event: TaskCalendarEvent,
    dragEvent: React.DragEvent<HTMLButtonElement>,
  ) => {
    dragEvent.dataTransfer.effectAllowed = "move"
    dragEvent.dataTransfer.setData(
      "application/x-life-calendar-event",
      event.id,
    )
  }

  const resetFilters = () => {
    setKindFilter("all")
    setStatusFilter("all")
    setBlockingFilter("all")
    setProjectFilter("all")
  }

  const monthPrefix = format(anchorDate, "yyyy-MM")
  const todayISO = getTodayISO()
  const effectiveSelectedDate = selectedDate.startsWith(monthPrefix)
    ? selectedDate
    : todayISO.startsWith(monthPrefix)
      ? todayISO
      : toISODate(monthStart)
  const selectedDateEvents = eventsByDate.get(effectiveSelectedDate) ?? []

  return (
    <div className="mx-auto min-w-0 w-full max-w-7xl space-y-5">
      <header className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white dark:bg-white dark:text-slate-950">
              <CalendarDays className="size-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Календарь
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Дедлайны и контроль задач · {scopeTitle}
              </p>
            </div>
          </div>
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setViewMode("week")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "week"
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
            >
              Неделя
            </button>
            <button
              type="button"
              onClick={() => setViewMode("month")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                viewMode === "month"
                  ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                  : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
            >
              Месяц
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={goToday}
            className="rounded-xl"
          >
            <RotateCcw className="size-4" aria-hidden />
            Сегодня
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2 sm:max-w-xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
            Дедлайны
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {visibleDeadlines}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
            Контроль
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {visibleControls}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-[10px] uppercase tracking-[0.12em] text-slate-400">
            С временем
          </p>
          <p className="mt-1 text-xl font-semibold text-slate-950 dark:text-slate-100">
            {exactTimeEvents}
          </p>
        </div>
      </section>

      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-3 py-3 dark:border-slate-800 sm:px-4">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={goPrevious}
            aria-label="Предыдущий период"
            className="rounded-xl"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Button>

          <h2 className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
            {periodTitle}
          </h2>

          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={goNext}
            aria-label="Следующий период"
            className="rounded-xl"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Button>
        </div>

        {viewMode === "week" ? (
          <>
            <div className="hidden grid-cols-7 divide-x divide-slate-200 md:grid dark:divide-slate-800">
              {weekDays.map((day) => {
                const iso = toISODate(day)
                const dayEvents = eventsByDate.get(iso) ?? []

                return (
                  <div key={iso} className="min-h-[420px] min-w-0 p-2.5">
                    <div className="mb-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-slate-400">
                        {format(day, "EEE", { locale: ru })}
                      </p>
                      <p
                        className={cn(
                          "mt-1 inline-flex size-8 items-center justify-center rounded-xl text-sm font-semibold",
                          isToday(day)
                            ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                            : "text-slate-800 dark:text-slate-200",
                        )}
                      >
                        {format(day, "d")}
                      </p>
                    </div>

                    <div className="space-y-2">
                      {dayEvents.length === 0 ? (
                        <EmptyDay />
                      ) : (
                        dayEvents.map((event) => (
                          <CalendarEventCard
                            key={event.id}
                            event={event}
                            onOpen={() => openTask(event)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-2 p-3 md:hidden">
              {weekDays.map((day) => {
                const iso = toISODate(day)
                const dayEvents = eventsByDate.get(iso) ?? []

                return (
                  <section
                    key={iso}
                    className={cn(
                      "rounded-2xl border p-3",
                      isToday(day)
                        ? "border-slate-400 bg-slate-50 dark:border-slate-600 dark:bg-slate-950/70"
                        : "border-slate-200 dark:border-slate-800",
                    )}
                  >
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                          {capitalize(
                            format(day, "EEEE, d MMMM", { locale: ru }),
                          )}
                        </p>
                        {isToday(day) ? (
                          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.12em] text-slate-400">
                            Сегодня
                          </p>
                        ) : null}
                      </div>
                      <span className="text-xs text-slate-400">
                        {dayEvents.length}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {dayEvents.length === 0 ? (
                        <EmptyDay />
                      ) : (
                        dayEvents.map((event) => (
                          <CalendarEventCard
                            key={event.id}
                            event={event}
                            onOpen={() => openTask(event)}
                          />
                        ))
                      )}
                    </div>
                  </section>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <div className="hidden md:block">
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/40">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7">
                {monthDays.map((day, index) => {
                  const iso = toISODate(day)
                  const dayEvents = eventsByDate.get(iso) ?? []
                  const inCurrentMonth = isSameMonth(day, anchorDate)
                  const visible = dayEvents.slice(0, 3)
                  const extraCount = Math.max(0, dayEvents.length - visible.length)

                  return (
                    <div
                      key={iso}
                      className={cn(
                        "min-h-[150px] min-w-0 border-b border-r border-slate-200 p-2 dark:border-slate-800",
                        !inCurrentMonth &&
                          "bg-slate-50/60 dark:bg-slate-950/35",
                        (index + 1) % 7 === 0 && "border-r-0",
                      )}
                    >
                      <div className="mb-1.5 flex items-center justify-between">
                        <span
                          className={cn(
                            "inline-flex size-7 items-center justify-center rounded-lg text-xs font-semibold",
                            isToday(day)
                              ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                              : inCurrentMonth
                                ? "text-slate-700 dark:text-slate-200"
                                : "text-slate-300 dark:text-slate-600",
                          )}
                        >
                          {format(day, "d")}
                        </span>
                        {dayEvents.length > 0 ? (
                          <span className="text-[10px] text-slate-400">
                            {dayEvents.length}
                          </span>
                        ) : null}
                      </div>

                      <div className="space-y-1">
                        {visible.map((event) => (
                          <CalendarEventCard
                            key={event.id}
                            event={event}
                            compact
                            onOpen={() => openTask(event)}
                          />
                        ))}
                        {extraCount > 0 ? (
                          <p className="px-1 text-[10px] font-medium text-slate-400">
                            +{extraCount} ещё
                          </p>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="p-3 md:hidden">
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="py-1 text-center text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-400"
                  >
                    {label}
                  </div>
                ))}

                {monthDays.map((day) => {
                  const iso = toISODate(day)
                  const dayEvents = eventsByDate.get(iso) ?? []
                  const selected = effectiveSelectedDate === iso
                  const inCurrentMonth = isSameMonth(day, anchorDate)

                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelectedDate(iso)}
                      className={cn(
                        "relative flex min-h-11 flex-col items-center justify-center rounded-xl text-xs font-medium transition-colors",
                        selected
                          ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                          : inCurrentMonth
                            ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                            : "text-slate-300 dark:text-slate-600",
                      )}
                    >
                      <span>{format(day, "d")}</span>
                      {dayEvents.length > 0 ? (
                        <span
                          className={cn(
                            "mt-1 h-1 w-4 rounded-full",
                            selected
                              ? "bg-white/70 dark:bg-slate-950/60"
                              : "bg-slate-300 dark:bg-slate-600",
                          )}
                        />
                      ) : null}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {capitalize(
                      format(
                        new Date(
                          Number(effectiveSelectedDate.slice(0, 4)),
                          Number(effectiveSelectedDate.slice(5, 7)) - 1,
                          Number(effectiveSelectedDate.slice(8, 10)),
                        ),
                        "d MMMM, EEEE",
                        { locale: ru },
                      ),
                    )}
                  </p>
                  <span className="text-xs text-slate-400">
                    {selectedDateEvents.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {selectedDateEvents.length === 0 ? (
                    <EmptyDay />
                  ) : (
                    selectedDateEvents.map((event) => (
                      <CalendarEventCard
                        key={event.id}
                        event={event}
                        onOpen={() => openTask(event)}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </section>

      <p className="px-1 text-xs leading-5 text-slate-400">
        Задачи без точного времени остаются событиями дня. Календарь не
        подставляет им искусственное время и не меняет дедлайны самостоятельно.
      </p>
    </div>
  )
}
