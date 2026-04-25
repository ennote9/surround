import { useEffect } from "react"
import { Target } from "lucide-react"
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

export function SidebarGoalSwitcher({ collapsed = false }: SidebarGoalSwitcherProps) {
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
        className="mx-auto flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600"
        title={selectedGoalTitle}
      >
        <Target className="size-4" aria-hidden />
      </div>
    )
  }

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-500">
        <Target className="size-3.5" aria-hidden />
        <span>Цель</span>
      </div>

      <select
        value={selectedGoalId}
        onChange={(event) =>
          setSelectedGoalId(normalizeSelectedGoalId(event.target.value, state.goals))
        }
        className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30"
        aria-label="Текущая цель"
      >
        <option value={ALL_GOALS_SCOPE}>Все активные цели</option>
        {selectableGoals.map((goal) => (
          <option key={goal.id} value={goal.id}>
            {goal.title}
          </option>
        ))}
      </select>
    </div>
  )
}
