import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  ArrowUpRight,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronRight,
  Circle,
  ListTodo,
  Sparkles,
  Target,
} from "lucide-react"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import {
  CHARACTER_STATS,
  getCharacterStatLevel,
  getCharacterStatProgress,
} from "@/features/dashboard/characterStats"
import { getProjectPhaseTitle } from "@/shared/lib/projectPhases"
import type {
  CharacterStatType,
  Habit,
  Project,
  Task,
} from "@/store/appState.types"
import { getProjectProgress, getProjectTaskStats } from "@/store/selectors"

type MobileDashboardProps = {
  selectedGoalTitle: string
  scopedProjects: Project[]
  dashboardProjects: Project[]
  habits: Habit[]
  todayISO: string
  visibleStatIds: CharacterStatType[]
  showOverall: boolean
  showToday: boolean
  showProjects: boolean
  showMetrics: boolean
  overallProgress: number
  taskTotals: {
    total: number
    completed: number
  }
  onOpenProject: (projectId: string) => void
}

type PendingTask = {
  task: Task
  project: Project
}

const PRIORITY_WEIGHT: Record<NonNullable<Task["priority"]>, number> = {
  high: 3,
  medium: 2,
  low: 1,
}

function formatDashboardDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  const formatted = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function ProgressRing({
  value,
  size = 92,
  strokeWidth = 9,
}: {
  value: number
  size?: number
  strokeWidth?: number
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - clamped / 100)

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Прогресс ${clamped}%`}
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
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/18"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="text-white transition-[stroke-dashoffset] duration-500"
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

function MiniMetric({
  icon: Icon,
  value,
  label,
  accent = false,
}: {
  icon: typeof Target
  value: string | number
  label: string
  accent?: boolean
}) {
  return (
    <div
      className={
        accent
          ? "min-w-0 rounded-2xl border border-blue-200 bg-blue-50 p-3.5 dark:border-blue-500/25 dark:bg-blue-500/10"
          : "min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
      }
    >
      <div className="flex items-center gap-2">
        <div
          className={
            accent
              ? "flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"
              : "flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }
        >
          <Icon className="size-4" aria-hidden />
        </div>
        <span className="min-w-0 truncate text-xs text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
        {value}
      </p>
    </div>
  )
}

function sortPendingTasks(items: PendingTask[]): PendingTask[] {
  return [...items].sort((a, b) => {
    const priorityA = a.task.priority ? PRIORITY_WEIGHT[a.task.priority] : 0
    const priorityB = b.task.priority ? PRIORITY_WEIGHT[b.task.priority] : 0
    if (priorityA !== priorityB) return priorityB - priorityA

    const deadlineA = a.task.deadline ? Date.parse(a.task.deadline) : Number.MAX_SAFE_INTEGER
    const deadlineB = b.task.deadline ? Date.parse(b.task.deadline) : Number.MAX_SAFE_INTEGER
    return deadlineA - deadlineB
  })
}

export function MobileDashboard({
  selectedGoalTitle,
  scopedProjects,
  dashboardProjects,
  habits,
  todayISO,
  visibleStatIds,
  showOverall,
  showToday,
  showProjects,
  showMetrics,
  overallProgress,
  taskTotals,
  onOpenProject,
}: MobileDashboardProps) {
  const completedHabits = habits.filter(
    (habit) => habit.dailyStatus[todayISO] === true,
  ).length
  const habitsProgress =
    habits.length === 0 ? 0 : Math.round((completedHabits / habits.length) * 100)
  const pendingCount = Math.max(0, taskTotals.total - taskTotals.completed)
  const activeProjects = dashboardProjects.filter(
    (project) => project.phase === undefined || project.phase === "active",
  ).length

  const pendingTasks = useMemo(() => {
    const items: PendingTask[] = []
    for (const project of scopedProjects) {
      for (const group of project.groups) {
        for (const task of group.tasks) {
          if (!task.completed) {
            items.push({ task, project })
          }
        }
      }
    }
    return sortPendingTasks(items).slice(0, 3)
  }, [scopedProjects])

  const statsToShow = useMemo(
    () =>
      CHARACTER_STATS.filter((stat) => visibleStatIds.includes(stat.id)).slice(0, 8),
    [visibleStatIds],
  )

  const heroProgress = showOverall ? overallProgress : habitsProgress
  const heroTitle = showOverall ? "Общий прогресс" : "Рутины сегодня"

  return (
    <div className="min-w-0 space-y-5 pb-2 md:hidden">
      <header className="flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {formatDashboardDate(todayISO)}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Главная
          </h1>
        </div>
        <span className="max-w-[46%] truncate rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {selectedGoalTitle}
        </span>
      </header>

      {showOverall || showToday ? (
        <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-5 text-white shadow-lg shadow-blue-950/10 dark:from-blue-600 dark:via-indigo-700 dark:to-slate-900 dark:shadow-black/20">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15">
                <Sparkles className="size-3.5" aria-hidden />
                Сегодня
              </div>
              <h2 className="mt-3 text-xl font-semibold tracking-tight">
                {heroTitle}
              </h2>
              <p className="mt-1 max-w-[220px] text-sm leading-5 text-blue-100">
                {showOverall
                  ? pendingCount > 0
                    ? `Осталось ${pendingCount} задач. Двигайся по одной.`
                    : "Все текущие задачи закрыты."
                  : habits.length > 0
                    ? `${completedHabits} из ${habits.length} привычек выполнено.`
                    : "Добавь первую привычку в Рутине."}
              </p>
            </div>
            <ProgressRing value={heroProgress} />
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2.5">
            {showOverall ? (
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12 backdrop-blur-sm">
                <p className="text-xs text-blue-100">Задачи</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {taskTotals.completed}/{taskTotals.total}
                </p>
              </div>
            ) : null}
            {showToday ? (
              <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12 backdrop-blur-sm">
                <p className="text-xs text-blue-100">Рутины</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {completedHabits}/{habits.length}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-3 gap-2.5">
        <MiniMetric icon={ListTodo} value={pendingCount} label="Осталось" accent />
        <MiniMetric icon={CalendarCheck2} value={completedHabits} label="Рутин" />
        <MiniMetric icon={Target} value={activeProjects} label="Проектов" />
      </section>

      {showProjects && pendingTasks.length > 0 ? (
        <section className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                Фокус
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Что делать дальше
              </h2>
            </div>
            <Link
              to="/projects"
              className="flex size-10 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              aria-label="Открыть проекты"
            >
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {pendingTasks.map(({ task, project }, index) => (
              <Link
                key={task.id}
                to="/projects"
                onClick={() => onOpenProject(project.id)}
                className="flex min-w-0 items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/70"
              >
                <div
                  className={
                    index === 0
                      ? "flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"
                      : "flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }
                >
                  {index === 0 ? (
                    <CheckCircle2 className="size-4" aria-hidden />
                  ) : (
                    <Circle className="size-4" aria-hidden />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
                    {task.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {project.title}
                    {task.priority ? ` · ${task.priority === "high" ? "Высокий" : task.priority === "medium" ? "Средний" : "Низкий"} приоритет` : ""}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {showProjects && dashboardProjects.length > 0 ? (
        <section className="space-y-2.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                Направления
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Проекты
              </h2>
            </div>
            <Link
              to="/projects"
              className="text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Все
            </Link>
          </div>

          <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {dashboardProjects.map((project) => {
              const progress = getProjectProgress(project)
              const stats = getProjectTaskStats(project)
              return (
                <Link
                  key={project.id}
                  to="/projects"
                  onClick={() => onOpenProject(project.id)}
                  className="w-[78vw] max-w-[310px] shrink-0 snap-start rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      <CharacterStatIcon
                        statType={project.statType}
                        className="size-5"
                      />
                    </div>
                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                      {progress}%
                    </span>
                  </div>

                  <h3 className="mt-4 line-clamp-2 min-h-10 text-base font-semibold leading-5 text-slate-950 dark:text-slate-100">
                    {project.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {getProjectPhaseTitle(project.phase)} · {stats.completed}/{stats.total} задач
                  </p>

                  <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
                      style={{ width: `${stats.total > 0 ? progress : 0}%` }}
                    />
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      ) : null}

      {showToday ? (
        <section className="space-y-2.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                Сегодня
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Рутины
              </h2>
            </div>
            <Link
              to="/routine"
              className="text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Открыть
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {habits.slice(0, 4).map((habit) => {
              const done = habit.dailyStatus[todayISO] === true
              return (
                <Link
                  key={habit.id}
                  to="/routine"
                  className={
                    done
                      ? "min-w-0 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 dark:border-emerald-500/20 dark:bg-emerald-500/10"
                      : "min-w-0 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  }
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={
                        done
                          ? "flex size-8 items-center justify-center rounded-xl bg-emerald-500 text-white"
                          : "flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }
                    >
                      {done ? (
                        <Check className="size-4" aria-hidden />
                      ) : (
                        <Circle className="size-4" aria-hidden />
                      )}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
                    {habit.name}
                  </p>
                </Link>
              )
            })}
          </div>

          {habits.length > 4 ? (
            <Link
              to="/routine"
              className="flex items-center justify-center gap-1 rounded-2xl border border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 dark:border-slate-700 dark:text-slate-400"
            >
              Ещё {habits.length - 4}
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          ) : null}
        </section>
      ) : null}

      {showMetrics ? (
        <section className="space-y-2.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                Развитие
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Статы
              </h2>
            </div>
            <Link
              to="/analytics"
              className="text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Аналитика
            </Link>
          </div>

          {statsToShow.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              Статы скрыты в настройках Главной.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {statsToShow.map((stat) => {
                const { progress, linkedProjects } = getCharacterStatProgress(
                  scopedProjects,
                  stat.id,
                )
                const level = getCharacterStatLevel(progress)

                return (
                  <Link
                    key={stat.id}
                    to="/analytics"
                    className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                        <CharacterStatIcon statType={stat.id} className="size-4" />
                      </span>
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                        {progress}%
                      </span>
                    </div>
                    <p className="mt-3 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {stat.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Lv. {level} · {linkedProjects} пр.
                    </p>
                  </Link>
                )
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  )
}
