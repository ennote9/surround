import { useMemo } from "react"
import { format, isValid, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock3,
  FolderKanban,
  Gauge,
  ListChecks,
  Target,
} from "lucide-react"
import type { Habit, Project, Task } from "@/store/appState.types"
import {
  getHabitTotalCompliance,
  getProjectProgress,
  getProjectTaskStats,
} from "@/store/selectors"

type MobileAnalyticsDashboardProps = {
  selectedGoalTitle: string
  projects: Project[]
  habits: Habit[]
  overallProgress: number
  completedTasks: number
  pendingTasks: number
  totalTasks: number
  averageHabitCompliance: number
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

function DonutRing({
  completed,
  pending,
}: {
  completed: number
  pending: number
}) {
  const total = completed + pending
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  const size = 112
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
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
          className="stroke-slate-200 dark:stroke-slate-800"
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
          className="stroke-blue-600"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold text-slate-950 dark:text-white">
          {percent}%
        </span>
        <span className="text-[10px] text-slate-400">выполнено</span>
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
  icon: typeof Target
  label: string
  value: string | number
  hint?: string
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
            ? "mt-1 text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-300"
            : "mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white"
        }
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type DeadlineItem = {
  task: Task
  project: Project
}

function getLocalDateISO(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const day = String(now.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDateShort(iso?: string): string {
  if (!iso) return ""
  const date = parseISO(iso)
  if (!isValid(date)) return iso
  return format(date, "d MMM", { locale: ru }).replace(".", "")
}

export function MobileAnalyticsDashboard({
  selectedGoalTitle,
  projects,
  habits,
  overallProgress,
  completedTasks,
  pendingTasks,
  totalTasks,
  averageHabitCompliance,
}: MobileAnalyticsDashboardProps) {
  const todayISO = getLocalDateISO()

  const analytics = useMemo(() => {
    let overdue = 0
    const deadlineItems: DeadlineItem[] = []

    for (const project of projects) {
      for (const group of project.groups) {
        for (const task of group.tasks) {
          if (!task.completed && task.deadline) {
            if (task.deadline.slice(0, 10) < todayISO) overdue += 1
            deadlineItems.push({ task, project })
          }
        }
      }
    }

    deadlineItems.sort((a, b) =>
      (a.task.deadline ?? "").localeCompare(b.task.deadline ?? ""),
    )

    return {
      overdue,
      upcoming: deadlineItems.slice(0, 5),
    }
  }, [projects, todayISO])

  const sortedProjects = useMemo(
    () =>
      [...projects]
        .map((project) => ({
          project,
          progress: getProjectProgress(project),
          stats: getProjectTaskStats(project),
        }))
        .sort((a, b) => b.progress - a.progress),
    [projects],
  )

  const sortedHabits = useMemo(
    () =>
      [...habits]
        .map((habit) => ({
          habit,
          compliance: getHabitTotalCompliance(habit),
        }))
        .sort((a, b) => b.compliance - a.compliance),
    [habits],
  )

  const activeProjects = projects.filter(
    (project) => project.phase === undefined || project.phase === "active",
  ).length

  return (
    <div className="space-y-6 md:hidden">
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
            Аналитика
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Обзор
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Прогресс, задачи, проекты и рутины
          </p>
        </div>
        <span className="max-w-[48%] truncate rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          {selectedGoalTitle}
        </span>
      </header>

      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-blue-950/10 dark:from-blue-600 dark:via-indigo-700 dark:to-slate-900 dark:shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15">
              <Gauge className="size-3.5" aria-hidden />
              Состояние
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              Общий прогресс
            </h2>
            <p className="mt-1 max-w-[220px] text-sm leading-5 text-blue-100">
              {completedTasks} из {totalTasks} задач выполнено
            </p>
          </div>
          <ProgressRing value={overallProgress} />
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12">
            <p className="text-[10px] text-blue-100">Задачи</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {completedTasks}/{totalTasks}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12">
            <p className="text-[10px] text-blue-100">Compliance</p>
            <p className="mt-1 text-lg font-semibold tabular-nums">
              {averageHabitCompliance}%
            </p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2.5">
        <MetricCard
          icon={FolderKanban}
          label="Активных"
          value={activeProjects}
          hint="проектов"
        />
        <MetricCard
          icon={Clock3}
          label="В ожидании"
          value={pendingTasks}
          hint="задач"
        />
        <MetricCard
          icon={AlertTriangle}
          label="Просрочено"
          value={analytics.overdue}
          hint="задач"
          warning={analytics.overdue > 0}
        />
      </section>

      <section className="space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Выполнение
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Статус задач
          </h2>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-[128px_1fr] items-center gap-4">
            <DonutRing completed={completedTasks} pending={pendingTasks} />
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-blue-600" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Выполнено
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {completedTasks}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    В ожидании
                  </span>
                </div>
                <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {pendingTasks}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Сравнение
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Прогресс проектов
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            {projects.length} проектов
          </span>
        </div>

        {sortedProjects.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Нет проектов для анализа.
          </div>
        ) : (
          <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-4">
              {sortedProjects.map(({ project, progress, stats }) => (
                <div key={project.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {project.title}
                    </p>
                    <span className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    {stats.completed}/{stats.total} задач · {stats.pending} осталось
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Регулярность
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Compliance привычек
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            среднее {averageHabitCompliance}%
          </span>
        </div>

        {sortedHabits.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Нет привычек для анализа.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {sortedHabits.map(({ habit, compliance }) => (
              <div
                key={habit.id}
                className="rounded-[20px] border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    {compliance >= 100 ? (
                      <CheckCircle2 className="size-4" aria-hidden />
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
            Контроль
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Ближайшие сроки
          </h2>
        </div>

        {analytics.upcoming.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
            Дедлайнов пока нет.
          </div>
        ) : (
          <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {analytics.upcoming.map(({ task, project }, index) => {
              const overdue = Boolean(
                task.deadline && task.deadline.slice(0, 10) < todayISO,
              )

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5 last:border-b-0 dark:border-slate-800"
                >
                  <span
                    className={
                      overdue
                        ? "flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                        : "flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    }
                  >
                    {overdue ? (
                      <AlertTriangle className="size-4" aria-hidden />
                    ) : (
                      <ListChecks className="size-4" aria-hidden />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {task.title}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {project.title}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className={
                        overdue
                          ? "text-xs font-semibold text-amber-600 dark:text-amber-300"
                          : "text-xs font-semibold text-slate-700 dark:text-slate-300"
                      }
                    >
                      {formatDateShort(task.deadline)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {index === 0 ? "ближайший" : ""}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
