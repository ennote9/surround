import { useEffect } from "react"
import { ChevronDown, Target } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import {
  ALL_GOALS_SCOPE,
  getSelectableGoals,
  getSelectedGoalTitle,
  normalizeSelectedGoalId,
  type SelectedGoalScope,
} from "@/shared/lib/selectedGoal"
import { SELECTED_GOAL_STORAGE_KEY } from "@/shared/lib/storageKeys"
import { useAppState } from "@/store/useAppState"

type DashboardGoalSwitcherProps = {
  className?: string
}

export function DashboardGoalSwitcher({
  className,
}: DashboardGoalSwitcherProps) {
  const { state } = useAppState()
  const [rawSelectedGoalId, setSelectedGoalId] =
    useLocalStorage<SelectedGoalScope>(
      SELECTED_GOAL_STORAGE_KEY,
      ALL_GOALS_SCOPE,
    )

  const dashboardGoals = state.goals.filter(
    (goal) => goal.showOnDashboard !== false,
  )
  const selectedGoalId = normalizeSelectedGoalId(
    rawSelectedGoalId,
    dashboardGoals,
  )
  const selectedGoalTitle = getSelectedGoalTitle(
    selectedGoalId,
    dashboardGoals,
  )
  const selectableGoals = getSelectableGoals(dashboardGoals)

  useEffect(() => {
    if (rawSelectedGoalId !== selectedGoalId) {
      setSelectedGoalId(selectedGoalId)
    }
  }, [rawSelectedGoalId, selectedGoalId, setSelectedGoalId])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex h-10 min-w-0 max-w-[48vw] items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-left text-xs font-medium text-slate-600 shadow-sm outline-none transition-colors hover:bg-slate-50 focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:max-w-[320px]",
            className,
          )}
          aria-label="Выбрать цель для Главной"
          title={selectedGoalTitle}
        >
          <Target className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {selectedGoalTitle}
          </span>
          <ChevronDown className="size-3.5 shrink-0 text-slate-400" aria-hidden />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-[min(320px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-1.5 text-slate-950 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
      >
        <DropdownMenuLabel className="px-2.5 py-2 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-400">
          Контекст Главной
        </DropdownMenuLabel>

        <DropdownMenuRadioGroup
          value={selectedGoalId}
          onValueChange={(value) =>
            setSelectedGoalId(
              normalizeSelectedGoalId(value, dashboardGoals),
            )
          }
        >
          <DropdownMenuRadioItem
            value={ALL_GOALS_SCOPE}
            className="min-h-11 rounded-xl px-2.5 pr-9 text-sm"
          >
            <div className="min-w-0">
              <p className="truncate font-medium">Все активные цели</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Общая картина по текущим направлениям
              </p>
            </div>
          </DropdownMenuRadioItem>

          {selectableGoals.length > 0 ? (
            <DropdownMenuSeparator className="my-1.5 bg-slate-200 dark:bg-slate-700" />
          ) : null}

          {selectableGoals.map((goal) => (
            <DropdownMenuRadioItem
              key={goal.id}
              value={goal.id}
              className="min-h-11 rounded-xl px-2.5 pr-9 text-sm"
              title={goal.title}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{goal.title}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {goal.status === "later" ? "Цель на потом" : "Активная цель"}
                </p>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
