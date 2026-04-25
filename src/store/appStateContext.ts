import { createContext, type Dispatch } from "react"
import type { CloudSaveState } from "@/shared/api/cloudSaveStatus"
import type { AppAction } from "./actions"
import type { AppState } from "./appState.types"

export type AppStateContextValue = {
  state: AppState
  dispatch: Dispatch<AppAction>
  cloudSaveState: CloudSaveState
  clearCloudSaveError: () => void
}

export const AppStateContext = createContext<AppStateContextValue | null>(null)
