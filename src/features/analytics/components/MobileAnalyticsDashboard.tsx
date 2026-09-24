import { useMemo } from "react"
import { format, isValid, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import {
  AlertTriangle,
  CalendarClock,
  Check,
  CheckCircle2,
  Circle,
  Flag,
  FolderKanban,
  Gauge,
  ListChecks,
  Route,
} from "lucide-react"
import {
  getHabitWeeklyCompleted,
  getHabitWeeklyTarget,
  getHabitWeeklyCompliance,
  getProjectProgress,
  getProjectTaskStats,
} from "@/store/selectors"
import type { Habit, Milestone, Project } from "@/store/appState.types"
import type { TaskAggregate } from "@/features/analytics/analyticsLogic"
import { getProjectPhaseBadgeClassName, getProjectPhaseTitle } from "@/shared/lib/projectPhases"
import { getTodayISO } from "@/shared/lib/dates"

type PhaseCounts = {
  active: number
  later: number
  strategic: number
}

type WeeklyHabitSummary = {
  target: number
  completed: number
  progress: number
}

type PlanningSummary = {
  tasks: number
  tasksWithDeadline: number
  deadlineCoverage: number
  overdue: number
  projects: number
  projectsWithTargetDate: number
  projectDateCoverage: number
}

type MilestoneSummary = {
  total: number
  completed: number
  pending: number
  progress: number
}

type MobileAnalyticsDashboardProps = {
  selectedGoalTitle: string
  currentProjects: Project[]
  portfolioProjects: Project[]
  contextHabits: Habit[]
  currentProgress: number
  portfolioProgress: number
  currentTasks: TaskAggregate
  portfolioTasks: TaskAggregate
  phaseCounts: PhaseCounts
  weeklyHabitSummary: WeeklyHabitSummary
  planningSummary: PlanningSummary
  milestoneSummary: MilestoneSummary
  milestones: Milestone[]
  weekDates: string[]
}

function ProgressRing({
  value,
  size = 96,
  strokeWidth = 9,
}: {
  value: number
  size?: number
  strokeWidth?: number
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
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
          className="stroke-white/18"
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
          className="stroke-white transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-semibold tabular-nums text-white">
          {clamped}%
        </span>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  warning = false,
}: {
  icon: typeof Gauge
  label: string
  value: string | number
  hint: string
  warning?: boolean
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <span
        className={
          warning
            ? "flex size-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
            : "flex size-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
        }
      >
        <Icon className="size-4" aria-hidden />
      </span>
      <p className="mt-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p
        className={
          warning
            ? "mt-1 text-xl font-semibold tracking-tight text-amber-600 dark:text-amber-300"
            : "mt-1 text-xl font-semibold tracking-tight text-slate-950 dark:text-white"
        }
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
        {hint}
      </p>
    </div>
  )
}

function formatDateShort(iso?: string): string {
  if (!iso) return ""
  const date = parseISO(iso)
  if (!isValid(date)) return iso
  return format(date, "d MMM", { locale: ru }).replace(".", "")
}

export function MobileAnalyticsDashboard({
  selectedGoalTitle,
  currentProjects,
  portfolioProjects,
  contextHabits,
  currentProgress,
  portfolioProgress,
  currentTasks,
  portfolioTasks,
  phaseCounts,
  weeklyHabitSummary,
  planningSummary,
  milestoneSummary,
  milestones,
  weekDates,
}: MobileAnalyticsDashboardProps) {
  const todayISO = getTodayISO()
  const futureTasks = Math.max(0, portfolioTasks.total - currentTasks.total)

  const rankedProjects = useMemo(
    () =>
      [...portfolioProjects]
        .map((project) => ({
          project,
          progress: getProjectProgress(project),
          stats: getProjectTaskStats(project),
        }))
        .sort((a, b) => {
          const phaseWeight = (project: Project) =>
            project.phase === undefined || project.phase === "active"
              ? 0
              : project.phase === "later"
                ? 1
                : 2
          const phaseDiff = phaseWeight(a.project) - phaseWeight(b.project)
          if (phaseDiff !== 0) return phaseDiff
          return b.progress - a.progress
        }),
    [portfolioProjects],
  )

  const habitRows = useMemo(
    () =>
      contextHabits
        .map((habit) => ({
          habit,
          target: getHabitWeeklyTarget(habit, weekDates),
          completed: Math.min(
            getHabitWeeklyCompleted(habit, weekDates),
            getHabitWeeklyTarget(habit, weekDates),
          ),
          compliance: getHabitWeeklyCompliance(habit, weekDates),
        }))
        .sort((a, b) => b.compliance - a.compliance),
    [contextHabits, weekDates],
  )

  const upcomingDeadlines = useMemo(() => {
    const rows: Array<{
      taskId: string
      title: string
      projectTitle: string
      deadline: string
      overdue: boolean
    }> = []

    for (const project of currentProjects) {
      for (const group of project.groups) {
        for (const task of group.tasks) {
          if (!task.completed && task.deadline) {
            rows.push({
              taskId: task.id,
              title: task.title,
              projectTitle: project.title,
              deadline: task.deadline,
              overdue: task.deadline.slice(0, 10) < todayISO,
            })
          }
        }
      }
    }

    return rows
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .slice(0, 5)
  }, [currentProjects, todayISO])

  return (
    <div className="space-y-6 md:hidden">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
            Аналитика
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Состояние
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Текущая работа отдельно от будущего
          </p>
        </div>
        <span className="max-w-[46%] truncate rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {selectedGoalTitle}
        </span>
      </header>

      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-blue-950/10 dark:from-blue-600 dark:via-indigo-700 dark:to-slate-900 dark:shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15">
              <Gauge className="size-3.5" aria-hidden />
              Только «Сейчас»
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              Текущий прогресс
            </h2>
            <p className="mt-1 max-w-[220px] text-sm leading-5 text-blue-100">
              {currentProjects.length} проектов · {currentTasks.completed}/{currentTasks.total} задач
            </p>
          </div>
          <ProgressRing value={currentProgress} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12">
            <p className="text-[10px] text-blue-100">Осталось сейчас</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {currentTasks.pending}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12">
            <p className="text-[10px] text-blue-100">Ритм недели</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {weeklyHabitSummary.completed}/{weeklyHabitSummary.target}
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        <MetricCard
          icon={FolderKanban}
          label="Сейчас"
          value={phaseCounts.active}
          hint="проектов"
        />
        <MetricCard
          icon={Route}
          label="Будущее"
          value={phaseCounts.later + phaseCounts.strategic}
          hint={`${futureTasks} задач`}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Просрочено"
          value={planningSummary.overdue}
          hint="текущих задач"
          warning={planningSummary.overdue > 0}
        />
      </section>

      <section className="space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Горизонт
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Портфель
          </h2>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Вся траектория
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {portfolioProgress}%
              </p>
            </div>
            <p className="text-right text-xs leading-5 text-slate-500 dark:text-slate-400">
              {portfolioTasks.completed}/{portfolioTasks.total} задач
            </p>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600"
              style={{ width: `${portfolioProgress}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-blue-50 p-2.5 dark:bg-blue-500/10">
              <p className="text-[10px] text-blue-600 dark:text-blue-300">Сейчас</p>
              <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                {phaseCounts.active}
              </p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-2.5 dark:bg-amber-500/10">
              <p className="text-[10px] text-amber-700 dark:text-amber-300">Позже</p>
              <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                {phaseCounts.later}
              </p>
            </div>
            <div className="rounded-2xl bg-indigo-50 p-2.5 dark:bg-indigo-500/10">
              <p className="text-[10px] text-indigo-700 dark:text-indigo-300">Стратегия</p>
              <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
                {phaseCounts.strategic}
              </p>
            </div>
          </div>

          {futureTasks > 0 ? (
            <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
              {futureTasks} будущих задач показаны в портфеле, но не влияют на «Текущий прогресс».
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Выполнение
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Проекты
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {portfolioProjects.length} всего
          </span>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {rankedProjects.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Нет проектов для анализа.
            </p>
          ) : (
            <div className="space-y-4">
              {rankedProjects.map(({ project, progress, stats }) => (
                <div key={project.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {project.title}
                    </p>
                    <span className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={getProjectPhaseBadgeClassName(project.phase)}>
                      {getProjectPhaseTitle(project.phase)}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {stats.completed}/{stats.total} задач
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="space-y-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Регулярность
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Ритм недели
            </h2>
          </div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {weeklyHabitSummary.progress}%
          </span>
        </div>

        {habitRows.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Для этого контекста нет связанных привычек.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {habitRows.map(({ habit, target, completed, compliance }) => (
              <div
                key={habit.id}
                className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={
                      compliance >= 100
                        ? "flex size-8 items-center justify-center rounded-xl bg-emerald-500 text-white"
                        : "flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }
                  >
                    {compliance >= 100 ? (
                      <Check className="size-4" aria-hidden />
                    ) : (
                      <Circle className="size-4" aria-hidden />
                    )}
                  </span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {compliance}%
                  </span>
                </div>
                <p className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
                  {habit.name}
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  {completed}/{target} за неделю
                </p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600"
                    style={{ width: `${compliance}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Контрольные результаты
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Вехи
          </h2>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {milestoneSummary.completed}/{milestoneSummary.total}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                значимых результатов достигнуто
              </p>
            </div>
            <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Flag className="size-5" aria-hidden />
            </span>
          </div>

          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-indigo-600"
              style={{ width: `${milestoneSummary.progress}%` }}
            />
          </div>

          {milestones.length > 0 ? (
            <div className="mt-4 space-y-2">
              {milestones.slice(0, 4).map((milestone) => (
                <div key={milestone.id} className="flex items-start gap-2.5">
                  <span
                    className={
                      milestone.completed
                        ? "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
                        : "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-slate-300 text-slate-400 dark:border-slate-700"
                    }
                  >
                    {milestone.completed ? (
                      <Check className="size-3" aria-hidden />
                    ) : null}
                  </span>
                  <p className="text-xs leading-5 text-slate-700 dark:text-slate-300">
                    {milestone.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Вех пока нет.
            </p>
          )}
        </div>
      </section>

      <section className="space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Качество планирования
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Сроки
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <CalendarClock className="size-5 text-blue-600 dark:text-blue-400" aria-hidden />
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {planningSummary.deadlineCoverage}%
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              задач имеют срок
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {planningSummary.tasksWithDeadline}/{planningSummary.tasks}
            </p>
          </div>

          <div className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <FolderKanban className="size-5 text-indigo-600 dark:text-indigo-400" aria-hidden />
            <p className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
              {planningSummary.projectDateCoverage}%
            </p>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              проектов имеют дату
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {planningSummary.projectsWithTargetDate}/{planningSummary.projects}
            </p>
          </div>
        </div>

        {upcomingDeadlines.length > 0 ? (
          <div className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {upcomingDeadlines.map((item) => (
              <div
                key={item.taskId}
                className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 dark:border-slate-800"
              >
                <span
                  className={
                    item.overdue
                      ? "flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                      : "flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }
                >
                  {item.overdue ? (
                    <AlertTriangle className="size-4" aria-hidden />
                  ) : (
                    <ListChecks className="size-4" aria-hidden />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {item.title}
                  </p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {item.projectTitle}
                  </p>
                </div>
                <span
                  className={
                    item.overdue
                      ? "shrink-0 text-xs font-semibold text-amber-600 dark:text-amber-300"
                      : "shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-300"
                  }
                >
                  {formatDateShort(item.deadline)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 p-4 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-slate-400" aria-hidden />
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                У текущих задач нет заданных дедлайнов. Поэтому просрочки и ближайшие сроки пока анализировать нечего.
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
