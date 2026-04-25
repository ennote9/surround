import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react"
import { persistGoalAction } from "@/shared/api/cloudGoalActionPersistence"
import { persistGroupTaskAction } from "@/shared/api/cloudGroupTaskActionPersistence"
import { persistHabitAction } from "@/shared/api/cloudHabitActionPersistence"
import { persistMilestoneAction } from "@/shared/api/cloudMilestoneActionPersistence"
import { persistProjectAction } from "@/shared/api/cloudProjectActionPersistence"
import { persistUserSettings } from "@/shared/api/cloudSettingsPersistence"
import type { CloudSaveState } from "@/shared/api/cloudSaveStatus"
import type { AppAction } from "./actions"
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
  cloudSaveMode?:
    | "disabled"
    | "goals"
    | "goals-projects"
    | "goals-projects-tasks"
    | "goals-projects-tasks-habits"
    | "goals-projects-tasks-habits-milestones"
    | "goals-projects-tasks-habits-milestones-settings"
  userId?: string
}

function getInitialState(initialState?: AppState): AppState {
  if (initialState) {
    return initialState
  }
  return readPersistedState()
}

function generateUuidV4(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }

  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16))
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("")
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  return `00000000-0000-4000-8000-${Date.now().toString().padStart(12, "0").slice(-12)}`
}

export function AppStateProvider({
  children,
  initialState,
  persistenceMode = "localStorage",
  cloudSaveMode = "disabled",
  userId,
}: AppStateProviderProps) {
  const [state, baseDispatch] = useReducer(
    appStateReducer,
    initialState,
    getInitialState,
  )
  const [cloudSaveState, setCloudSaveState] = useState<CloudSaveState>({
    status: "idle",
    error: null,
  })

  const clearCloudSaveError = useCallback(() => {
    setCloudSaveState({ status: "idle", error: null })
  }, [])

  const normalizeActionForCloud = useCallback((action: AppAction): AppAction => {
    const goalsEnabled =
      cloudSaveMode === "goals" ||
      cloudSaveMode === "goals-projects" ||
      cloudSaveMode === "goals-projects-tasks" ||
      cloudSaveMode === "goals-projects-tasks-habits" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const projectsEnabled =
      cloudSaveMode === "goals-projects" ||
      cloudSaveMode === "goals-projects-tasks" ||
      cloudSaveMode === "goals-projects-tasks-habits" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const groupsTasksEnabled =
      cloudSaveMode === "goals-projects-tasks" ||
      cloudSaveMode === "goals-projects-tasks-habits" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const habitsEnabled =
      cloudSaveMode === "goals-projects-tasks-habits" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const milestonesEnabled =
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"

    if (action.type === "ADD_GOAL" && goalsEnabled) {
      const now = new Date().toISOString()
      return {
        ...action,
        payload: {
          ...action.payload,
          id: action.payload.id ?? generateUuidV4(),
          createdAt: action.payload.createdAt ?? now,
          updatedAt: action.payload.updatedAt ?? now,
        },
      }
    }

    if (action.type === "ADD_PROJECT" && projectsEnabled) {
      const now = new Date().toISOString()
      return {
        ...action,
        payload: {
          ...action.payload,
          id: action.payload.id ?? generateUuidV4(),
          createdAt: action.payload.createdAt ?? now,
          updatedAt: action.payload.updatedAt ?? now,
        },
      }
    }

    if (action.type === "ADD_GROUP" && groupsTasksEnabled) {
      const now = new Date().toISOString()
      return {
        ...action,
        payload: {
          ...action.payload,
          id: action.payload.id ?? generateUuidV4(),
          createdAt: action.payload.createdAt ?? now,
          updatedAt: action.payload.updatedAt ?? now,
        },
      }
    }

    if (action.type === "ADD_TASK" && groupsTasksEnabled) {
      const now = new Date().toISOString()
      return {
        ...action,
        payload: {
          ...action.payload,
          id: action.payload.id ?? generateUuidV4(),
          createdAt: action.payload.createdAt ?? now,
          updatedAt: action.payload.updatedAt ?? now,
        },
      }
    }

    if (action.type === "TOGGLE_TASK" && groupsTasksEnabled) {
      const currentProject = state.projects.find((p) => p.id === action.payload.projectId)
      const currentGroup = currentProject?.groups.find((g) => g.id === action.payload.groupId)
      const currentTask = currentGroup?.tasks.find((t) => t.id === action.payload.taskId)

      return {
        ...action,
        payload: {
          ...action.payload,
          completed:
            typeof action.payload.completed === "boolean"
              ? action.payload.completed
              : !currentTask?.completed,
        },
      }
    }

    if (action.type === "ADD_HABIT" && habitsEnabled) {
      const now = new Date().toISOString()
      return {
        ...action,
        payload: {
          ...action.payload,
          id: action.payload.id ?? generateUuidV4(),
          createdAt: action.payload.createdAt ?? now,
          updatedAt: action.payload.updatedAt ?? now,
        },
      }
    }

    if (action.type === "TOGGLE_HABIT_DATE" && habitsEnabled) {
      const habit = state.habits.find((h) => h.id === action.payload.id)
      const current = habit?.dailyStatus[action.payload.date]
      return {
        ...action,
        payload: {
          ...action.payload,
          completed:
            typeof action.payload.completed === "boolean"
              ? action.payload.completed
              : !current,
        },
      }
    }

    if (action.type === "ADD_MILESTONE" && milestonesEnabled) {
      const now = new Date().toISOString()
      return {
        ...action,
        payload: {
          ...action.payload,
          id: action.payload.id ?? generateUuidV4(),
          createdAt: action.payload.createdAt ?? now,
          updatedAt: action.payload.updatedAt ?? now,
        },
      }
    }

    if (action.type === "TOGGLE_MILESTONE" && milestonesEnabled) {
      const milestone = state.milestones.find((m) => m.id === action.payload.id)
      return {
        ...action,
        payload: {
          ...action.payload,
          completed:
            typeof action.payload.completed === "boolean"
              ? action.payload.completed
              : !milestone?.completed,
        },
      }
    }

    return action
  }, [cloudSaveMode, state.habits, state.milestones, state.projects])

  const dispatch = useCallback((action: AppAction) => {
    const actionForDispatch = normalizeActionForCloud(action)
    baseDispatch(actionForDispatch)

    const isGoalAction =
      actionForDispatch.type === "ADD_GOAL" ||
      actionForDispatch.type === "UPDATE_GOAL" ||
      actionForDispatch.type === "ARCHIVE_GOAL"
    const isProjectAction =
      actionForDispatch.type === "ADD_PROJECT" ||
      actionForDispatch.type === "UPDATE_PROJECT" ||
      actionForDispatch.type === "DELETE_PROJECT"
    const isGroupTaskAction =
      actionForDispatch.type === "ADD_GROUP" ||
      actionForDispatch.type === "UPDATE_GROUP" ||
      actionForDispatch.type === "DELETE_GROUP" ||
      actionForDispatch.type === "ADD_TASK" ||
      actionForDispatch.type === "UPDATE_TASK" ||
      actionForDispatch.type === "TOGGLE_TASK" ||
      actionForDispatch.type === "DELETE_TASK"
    const isHabitAction =
      actionForDispatch.type === "ADD_HABIT" ||
      actionForDispatch.type === "UPDATE_HABIT" ||
      actionForDispatch.type === "DELETE_HABIT" ||
      actionForDispatch.type === "TOGGLE_HABIT_DATE"
    const isMilestoneAction =
      actionForDispatch.type === "ADD_MILESTONE" ||
      actionForDispatch.type === "UPDATE_MILESTONE" ||
      actionForDispatch.type === "TOGGLE_MILESTONE" ||
      actionForDispatch.type === "DELETE_MILESTONE"
    const isSettingsAction = actionForDispatch.type === "UPDATE_SETTINGS"

    if (
      !isGoalAction &&
      !isProjectAction &&
      !isGroupTaskAction &&
      !isHabitAction &&
      !isMilestoneAction &&
      !isSettingsAction
    ) {
      return
    }

    const goalsEnabled =
      cloudSaveMode === "goals" ||
      cloudSaveMode === "goals-projects" ||
      cloudSaveMode === "goals-projects-tasks" ||
      cloudSaveMode === "goals-projects-tasks-habits" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const projectsEnabled =
      cloudSaveMode === "goals-projects" ||
      cloudSaveMode === "goals-projects-tasks" ||
      cloudSaveMode === "goals-projects-tasks-habits" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const groupsTasksEnabled =
      cloudSaveMode === "goals-projects-tasks" ||
      cloudSaveMode === "goals-projects-tasks-habits" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const habitsEnabled =
      cloudSaveMode === "goals-projects-tasks-habits" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const milestonesEnabled =
      cloudSaveMode === "goals-projects-tasks-habits-milestones" ||
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const settingsEnabled =
      cloudSaveMode === "goals-projects-tasks-habits-milestones-settings"
    const shouldPersistGoal = isGoalAction && goalsEnabled
    const shouldPersistProject = isProjectAction && projectsEnabled
    const shouldPersistGroupTask = isGroupTaskAction && groupsTasksEnabled
    const shouldPersistHabit = isHabitAction && habitsEnabled
    const shouldPersistMilestone = isMilestoneAction && milestonesEnabled
    const shouldPersistSettings = isSettingsAction && settingsEnabled

    if (
      (!shouldPersistGoal &&
        !shouldPersistProject &&
        !shouldPersistGroupTask &&
        !shouldPersistHabit &&
        !shouldPersistMilestone &&
        !shouldPersistSettings) ||
      !userId
    ) {
      return
    }

    setCloudSaveState({ status: "saving", error: null })

    void (async () => {
      // TODO(21.8.x): last-finish-wins for concurrent saves, queueing can be added later.
      const result = shouldPersistSettings
        ? await persistUserSettings(
            userId,
            appStateReducer(state, actionForDispatch).settings,
          )
        : shouldPersistGoal
          ? await persistGoalAction(userId, actionForDispatch)
          : shouldPersistProject
            ? await persistProjectAction(userId, actionForDispatch)
            : shouldPersistGroupTask
              ? await persistGroupTaskAction(userId, actionForDispatch)
              : shouldPersistHabit
                ? await persistHabitAction(userId, actionForDispatch)
                : await persistMilestoneAction(userId, actionForDispatch)
      if (result.error) {
        setCloudSaveState({ status: "error", error: result.error })
        return
      }

      setCloudSaveState({
        status: "saved",
        error: null,
        savedAt: new Date().toISOString(),
      })
    })()
  }, [cloudSaveMode, normalizeActionForCloud, state, userId])

  useEffect(() => {
    if (persistenceMode !== "localStorage") {
      return
    }
    writePersistedState(state)
  }, [state, persistenceMode])

  const value = useMemo(
    () => ({ state, dispatch, cloudSaveState, clearCloudSaveError }),
    [state, dispatch, cloudSaveState, clearCloudSaveError],
  )

  return (
    <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
  )
}
