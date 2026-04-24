import { useEffect, useMemo, useReducer, type ReactNode } from "react"
import type { AppState } from "./appState.types"
import { AppStateContext } from "./appStateContext"
import { initialAppState } from "./initialState"
import { migrateAppState } from "./migrations"
import { appStateReducer } from "./reducer"

const STORAGE_KEY = "canada-progress-os-state"

function readPersistedState(): AppState {
  try {
    if (typeof window === "undefined") return initialAppState
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === null) return initialAppState
    const parsed: unknown = JSON.parse(raw)
    return migrateAppState(parsed)
  } catch {
    return initialAppState
  }
}

function writePersistedState(state: AppState): void {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(
    appStateReducer,
    undefined,
    readPersistedState,
  )

  useEffect(() => {
    writePersistedState(state)
  }, [state])

  const value = useMemo(
    () => ({ state, dispatch }),
    [state, dispatch],
  )

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}
