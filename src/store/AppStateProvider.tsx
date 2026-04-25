import { useEffect, useMemo, useReducer, type ReactNode } from "react"
import { APP_STATE_STORAGE_KEY } from "@/shared/lib/storageKeys"
import type { AppState } from "./appState.types"
import { AppStateContext } from "./appStateContext"
import { initialAppState } from "./initialState"
import { migrateAppState } from "./migrations"
import { appStateReducer } from "./reducer"

function readPersistedState(): AppState {
  try {
    if (typeof window === "undefined") return initialAppState
    const raw = window.localStorage.getItem(APP_STATE_STORAGE_KEY)
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
    window.localStorage.setItem(APP_STATE_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

type AppStateProviderProps = {
  children: ReactNode
  initialState?: AppState
  persistenceMode?: "localStorage" | "memory"
}

function getInitialState(initialState?: AppState): AppState {
  if (initialState) {
    return initialState
  }
  return readPersistedState()
}

export function AppStateProvider({
  children,
  initialState,
  persistenceMode = "localStorage",
}: AppStateProviderProps) {
  const [state, dispatch] = useReducer(
    appStateReducer,
    initialState,
    getInitialState,
  )

  useEffect(() => {
    if (persistenceMode !== "localStorage") {
      return
    }
    writePersistedState(state)
  }, [state, persistenceMode])

  const value = useMemo(
    () => ({ state, dispatch }),
    [state, dispatch],
  )

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}
