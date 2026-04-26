import { useMemo } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { OverallProgressCard } from "@/features/dashboard/components/OverallProgressCard"
import { ProjectSummaryCard } from "@/features/dashboard/components/ProjectSummaryCard"
import { TodayRoutinesCard } from "@/features/dashboard/components/TodayRoutinesCard"
import { MetricsGrid } from "@/features/dashboard/components/MetricsGrid"
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
  getSelectableGoals,
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
  const selectedGoalId = normalizeSelectedGoalId(rawSelectedGoalId, state.goals)
  const selectableGoals = getSelectableGoals(state.goals)
  const selectedGoalTitle = getSelectedGoalTitle(selectedGoalId, state.goals)
  const visibleGoalIds = useMemo(
    () => new Set(selectableGoals.map((goal) => goal.id)),
    [selectableGoals],
  )
  const scopedProjects = useMemo(() => {
    if (selectedGoalId === ALL_GOALS_SCOPE) {
      return projects.filter((project) =>
        project.goalId
          ? visibleGoalIds.has(project.goalId)
          : visibleGoalIds.has("goal-canada"),
      )
    }

    return projects.filter((project) => project.goalId === selectedGoalId)
  }, [projects, selectedGoalId, visibleGoalIds])

  const dashboardProjects = useMemo(
    () => scopedProjects.filter((project) => project.showOnDashboard !== false),
    [scopedProjects],
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

  const overallProgress = getOverallProgress(scopedProjects)
  const taskTotals = scopedProjects.reduce(
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
    selectedGoalId === ALL_GOALS_SCOPE ? "Прогресс активных целей" : "Прогресс цели"

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
        <section className="min-w-0 space-y-2">
          <h2 className="min-w-0 break-words text-base font-semibold text-slate-950">
            Сводка
          </h2>
          <div
            className={cn(
              "grid min-w-0 grid-cols-1 items-start gap-4",
              showOverall && showToday && "md:grid-cols-2 md:gap-3",
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
                <TodayRoutinesCard habits={habits} todayISO={todayISO} />
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {hasProjectsSection ? (
        <section className="min-w-0 space-y-2">
          <h2 className="min-w-0 break-words text-base font-semibold text-slate-950">
            Проекты
          </h2>
          {scopedProjects.length === 0 ? (
            <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
              <p className="break-words text-sm font-medium text-slate-950">
                {selectedGoalId === ALL_GOALS_SCOPE
                  ? "Проектов пока нет"
                  : `В этой цели (${selectedGoalTitle}) пока нет проектов`}
              </p>
              <p className="mx-auto mt-1 max-w-full text-pretty text-xs text-slate-600 sm:max-w-md">
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
            <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
              <p className="break-words text-sm font-medium text-slate-950">
                Нет проектов для отображения на Главной
              </p>
              <p className="mx-auto mt-1 max-w-full text-pretty text-xs text-slate-600 sm:max-w-md">
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
            <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 md:gap-3">
              {dashboardProjects.map((project) => (
                <ProjectSummaryCard
                  key={project.id}
                  project={project}
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
    <div className="mx-auto min-w-0 w-full max-w-5xl space-y-4 lg:space-y-5">
      <header className="min-w-0">
        <h1 className="text-balance break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Главная
        </h1>
      </header>

      {!anyWidgetEnabled ? (
        <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
          <p className="break-words text-sm font-medium text-slate-950">
            Все плитки скрыты
          </p>
          <p className="mx-auto mt-1 max-w-full text-pretty text-xs text-slate-600 sm:max-w-md">
            Откройте настройки Главной, чтобы вернуть нужные блоки.
          </p>
          <Button
            asChild
            className="mt-4 min-h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
          >
            <Link to="/settings">Настройки Главной</Link>
          </Button>
        </div>
      ) : hasLeftColumn && hasStatsSection ? (
        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] xl:gap-5">
          <div className="min-w-0 space-y-4 lg:space-y-5">{dashboardLeftColumn}</div>

          <aside className="min-w-0">
            <MetricsGrid projects={scopedProjects} visibleStatIds={visibleStatIds} />
          </aside>
        </div>
      ) : hasLeftColumn ? (
        <div className="min-w-0 space-y-4 lg:space-y-5">{dashboardLeftColumn}</div>
      ) : hasStatsSection ? (
        <aside className="min-w-0">
          <MetricsGrid projects={scopedProjects} visibleStatIds={visibleStatIds} />
        </aside>
      ) : null}
    </div>
  )
}
