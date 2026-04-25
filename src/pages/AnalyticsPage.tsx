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
  getSelectableGoals,
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
    <div className="mx-auto max-w-6xl space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Аналитика
        </h1>
        <p className="mt-3 text-slate-600">
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

      <div className="grid gap-4 xl:grid-cols-2">
        <ProjectProgressChart projects={scopedProjects} />
        <TaskStatusChart
          completed={taskAgg.completed}
          pending={taskAgg.pending}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <HabitComplianceChart habits={habits} />
        <UpcomingDeadlines projects={scopedProjects} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ProjectTargetDatesCard projects={scopedProjects} />
      </div>
    </div>
  )
}
