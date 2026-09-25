import { useMemo } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { OverallProgressCard } from "@/features/dashboard/components/OverallProgressCard"
import { ProjectSummaryCard } from "@/features/dashboard/components/ProjectSummaryCard"
import { TodayRoutinesCard } from "@/features/dashboard/components/TodayRoutinesCard"
import { MetricsGrid } from "@/features/dashboard/components/MetricsGrid"
import { MobileDashboard } from "@/features/dashboard/components/MobileDashboard"
import { DashboardGoalSwitcher } from "@/features/dashboard/components/DashboardGoalSwitcher"
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
  getProjectGoalLabel,
  getSelectedGoalTitle,
  normalizeSelectedGoalId,
} from "@/shared/lib/selectedGoal"
import {
  DASHBOARD_STAT_VISIBILITY_STORAGE_KEY,
  DASHBOARD_WIDGETS_STORAGE_KEY,
  SELECTED_GOAL_STORAGE_KEY,
  SELECTED_PROJECT_STORAGE_KEY,
} from "@/shared/lib/storageKeys"
import { cn } from "@/lib/utils"
import { getOverallProgress, getProjectTaskStats } from "@/store/selectors"
import { useAppState } from "@/store/useAppState"

function isWidgetEnabled(
  widgets: ReturnType<typeof normalizeDashboardWidgets>,
  id: DashboardWidgetId,
): boolean {
  return widgets.find((w) => w.id === id)?.enabled ?? false
}

export default function DashboardPage() {
  const { state } = useAppState()
  const { projects, habits } = state

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

  const scopedProjects = useMemo(() => {
    if (selectedGoalId !== ALL_GOALS_SCOPE) {
      return projects.filter(
        (project) => (project.goalId?.trim() ?? "") === selectedGoalId,
      )
    }

    const knownGoalIds = new Set(state.goals.map((goal) => goal.id))
    const visibleActiveGoalIds = new Set(
      dashboardGoals
        .filter((goal) => goal.status === "active")
        .map((goal) => goal.id),
    )

    return projects.filter((project) => {
      const goalId = project.goalId?.trim()
      if (!goalId || !knownGoalIds.has(goalId)) return true
      return visibleActiveGoalIds.has(goalId)
    })
  }, [projects, selectedGoalId, state.goals, dashboardGoals])

  const dashboardProjects = useMemo(
    () => scopedProjects.filter((project) => project.showOnDashboard !== false),
    [scopedProjects],
  )

  const scopedHabits = useMemo(() => {
    const scopedProjectIds = new Set(scopedProjects.map((project) => project.id))

    if (selectedGoalId !== ALL_GOALS_SCOPE) {
      return habits.filter((habit) => {
        const projectId = habit.projectId?.trim()
        if (projectId) return scopedProjectIds.has(projectId)
        return habit.goalId?.trim() === selectedGoalId
      })
    }

    const visibleActiveGoalIds = new Set(
      dashboardGoals
        .filter((goal) => goal.status === "active")
        .map((goal) => goal.id),
    )

    return habits.filter((habit) => {
      const projectId = habit.projectId?.trim()
      if (projectId) return scopedProjectIds.has(projectId)

      const goalId = habit.goalId?.trim()
      if (goalId) return visibleActiveGoalIds.has(goalId)

      return true
    })
  }, [habits, scopedProjects, selectedGoalId, dashboardGoals])

  const dashboardHabits = useMemo(
    () =>
      scopedHabits.filter(
        (habit) => habit.settings?.showOnDashboard !== false,
      ),
    [scopedHabits],
  )

  const [widgetsStored] = useLocalStorage(
    DASHBOARD_WIDGETS_STORAGE_KEY,
    DEFAULT_DASHBOARD_WIDGETS,
  )

  const [statVisibilityStored] = useLocalStorage(
    DASHBOARD_STAT_VISIBILITY_STORAGE_KEY,
    DEFAULT_DASHBOARD_STAT_VISIBILITY,
  )

  const widgets = useMemo(
    () => normalizeDashboardWidgets(widgetsStored),
    [widgetsStored],
  )

  const statVisibility = useMemo(
    () => normalizeDashboardStatVisibility(statVisibilityStored),
    [statVisibilityStored],
  )

  const visibleStatIds = useMemo(
    () => statVisibility.filter((item) => item.enabled).map((item) => item.id),
    [statVisibility],
  )

  const currentProjects = useMemo(
    () =>
      scopedProjects.filter(
        (project) => project.phase === undefined || project.phase === "active",
      ),
    [scopedProjects],
  )

  const overallProgress = getOverallProgress(currentProjects)
  const taskTotals = currentProjects.reduce(
    (acc, p) => {
      const s = getProjectTaskStats(p)
      return {
        total: acc.total + s.total,
        completed: acc.completed + s.completed,
      }
    },
    { total: 0, completed: 0 },
  )

  const todayISO = getTodayISO()

  const showOverall = isWidgetEnabled(widgets, "overallProgress")
  const showToday = isWidgetEnabled(widgets, "todayRoutines")
  const showProjects = isWidgetEnabled(widgets, "projects")
  const showMetrics = isWidgetEnabled(widgets, "metrics")
  const anyWidgetEnabled = widgets.some((w) => w.enabled)
  const overallProgressTitle =
    selectedGoalId === ALL_GOALS_SCOPE
      ? "Текущий прогресс активных целей"
      : "Текущий прогресс цели"

  const hasSummarySection = showOverall || showToday
  const hasProjectsSection = showProjects
  const hasLeftColumn = hasSummarySection || hasProjectsSection
  const hasStatsSection = showMetrics

  const handleOpenProject = (projectId: string) => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return
      window.localStorage.setItem(
        SELECTED_PROJECT_STORAGE_KEY,
        JSON.stringify(projectId),
      )
    } catch {
      // ignore quota / private mode
    }
  }

  const dashboardLeftColumn = (
    <>
      {hasSummarySection ? (
        <section className="min-w-0 space-y-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              Сегодня
            </p>
            <h2 className="mt-1 min-w-0 break-words text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
              Сводка
            </h2>
          </div>
          <div
            className={cn(
              "grid min-w-0 grid-cols-1 items-start gap-4",
              showOverall && showToday && "md:grid-cols-2 md:gap-4",
            )}
          >
            {showOverall ? (
              <div className="min-w-0">
                <OverallProgressCard
                  progress={overallProgress}
                  totalTasks={taskTotals.total}
                  completedTasks={taskTotals.completed}
                  title={overallProgressTitle}
                />
              </div>
            ) : null}
            {showToday ? (
              <div className="min-w-0">
                <TodayRoutinesCard habits={dashboardHabits} todayISO={todayISO} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasProjectsSection ? (
        <section className="min-w-0 space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
                В работе
              </p>
              <h2 className="mt-1 min-w-0 break-words text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                Проекты
              </h2>
            </div>
            {dashboardProjects.length > 0 ? (
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {dashboardProjects.length}
              </span>
            ) : null}
          </div>
          {scopedProjects.length === 0 ? (
            <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <p className="break-words text-sm font-medium text-slate-950 dark:text-slate-100">
                {selectedGoalId === ALL_GOALS_SCOPE
                  ? "Проектов пока нет"
                  : `В этой цели (${selectedGoalTitle}) пока нет проектов`}
              </p>
              <p className="mx-auto mt-1 max-w-full text-pretty text-xs text-slate-600 dark:text-slate-400 sm:max-w-md">
                {selectedGoalId === ALL_GOALS_SCOPE
                  ? "Создайте проекты и задачи в разделе «Проекты», чтобы видеть прогресс на главной."
                  : "Создайте первый проект для выбранной цели, чтобы видеть прогресс на главной."}
              </p>
              <Button
                asChild
                className="mt-4 min-h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
              >
                <Link to="/projects">Перейти к проектам</Link>
              </Button>
            </div>
          ) : dashboardProjects.length === 0 ? (
            <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
              <p className="break-words text-sm font-medium text-slate-950 dark:text-slate-100">
                Нет проектов для отображения на Главной
              </p>
              <p className="mx-auto mt-1 max-w-full text-pretty text-xs text-slate-600 dark:text-slate-400 sm:max-w-md">
                Включите отображение плитки в настройках нужного проекта.
              </p>
              <Button
                asChild
                className="mt-4 min-h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
              >
                <Link to="/projects">Открыть проекты</Link>
              </Button>
            </div>
          ) : (
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
              {dashboardProjects.map((project) => (
                <ProjectSummaryCard
                  key={project.id}
                  project={project}
                  goalContextLabel={getProjectGoalLabel(project, state.goals)}
                  onOpenProject={handleOpenProject}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}
    </>
  )

  return (
    <div className="mx-auto min-w-0 w-full max-w-[1480px]">
      {!anyWidgetEnabled ? (
        <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
          <p className="break-words text-sm font-medium text-slate-950 dark:text-slate-100">
            Все плитки скрыты
          </p>
          <p className="mx-auto mt-1 max-w-full text-pretty text-xs text-slate-600 dark:text-slate-400 sm:max-w-md">
            Откройте настройки Главной, чтобы вернуть нужные блоки.
          </p>
          <Button
            asChild
            className="mt-4 min-h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
          >
            <Link to="/settings">Настройки Главной</Link>
          </Button>
        </div>
      ) : (
        <>
          <MobileDashboard
            scopedProjects={scopedProjects}
            dashboardProjects={dashboardProjects}
            habits={dashboardHabits}
            statHabits={scopedHabits}
            todayISO={todayISO}
            visibleStatIds={visibleStatIds}
            showOverall={showOverall}
            showToday={showToday}
            showProjects={showProjects}
            showMetrics={showMetrics}
            overallProgress={overallProgress}
            taskTotals={taskTotals}
            onOpenProject={handleOpenProject}
          />

          <div className="hidden space-y-6 md:block xl:space-y-7">
            <header className="flex min-w-0 items-end justify-between gap-8">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500">
                  Life Progress OS
                </p>
                <h1 className="mt-1 text-balance break-words text-[32px] font-semibold tracking-[-0.025em] text-slate-950 dark:text-slate-100">
                  Главная
                </h1>
                <p className="mt-1.5 truncate text-sm text-slate-500 dark:text-slate-400">
                  {selectedGoalId === ALL_GOALS_SCOPE
                    ? "Общая картина по активным целям, проектам и привычкам"
                    : `Фокус: ${selectedGoalTitle}`}
                </p>
              </div>
              <DashboardGoalSwitcher className="max-w-[380px]" />
            </header>

            {hasLeftColumn && hasStatsSection ? (
              <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(390px,0.78fr)] 2xl:grid-cols-[minmax(0,1.6fr)_minmax(420px,0.72fr)]">
                <div className="min-w-0 space-y-6">
                  {dashboardLeftColumn}
                </div>

                <aside className="min-w-0 xl:sticky xl:top-7 xl:self-start">
                  <MetricsGrid
                    projects={scopedProjects}
                    habits={scopedHabits}
                    visibleStatIds={visibleStatIds}
                  />
                </aside>
              </div>
            ) : hasLeftColumn ? (
              <div className="min-w-0 space-y-6">
                {dashboardLeftColumn}
              </div>
            ) : hasStatsSection ? (
              <aside className="min-w-0">
                <MetricsGrid
                  projects={scopedProjects}
                  habits={scopedHabits}
                  visibleStatIds={visibleStatIds}
                />
              </aside>
            ) : null}
          </div>
        </>
      )}
    </div>
  )
}
