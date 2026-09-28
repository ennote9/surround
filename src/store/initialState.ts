import type { AppSettings, AppState } from "./appState.types"

export const DEFAULT_APP_SETTINGS: AppSettings = {
  theme: "light",
  accentColor: "#4a86e8",
  workspaceMode: "all",
  workInbox: [],
  dailyFocus: {},
  workDayClosures: {},
  workWipLimit: 4,
  workWeeklyReviews: {},
}

export const initialAppState: AppState = {
  version: 2,
  settings: { ...DEFAULT_APP_SETTINGS },
  goals: [],
  projects: [],
  habits: [],
  milestones: [],
}
