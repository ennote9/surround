import { cn } from "@/lib/utils"
import type { WorkspaceMode } from "@/store/appState.types"
import { useAppState } from "@/store/useAppState"

const OPTIONS: Array<{ value: WorkspaceMode; label: string }> = [
  { value: "all", label: "Все" },
  { value: "personal", label: "Личное" },
  { value: "work", label: "Работа" },
]

export function WorkspaceContextSwitcher({
  compact = false,
}: {
  compact?: boolean
}) {
  const { state, dispatch } = useAppState()
  const mode = state.settings.workspaceMode ?? "all"

  return (
    <div
      className={cn(
        "min-w-0",
        compact ? "w-full" : "space-y-1.5",
      )}
    >
      {!compact ? (
        <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
          Контекст
        </p>
      ) : null}
      <div
        className={cn(
          "grid grid-cols-3 rounded-xl bg-slate-100 p-1 dark:bg-slate-800",
          compact && "w-full",
        )}
        role="group"
        aria-label="Контекст приложения"
      >
        {OPTIONS.map((option) => {
          const active = mode === option.value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() =>
                dispatch({
                  type: "UPDATE_SETTINGS",
                  payload: { patch: { workspaceMode: option.value } },
                })
              }
              className={cn(
                "min-w-0 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
              )}
            >
              <span className="truncate">{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
