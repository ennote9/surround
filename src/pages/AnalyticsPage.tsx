import { useMemo } from "react"
import { AnalyticsSummaryCards } from "@/features/analytics/components/AnalyticsSummaryCards"
import { MobileAnalyticsDashboard } from "@/features/analytics/components/MobileAnalyticsDashboard"
import { HabitComplianceChart } from "@/features/analytics/components/HabitComplianceChart"
import { ProjectTargetDatesCard } from "@/features/analytics/components/ProjectTargetDatesCard"
import { ProjectProgressChart } from "@/features/analytics/components/ProjectProgressChart"
import { TaskStatusChart } from "@/features/analytics/components/TaskStatusChart"
import { UpcomingDeadlines } from "@/features/analytics/components/UpcomingDeadlines"
import {
  getAnalyticsSummary,
  getMilestoneSummary,
  getScopedHabits,
  getScopedMilestones,
} from "@/features/analytics/analyticsLogic"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import { getCurrentWeekDates, getTodayISO } from "@/shared/lib/dates"
import {
  ALL_GOALS_SCOPE,
  getScopedProjectsForSelectedGoal,
  getSelectedGoalTitle,
  normalizeSelectedGoalId,
} from "@/shared/lib/selectedGoal"
import { SELECTED_GOAL_STORAGE_KEY } from "@/shared/lib/storageKeys"
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

  const scopedHabits = useMemo(
    () =>
      getScopedHabits(
        habits,
        scopedProjects,
        selectedGoalId,
        state.goals,
      ),
    [habits, scopedProjects, selectedGoalId, state.goals],
  )

  const weekDates = useMemo(() => getCurrentWeekDates(), [])
  const todayISO = getTodayISO()

  const analytics = useMemo(
    () =>
      getAnalyticsSummary(
        scopedProjects,
        scopedHabits,
        weekDates,
        todayISO,
      ),
    [scopedProjects, scopedHabits, weekDates, todayISO],
  )

  const scopedMilestones = useMemo(
    () =>
      getScopedMilestones(
        state.milestones,
        state.goals,
        scopedProjects,
        selectedGoalId,
      ),
    [state.milestones, state.goals, scopedProjects, selectedGoalId],
  )
  const milestoneSummary = useMemo(
    () => getMilestoneSummary(scopedMilestones),
    [scopedMilestones],
  )

  return (
    <div className="mx-auto min-w-0 w-full max-w-6xl">
      <MobileAnalyticsDashboard
        selectedGoalTitle={selectedGoalTitle}
        currentProjects={analytics.currentProjects}
        portfolioProjects={scopedProjects}
        contextHabits={scopedHabits}
        currentProgress={analytics.currentProgress}
        portfolioProgress={analytics.portfolioProgress}
        currentTasks={analytics.currentTasks}
        portfolioTasks={analytics.portfolioTasks}
        phaseCounts={analytics.phases}
        weeklyHabitSummary={analytics.habits}
        planningSummary={analytics.planning}
        milestoneSummary={milestoneSummary}
        milestones={scopedMilestones}
        weekDates={weekDates}
      />

      <div className="hidden space-y-6 md:block lg:space-y-8">
        <header className="min-w-0">
          <h1 className="text-balance break-words text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-3xl">
            Аналитика
          </h1>
          <p className="mt-2 max-w-full text-pretty text-sm text-slate-600 dark:text-slate-400 sm:mt-3 sm:text-base">
            {selectedGoalId === ALL_GOALS_SCOPE
              ? "Аналитика по всем активным целям, проектам, задачам и привычкам."
              : `Аналитика цели «${selectedGoalTitle}». Учитываются связанные с ней проекты и привычки.`}
          </p>
        </header>

        <AnalyticsSummaryCards
          totalProjects={analytics.currentProjects.length}
          totalTasks={analytics.currentTasks.total}
          completedTasks={analytics.currentTasks.completed}
          pendingTasks={analytics.currentTasks.pending}
          overallProgress={analytics.currentProgress}
          averageHabitCompliance={analytics.habits.progress}
        />

        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-4">
          <ProjectProgressChart projects={scopedProjects} />
          <TaskStatusChart
            completed={analytics.currentTasks.completed}
            pending={analytics.currentTasks.pending}
          />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-4">
          <HabitComplianceChart habits={scopedHabits} />
          <UpcomingDeadlines projects={analytics.currentProjects} />
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2 xl:gap-4">
          <ProjectTargetDatesCard projects={scopedProjects} />
        </div>
      </div>
    </div>
  )
}
