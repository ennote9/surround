import { useMemo } from "react"
import { Link } from "react-router-dom"
import {
  AlertTriangle,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Flame,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import {
  CHARACTER_STATS,
  getCharacterStatLevel,
  getCharacterStatProgress,
  getCharacterStatTitle,
} from "@/features/dashboard/characterStats"
import { getProjectPhaseTitle } from "@/shared/lib/projectPhases"
import type {
  CharacterStatType,
  Habit,
  Project,
} from "@/store/appState.types"
import {
  getHabitTargetPerWeek,
  getHabitWeeklyCompleted,
  getHabitWeeklyCompliance,
  getProjectProgress,
  getProjectTaskStats,
} from "@/store/selectors"

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

function formatDashboardDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  const formatted = new Intl.DateTimeFormat("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date)
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`)
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  })
    .format(date)
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

function getRoutineWeekStats(habits: Habit[], days: string[]) {
  let expected = 0
  let completed = 0

  for (const habit of habits) {
    const target = getHabitTargetPerWeek(habit)
    const done = getHabitWeeklyCompleted(habit, days)
    expected += target
    completed += Math.min(done, target)
  }

  return {
    completed,
    expected,
    progress: expected === 0 ? 0 : Math.round((completed / expected) * 100),
  }
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

function PulseMetric({
  icon: Icon,
  value,
  label,
  hint,
  warning = false,
}: {
  icon: typeof Target
  value: string | number
  label: string
  hint?: string
  warning?: boolean
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <span
          className={
            warning
              ? "flex size-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
              : "flex size-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          }
        >
          <Icon className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {label}
        </span>
      </div>
      <p
        className={
          warning
            ? "mt-2.5 text-2xl font-semibold tracking-tight text-amber-600 dark:text-amber-300"
            : "mt-2.5 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50"
        }
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 truncate text-[10px] text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

function ProjectCard({
  project,
  onOpenProject,
}: {
  project: Project
  onOpenProject: (projectId: string) => void
}) {
  const progress = getProjectProgress(project)
  const stats = getProjectTaskStats(project)
  const pending = Math.max(0, stats.total - stats.completed)
  const groupCount = project.groups.length

  return (
    <Link
      to="/projects"
      onClick={() => onOpenProject(project.id)}
      className="w-[82vw] max-w-[330px] shrink-0 snap-start rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm transition-transform active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <CharacterStatIcon statType={project.statType} className="size-5" />
        </span>
        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
          {progress}%
        </span>
      </div>

      <h3 className="mt-4 line-clamp-2 min-h-10 text-base font-semibold leading-5 text-slate-950 dark:text-slate-100">
        {project.title}
      </h3>

      <div className="mt-2 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {getProjectPhaseTitle(project.phase)}
        </span>
        {project.statType ? (
          <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300">
            {getCharacterStatTitle(project.statType)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
          style={{ width: `${stats.total > 0 ? progress : 0}%` }}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-800/70">
          <p className="text-[10px] text-slate-400">Осталось</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {pending} задач
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 px-2.5 py-2 dark:bg-slate-800/70">
          <p className="text-[10px] text-slate-400">Структура</p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {groupCount} групп
          </p>
        </div>
      </div>

      {project.targetDate ? (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <CalendarDays className="size-3.5" aria-hidden />
          До {formatShortDate(project.targetDate)}
        </p>
      ) : null}
    </Link>
  )
}

function RoutineCard({
  habit,
  todayISO,
  weekDays,
}: {
  habit: Habit
  todayISO: string
  weekDays: string[]
}) {
  const doneToday = habit.dailyStatus[todayISO] === true
  const createdDate = habit.createdAt.slice(0, 10)
  const activeDays = weekDays.filter((day) => !createdDate || day >= createdDate)
  const targetPerWeek = getHabitTargetPerWeek(habit)
  const completedWeek = Math.min(
    getHabitWeeklyCompleted(habit, weekDays),
    targetPerWeek,
  )
  const weeklyCompliance = getHabitWeeklyCompliance(habit, weekDays)

  return (
    <Link
      to="/routine"
      className="w-[72vw] max-w-[290px] shrink-0 snap-start rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={
            doneToday
              ? "flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white"
              : "flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }
        >
          {doneToday ? (
            <Check className="size-4" aria-hidden />
          ) : (
            <Circle className="size-4" aria-hidden />
          )}
        </span>
        <span
          className={
            doneToday
              ? "rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }
        >
          {doneToday ? "Сегодня ✓" : "Сегодня"}
        </span>
      </div>

      <h3 className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
        {habit.name}
      </h3>

      <div className="mt-4 flex items-center justify-between gap-1.5">
        {weekDays.map((day) => {
          const unavailable = Boolean(createdDate && day < createdDate)
          const done = habit.dailyStatus[day] === true
          return (
            <span
              key={day}
              title={day}
              className={
                unavailable
                  ? "h-2.5 min-w-0 flex-1 rounded-full bg-slate-100 dark:bg-slate-800/60"
                  : done
                    ? "h-2.5 min-w-0 flex-1 rounded-full bg-emerald-500"
                    : "h-2.5 min-w-0 flex-1 rounded-full bg-slate-200 dark:bg-slate-700"
              }
            />
          )
        })}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400">Норма недели</span>
        <span className="font-semibold text-slate-800 dark:text-slate-200">
          {completedWeek}/{targetPerWeek} · {weeklyCompliance}%
        </span>
      </div>
    </Link>
  )
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
  )

  const weekDays = useMemo(() => getLastDays(todayISO, 7), [todayISO])
  const weeklyRoutineStats = useMemo(
    () => getRoutineWeekStats(habits, weekDays),
    [habits, weekDays],
  )

  const overdueTasks = useMemo(() => {
    let count = 0
    for (const project of scopedProjects) {
      for (const group of project.groups) {
        for (const task of group.tasks) {
          if (
            !task.completed &&
            task.deadline &&
            task.deadline.slice(0, 10) < todayISO
          ) {
            count += 1
          }
        }
      }
    }
    return count
  }, [scopedProjects, todayISO])

  const sortedProjects = useMemo(
    () =>
      [...dashboardProjects].sort((a, b) => {
        const phaseWeight = (project: Project) =>
          project.phase === undefined || project.phase === "active"
            ? 0
            : project.phase === "later"
              ? 1
              : 2
        const phaseDiff = phaseWeight(a) - phaseWeight(b)
        if (phaseDiff !== 0) return phaseDiff
        return getProjectProgress(b) - getProjectProgress(a)
      }),
    [dashboardProjects],
  )

  const statsToShow = useMemo(() => {
    const selected = CHARACTER_STATS.filter((stat) =>
      visibleStatIds.includes(stat.id),
    )

    return selected
      .map((stat) => ({
        stat,
        progressData: getCharacterStatProgress(scopedProjects, stat.id),
      }))
      .sort((a, b) => {
        const linkedDiff =
          b.progressData.linkedProjects - a.progressData.linkedProjects
        if (linkedDiff !== 0) return linkedDiff
        return b.progressData.progress - a.progressData.progress
      })
      .slice(0, 6)
  }, [visibleStatIds, scopedProjects])

  const heroProgress = showOverall ? overallProgress : habitsProgress
  const heroTitle = showOverall ? "Общий прогресс" : "Рутины сегодня"

  return (
    <div className="min-w-0 space-y-6 pb-2 md:hidden">
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
                    ? `Выполнено ${taskTotals.completed} из ${taskTotals.total} задач.`
                    : "Все текущие задачи закрыты."
                  : habits.length > 0
                    ? `${completedHabits} из ${habits.length} привычек выполнено сегодня.`
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
                <p className="text-xs text-blue-100">Сегодняшние рутины</p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {completedHabits}/{habits.length}
                </p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="space-y-3.5">
        <div className="flex items-center gap-2">
          <Flame className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Пульс
          </h2>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <PulseMetric
            icon={Target}
            value={activeProjects.length}
            label="Активных"
            hint="проектов"
          />
          <PulseMetric
            icon={Clock3}
            value={`${weeklyRoutineStats.progress}%`}
            label="Ритм недели"
            hint={`${weeklyRoutineStats.completed}/${weeklyRoutineStats.expected}`}
          />
          <PulseMetric
            icon={AlertTriangle}
            value={overdueTasks}
            label="Просрочено"
            hint="задач"
            warning={overdueTasks > 0}
          />
        </div>
      </section>

      {showProjects ? (
        <section className="space-y-3.5">
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

          {sortedProjects.length > 0 ? (
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {sortedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpenProject={onOpenProject}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              На Главной пока нет проектов для отображения.
            </div>
          )}
        </section>
      ) : null}

      {showToday ? (
        <section className="space-y-3.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                Регулярность
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Рутины
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Отметок сегодня: {completedHabits} · ритм недели {weeklyRoutineStats.progress}%
              </p>
            </div>
            <Link
              to="/routine"
              className="text-sm font-medium text-blue-600 dark:text-blue-400"
            >
              Открыть
            </Link>
          </div>

          {habits.length > 0 ? (
            <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {habits.map((habit) => (
                <RoutineCard
                  key={habit.id}
                  habit={habit}
                  todayISO={todayISO}
                  weekDays={weekDays}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[22px] border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Рутин пока нет.
            </div>
          )}
        </section>
      ) : null}

      {showMetrics ? (
        <section className="space-y-3.5">
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
            <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <Layers3 className="size-5" aria-hidden />
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                    Статы пока не выбраны
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                    Выбери нужные характеристики в настройках Главной.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {statsToShow.map(({ stat, progressData }) => {
                const level = getCharacterStatLevel(progressData.progress)
                const totalTasks = progressData.total
                const completedTasks = progressData.completed
                const hasLinkedProjects = progressData.linkedProjects > 0

                return (
                  <Link
                    key={stat.id}
                    to="/analytics"
                    className={
                      hasLinkedProjects
                        ? "group min-w-0 rounded-[22px] border border-blue-200/80 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-3.5 shadow-sm transition-transform active:scale-[0.99] dark:border-blue-500/20 dark:from-blue-500/10 dark:via-slate-900 dark:to-indigo-500/10"
                        : "group min-w-0 rounded-[22px] border border-slate-200 bg-white p-3.5 shadow-sm transition-transform active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
                    }
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={
                          hasLinkedProjects
                            ? "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                            : "flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }
                      >
                        <CharacterStatIcon statType={stat.id} className="size-5" />
                      </span>

                      <span
                        className={
                          hasLinkedProjects
                            ? "rounded-full bg-blue-100 px-2 py-1 text-[10px] font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
                            : "rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }
                      >
                        Lv. {level}
                      </span>
                    </div>

                    <p className="mt-3 truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                      {stat.title}
                    </p>

                    <div className="mt-2 flex items-end justify-between gap-2">
                      <span
                        className={
                          hasLinkedProjects
                            ? "text-2xl font-semibold tracking-tight text-blue-600 dark:text-blue-300"
                            : "text-2xl font-semibold tracking-tight text-slate-400 dark:text-slate-500"
                        }
                      >
                        {progressData.progress}%
                      </span>
                      <span className="pb-0.5 text-[10px] text-slate-400 dark:text-slate-500">
                        прогресс
                      </span>
                    </div>

                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={
                          hasLinkedProjects
                            ? "h-full rounded-full bg-blue-600 transition-[width] duration-500"
                            : "h-full rounded-full bg-slate-300 transition-[width] duration-500 dark:bg-slate-700"
                        }
                        style={{ width: `${progressData.progress}%` }}
                      />
                    </div>

                    <div className="mt-3 border-t border-slate-100 pt-2.5 dark:border-slate-800">
                      {hasLinkedProjects ? (
                        <>
                          <p className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {progressData.linkedProjects} {progressData.linkedProjects === 1 ? "проект" : "проектов"}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] text-slate-400 dark:text-slate-500">
                            {completedTasks}/{totalTasks} задач выполнено
                          </p>
                        </>
                      ) : (
                        <p className="text-[10px] leading-4 text-slate-400 dark:text-slate-500">
                          Нет привязанных проектов
                        </p>
                      )}
                    </div>
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
