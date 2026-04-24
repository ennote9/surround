import { useMemo } from "react"
import { AnalyticsSummaryCards } from "@/features/analytics/components/AnalyticsSummaryCards"
import { HabitComplianceChart } from "@/features/analytics/components/HabitComplianceChart"
import { ProjectProgressChart } from "@/features/analytics/components/ProjectProgressChart"
import { TaskStatusChart } from "@/features/analytics/components/TaskStatusChart"
import { UpcomingDeadlines } from "@/features/analytics/components/UpcomingDeadlines"
import {
  getHabitTotalCompliance,
  getOverallProgress,
  getProjectTaskStats,
} from "@/store/selectors"
import { useAppState } from "@/store/useAppState"

export default function AnalyticsPage() {
  const { state } = useAppState()
  const projects = state.projects
  const habits = state.habits

  const overallProgress = getOverallProgress(projects)

  const taskAgg = useMemo(() => {
    return projects.reduce(
      (acc, p) => {
        const s = getProjectTaskStats(p)
        return {
          total: acc.total + s.total,
          completed: acc.completed + s.completed,
          pending: acc.pending + s.pending,
        }
      },
      { total: 0, completed: 0, pending: 0 },
    )
  }, [projects])

  const averageHabitCompliance = useMemo(() => {
    if (habits.length === 0) return 0
    const sum = habits.reduce((acc, h) => acc + getHabitTotalCompliance(h), 0)
    return Math.round(sum / habits.length)
  }, [habits])

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Аналитика
        </h1>
        <p className="mt-3 text-slate-600">
          Графики, сводки и динамика прогресса по направлениям подготовки.
        </p>
      </header>

      <AnalyticsSummaryCards
        totalProjects={projects.length}
        totalTasks={taskAgg.total}
        completedTasks={taskAgg.completed}
        pendingTasks={taskAgg.pending}
        overallProgress={overallProgress}
        averageHabitCompliance={averageHabitCompliance}
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <ProjectProgressChart projects={projects} />
        <TaskStatusChart
          completed={taskAgg.completed}
          pending={taskAgg.pending}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HabitComplianceChart habits={habits} />
        <UpcomingDeadlines projects={projects} />
      </div>
    </div>
  )
}
