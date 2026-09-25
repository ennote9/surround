import { useEffect } from "react"
import { ChevronDown, Target } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import { SELECTED_GOAL_STORAGE_KEY } from "@/shared/lib/storageKeys"
import {
  ALL_GOALS_SCOPE,
  getSelectableGoals,
  getSelectedGoalTitle,
  normalizeSelectedGoalId,
  type SelectedGoalScope,
} from "@/shared/lib/selectedGoal"
import { useAppState } from "@/store/useAppState"

type SidebarGoalSwitcherProps = {
  collapsed?: boolean
}

export function SidebarGoalSwitcher({
  collapsed = false,
}: SidebarGoalSwitcherProps) {
  const { state } = useAppState()
  const [rawSelectedGoalId, setSelectedGoalId] =
    useLocalStorage<SelectedGoalScope>(
      SELECTED_GOAL_STORAGE_KEY,
      ALL_GOALS_SCOPE,
    )

  const selectedGoalId = normalizeSelectedGoalId(rawSelectedGoalId, state.goals)
  const selectableGoals = getSelectableGoals(state.goals)
  const selectedGoalTitle = getSelectedGoalTitle(selectedGoalId, state.goals)

  useEffect(() => {
    if (rawSelectedGoalId !== selectedGoalId) {
      setSelectedGoalId(selectedGoalId)
    }
  }, [rawSelectedGoalId, selectedGoalId, setSelectedGoalId])

  if (collapsed) {
    return (
      <div
        className="mx-auto flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        title={selectedGoalTitle}
      >
        <Target className="size-4" aria-hidden />
      </div>
    )
  }

  return (
    <div className="min-w-0 space-y-2 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-950/55">
      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
        <Target className="size-3.5 shrink-0" aria-hidden />
        <span>Цель</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm font-medium text-slate-800 shadow-xs outline-none transition-colors hover:border-slate-300 hover:bg-white focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            aria-label="Текущая цель"
            title={selectedGoalTitle}
          >
            <span className="min-w-0 flex-1 truncate">{selectedGoalTitle}</span>
            <ChevronDown className="size-4 shrink-0 text-slate-500" aria-hidden />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="min-w-[240px] max-w-72 rounded-xl border border-slate-200 bg-white p-1.5 text-slate-950 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        >
          <DropdownMenuRadioGroup
            value={selectedGoalId}
            onValueChange={(value) =>
              setSelectedGoalId(normalizeSelectedGoalId(value, state.goals))
            }
          >
            <DropdownMenuRadioItem
              value={ALL_GOALS_SCOPE}
              className="min-h-10 rounded-lg px-2.5 pr-8 text-sm"
            >
              <span className="truncate">Все активные цели</span>
            </DropdownMenuRadioItem>

            {selectableGoals.length > 0 ? (
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-700" />
            ) : null}

            {selectableGoals.map((goal) => (
              <DropdownMenuRadioItem
                key={goal.id}
                value={goal.id}
                className="min-h-10 rounded-lg px-2.5 pr-8 text-sm"
                title={goal.title}
              >
                <span className="min-w-0 flex-1 truncate">{goal.title}</span>
                {goal.status === "later" ? (
                  <span className="ml-2 shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                    Позже
                  </span>
                ) : null}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
