import { useMemo } from "react"
import { AnalyticsSummaryCards } from "@/features/analytics/components/AnalyticsSummaryCards"
import { HabitComplianceChart } from "@/features/analytics/components/HabitComplianceChart"
import { ProjectTargetDatesCard } from "@/features/analytics/components/ProjectTargetDatesCard"
import { ProjectProgressChart } from "@/features/analytics/components/ProjectProgressChart"
import { TaskStatusChart } from "@/features/analytics/components/TaskStatusChart"
import { UpcomingDeadlines } from "@/features/analytics/components/UpcomingDeadlines"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import {
  ALL_GOALS_SCOPE,
  getScopedProjectsForSelectedGoal,
  getSelectedGoalTitle,
  normalizeSelectedGoalId,
} from "@/shared/lib/selectedGoal"
import { SELECTED_GOAL_STORAGE_KEY } from "@/shared/lib/storageKeys"
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
  const [rawSelectedGoalId] = useLocalStorage(
    SELECTED_GOAL_STORAGE_KEY,
    ALL_GOALS_SCOPE,
  )
  const selectedGoalId = normalizeSelectedGoalId(rawSelectedGoalId, state.goals)
  const selectedGoalTitle = getSelectedGoalTitle(selectedGoalId, state.goals)
  const scopedProjects = useMemo(
    () => getScopedProjectsForSelectedGoal(projects, selectedGoalId, state.goals),
    [projects, selectedGoalId, state.goals],
  )

  const overallProgress = getOverallProgress(scopedProjects)

  const taskAgg = useMemo(() => {
    return scopedProjects.reduce(
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
  }, [scopedProjects])

  const averageHabitCompliance = useMemo(() => {
    if (habits.length === 0) return 0
    const sum = habits.reduce((acc, h) => acc + getHabitTotalCompliance(h), 0)
    return Math.round(sum / habits.length)
  }, [habits])

  return (
    <div className="mx-auto min-w-0 w-full max-w-6xl space-y-4 sm:space-y-6 lg:space-y-8">
      <header className="min-w-0">
        <h1 className="text-balance break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Аналитика
        </h1>
        <p className="mt-2 max-w-full text-pretty text-sm text-slate-600 sm:mt-3 sm:text-base">
          {selectedGoalId === ALL_GOALS_SCOPE
            ? "Аналитика по всем активным целям, проектам, задачам и привычкам."
            : `Аналитика цели «${selectedGoalTitle}». Привычки пока учитываются глобально.`}
        </p>
      </header>

      <AnalyticsSummaryCards
        totalProjects={scopedProjects.length}
        totalTasks={taskAgg.total}
        completedTasks={taskAgg.completed}
        pendingTasks={taskAgg.pending}
        overallProgress={overallProgress}
        averageHabitCompliance={averageHabitCompliance}
      />

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-4">
        <ProjectProgressChart projects={scopedProjects} />
        <TaskStatusChart
          completed={taskAgg.completed}
          pending={taskAgg.pending}
        />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-4">
        <HabitComplianceChart habits={habits} />
        <UpcomingDeadlines projects={scopedProjects} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-4">
        <ProjectTargetDatesCard projects={scopedProjects} />
      </div>
    </div>
  )
}
