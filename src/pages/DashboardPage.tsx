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
import { cn } from "@/lib/utils"
import { getOverallProgress, getProjectTaskStats } from "@/store/selectors"
import { useAppState } from "@/store/useAppState"
import { SELECTED_PROJECT_STORAGE_KEY } from "@/pages/ProjectsPage"

const DASHBOARD_WIDGETS_STORAGE_KEY = "canada-progress-os-dashboard-widgets"
const DASHBOARD_STAT_VISIBILITY_STORAGE_KEY =
  "canada-progress-os-dashboard-stat-visibility"

function isWidgetEnabled(
  widgets: ReturnType<typeof normalizeDashboardWidgets>,
  id: DashboardWidgetId,
): boolean {
  return widgets.find((w) => w.id === id)?.enabled ?? false
}

export default function DashboardPage() {
  const { state } = useAppState()
  const { projects, habits } = state

  const dashboardProjects = useMemo(
    () => projects.filter((project) => project.showOnDashboard !== false),
    [projects],
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

  const overallProgress = getOverallProgress(projects)
  const taskTotals = projects.reduce(
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
          <h2 className="text-base font-semibold text-slate-950">Сводка</h2>
          <div
            className={cn(
              "grid min-w-0 items-start gap-3",
              showOverall && showToday && "md:grid-cols-2",
            )}
          >
            {showOverall ? (
              <div className="min-w-0">
                <OverallProgressCard
                  progress={overallProgress}
                  totalTasks={taskTotals.total}
                  completedTasks={taskTotals.completed}
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
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-slate-950">Проекты</h2>
          {projects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-950">Проектов пока нет</p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
                Создайте проекты и задачи в разделе «Проекты», чтобы видеть прогресс на
                главной.
              </p>
              <Button
                asChild
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link to="/projects">Перейти к проектам</Link>
              </Button>
            </div>
          ) : dashboardProjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
              <p className="text-sm font-medium text-slate-950">
                Нет проектов для отображения на Главной
              </p>
              <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
                Включите отображение плитки в настройках нужного проекта.
              </p>
              <Button
                asChild
                className="mt-4 bg-blue-600 text-white hover:bg-blue-700"
              >
                <Link to="/projects">Открыть проекты</Link>
              </Button>
            </div>
          ) : (
            <div className="grid min-w-0 gap-3 md:grid-cols-2">
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
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Главная
        </h1>
      </header>

      {!anyWidgetEnabled ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-950">Все плитки скрыты</p>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
            Откройте настройки Главной, чтобы вернуть нужные блоки.
          </p>
          <Button asChild className="mt-4 bg-blue-600 text-white hover:bg-blue-700">
            <Link to="/settings">Настройки Главной</Link>
          </Button>
        </div>
      ) : hasLeftColumn && hasStatsSection ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="min-w-0 space-y-5">{dashboardLeftColumn}</div>

          <aside className="min-w-0">
            <MetricsGrid projects={projects} visibleStatIds={visibleStatIds} />
          </aside>
        </div>
      ) : hasLeftColumn ? (
        <div className="min-w-0 space-y-5">{dashboardLeftColumn}</div>
      ) : hasStatsSection ? (
        <aside className="min-w-0">
          <MetricsGrid projects={projects} visibleStatIds={visibleStatIds} />
        </aside>
      ) : null}
    </div>
  )
}
