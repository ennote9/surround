import { createId } from "@/shared/lib/ids"
import type {
  AppState,
  Goal,
  Habit,
  Milestone,
  Project,
  Task,
  TaskGroup,
} from "./appState.types"
import type { AppAction } from "./actions"
import { initialAppState } from "./initialState"

function now(): string {
  return new Date().toISOString()
}

function cloneInitial(): AppState {
  return structuredClone(initialAppState)
}

export function appStateReducer(state: AppState, action: AppAction): AppState {
  const t = now()

  switch (action.type) {
    case "RESET_STATE":
      return cloneInitial()

    case "IMPORT_STATE":
      return structuredClone(action.payload)

    case "ADD_GOAL": {
      const p = action.payload
      const title = p.title.trim()
      if (!title) return state

      const createdAt = p.createdAt ?? t
      const updatedAt = p.updatedAt ?? t
      const goal: Goal = {
        id: p.id ?? createId("goal"),
        title,
        description: p.description?.trim() || undefined,
        targetDate: p.targetDate?.trim() || undefined,
        status: p.status ?? "active",
        showOnDashboard: p.showOnDashboard ?? true,
        createdAt,
        updatedAt,
      }

      return { ...state, goals: [...state.goals, goal] }
    }

    case "UPDATE_GOAL": {
      const { goalId, patch } = action.payload
      return {
        ...state,
        goals: state.goals.map((goal) => {
          if (goal.id !== goalId) return goal

          const nextTitle = patch.title?.trim()
          return {
            ...goal,
            ...(nextTitle ? { title: nextTitle } : {}),
            ...(patch.description !== undefined
              ? { description: patch.description.trim() || undefined }
              : {}),
            ...(patch.targetDate !== undefined
              ? { targetDate: patch.targetDate.trim() || undefined }
              : {}),
            ...(patch.status !== undefined ? { status: patch.status } : {}),
            ...(patch.showOnDashboard !== undefined
              ? { showOnDashboard: patch.showOnDashboard }
              : {}),
            updatedAt: t,
          }
        }),
      }
    }

    case "ARCHIVE_GOAL": {
      const { goalId } = action.payload
      return {
        ...state,
        goals: state.goals.map((goal) =>
          goal.id === goalId
            ? {
                ...goal,
                status: "archived",
                showOnDashboard: false,
                updatedAt: t,
              }
            : goal,
        ),
      }
    }

    case "DELETE_GOAL": {
      const { goalId, mode } = action.payload
      if (mode === "goal-only") {
        return {
          ...state,
          goals: state.goals.filter((g) => g.id !== goalId),
          projects: state.projects.map((p) =>
            p.goalId === goalId
              ? { ...p, goalId: undefined, updatedAt: t }
              : p,
          ),
          habits: state.habits.map((habit) =>
            habit.goalId === goalId
              ? { ...habit, goalId: undefined, updatedAt: t }
              : habit,
          ),
          milestones: state.milestones.filter((m) => m.goalId !== goalId),
        }
      }

      const projectIdsToDelete = state.projects
        .filter((p) => p.goalId === goalId)
        .map((p) => p.id)
      const deleteProjectIds = new Set(projectIdsToDelete)

      return {
        ...state,
        goals: state.goals.filter((g) => g.id !== goalId),
        projects: state.projects.filter((p) => !deleteProjectIds.has(p.id)),
        habits: state.habits.map((habit) => {
          const projectDeleted =
            habit.projectId !== undefined && deleteProjectIds.has(habit.projectId)
          const goalDeleted = habit.goalId === goalId
          if (!projectDeleted && !goalDeleted) return habit
          return {
            ...habit,
            ...(projectDeleted ? { projectId: undefined } : {}),
            ...(goalDeleted ? { goalId: undefined } : {}),
            updatedAt: t,
          }
        }),
        milestones: state.milestones.filter(
          (m) =>
            m.goalId !== goalId &&
            !(m.projectId !== undefined && deleteProjectIds.has(m.projectId)),
        ),
      }
    }

    case "ADD_PROJECT": {
      const p = action.payload
      const rawGoal = p.goalId
      const goalId: string | undefined =
        rawGoal === undefined || String(rawGoal).trim() === ""
          ? undefined
          : String(rawGoal).trim()
      const project: Project = {
        id: p.id ?? createId("project"),
        goalId,
        title: p.title,
        description: p.description,
        context: p.context ?? "personal",
        targetDate: p.targetDate?.trim() || undefined,
        showOnDashboard: p.showOnDashboard ?? true,
        phase: p.phase ?? "active",
        groups: [],
        createdAt: p.createdAt ?? t,
        updatedAt: p.updatedAt ?? t,
        ...(p.statType !== undefined ? { statType: p.statType } : {}),
      }
      return { ...state, projects: [...state.projects, project] }
    }

    case "UPDATE_PROJECT": {
      const { id, patch } = action.payload
      return {
        ...state,
        projects: state.projects.map((proj) =>
          proj.id === id
            ? { ...proj, ...patch, updatedAt: t }
            : proj,
        ),
      }
    }

    case "DELETE_PROJECT": {
      const id = action.payload.id
      return {
        ...state,
        projects: state.projects.filter((p) => p.id !== id),
        habits: state.habits.map((habit) =>
          habit.projectId === id
            ? { ...habit, projectId: undefined, updatedAt: t }
            : habit,
        ),
        milestones: state.milestones.filter((m) => m.projectId !== id),
      }
    }

    case "ADD_GROUP": {
      const { projectId, title } = action.payload
      return {
        ...state,
        projects: state.projects.map((proj) => {
          if (proj.id !== projectId) return proj
          const maxOrder = proj.groups.reduce(
            (acc, g) => Math.max(acc, g.order),
            -1,
          )
          const group: TaskGroup = {
            id: action.payload.id ?? createId("group"),
            projectId,
            title,
            tasks: [],
            order: maxOrder + 1,
            createdAt: action.payload.createdAt ?? t,
            updatedAt: action.payload.updatedAt ?? t,
          }
          return {
            ...proj,
            groups: [...proj.groups, group],
            updatedAt: t,
          }
        }),
      }
    }

    case "UPDATE_GROUP": {
      const { projectId, groupId, patch } = action.payload
      return {
        ...state,
        projects: state.projects.map((proj) => {
          if (proj.id !== projectId) return proj
          return {
            ...proj,
            groups: proj.groups.map((g) =>
              g.id === groupId ? { ...g, ...patch, updatedAt: t } : g,
            ),
            updatedAt: t,
          }
        }),
      }
    }

    case "DELETE_GROUP": {
      const { projectId, groupId } = action.payload
      return {
        ...state,
        projects: state.projects.map((proj) => {
          if (proj.id !== projectId) return proj
          return {
            ...proj,
            groups: proj.groups.filter((g) => g.id !== groupId),
            updatedAt: t,
          }
        }),
      }
    }

    case "ADD_TASK": {
      const {
        projectId,
        groupId,
        title,
        deadline,
        notes,
        priority,
        status,
        assignee,
        followUpDate,
      } = action.payload
      const taskStatus = status ?? "planned"
      const task: Task = {
        id: action.payload.id ?? createId("task"),
        groupId,
        projectId,
        title,
        completed: taskStatus === "done",
        status: taskStatus,
        deadline,
        notes,
        priority,
        assignee,
        followUpDate,
        deferReason: action.payload.deferReason,
        deferNote: action.payload.deferNote,
        deferredUntil: action.payload.deferredUntil,
        delegationNote: action.payload.delegationNote,
        delegatedAt:
          action.payload.delegatedAt ??
          (taskStatus === "delegated" ? t : undefined),
        isNextAction:
          taskStatus === "done" ? false : (action.payload.isNextAction ?? false),
        statusChangedAt: action.payload.statusChangedAt ?? t,
        completedAt:
          action.payload.completedAt ??
          (taskStatus === "done" ? t : undefined),
        createdAt: action.payload.createdAt ?? t,
        updatedAt: action.payload.updatedAt ?? t,
      }
      return {
        ...state,
        projects: state.projects.map((proj) => {
          if (proj.id !== projectId) return proj
          return {
            ...proj,
            groups: proj.groups.map((g) => ({
              ...g,
              tasks:
                g.id === groupId
                  ? [
                      ...g.tasks.map((existing) =>
                        task.isNextAction
                          ? { ...existing, isNextAction: false }
                          : existing,
                      ),
                      task,
                    ]
                  : task.isNextAction
                    ? g.tasks.map((existing) => ({
                        ...existing,
                        isNextAction: false,
                      }))
                    : g.tasks,
              updatedAt: g.id === groupId ? t : g.updatedAt,
            })),
            updatedAt: t,
          }
        }),
      }
    }

    case "UPDATE_TASK": {
      const { projectId, groupId, taskId, patch } = action.payload
      const normalizedPatch: Partial<Task> = { ...patch }
      if (patch.status !== undefined) {
        normalizedPatch.completed = patch.status === "done"
        normalizedPatch.statusChangedAt = patch.statusChangedAt ?? t
        normalizedPatch.completedAt =
          patch.status === "done" ? (patch.completedAt ?? t) : undefined
        if (patch.status === "delegated" && patch.delegatedAt === undefined) {
          normalizedPatch.delegatedAt = t
        }
        if (patch.status === "done") {
          normalizedPatch.isNextAction = false
        }
      } else if (patch.completed !== undefined) {
        normalizedPatch.status = patch.completed ? "done" : "planned"
        normalizedPatch.statusChangedAt = patch.statusChangedAt ?? t
        normalizedPatch.completedAt = patch.completed ? (patch.completedAt ?? t) : undefined
        if (patch.completed) {
          normalizedPatch.isNextAction = false
        }
      }
      return {
        ...state,
        projects: state.projects.map((proj) => {
          if (proj.id !== projectId) return proj
          return {
            ...proj,
            groups: proj.groups.map((g) => ({
              ...g,
              tasks: g.tasks.map((task) => {
                if (task.id === taskId) {
                  return { ...task, ...normalizedPatch, updatedAt: t }
                }
                if (normalizedPatch.isNextAction === true) {
                  return { ...task, isNextAction: false }
                }
                return task
              }),
              updatedAt: g.id === groupId ? t : g.updatedAt,
            })),
            updatedAt: t,
          }
        }),
      }
    }

    case "TOGGLE_TASK": {
      const { projectId, groupId, taskId } = action.payload
      return {
        ...state,
        projects: state.projects.map((proj) => {
          if (proj.id !== projectId) return proj
          return {
            ...proj,
            groups: proj.groups.map((g) => {
              if (g.id !== groupId) return g
              return {
                ...g,
                tasks: g.tasks.map((task) => {
                  if (task.id !== taskId) return task
                  const completed =
                    typeof action.payload.completed === "boolean"
                      ? action.payload.completed
                      : !task.completed
                  return {
                    ...task,
                    completed,
                    status: completed ? "done" : "planned",
                    statusChangedAt: t,
                    completedAt: completed ? t : undefined,
                    isNextAction: completed ? false : task.isNextAction,
                    updatedAt: t,
                  }
                }),
                updatedAt: t,
              }
            }),
            updatedAt: t,
          }
        }),
      }
    }

    case "DELETE_TASK": {
      const { projectId, groupId, taskId } = action.payload
      return {
        ...state,
        projects: state.projects.map((proj) => {
          if (proj.id !== projectId) return proj
          return {
            ...proj,
            groups: proj.groups.map((g) => {
              if (g.id !== groupId) return g
              return {
                ...g,
                tasks: g.tasks.filter((task) => task.id !== taskId),
                updatedAt: t,
              }
            }),
            updatedAt: t,
          }
        }),
      }
    }

    case "ADD_HABIT": {
      const habit: Habit = {
        id: action.payload.id ?? createId("habit"),
        name: action.payload.name,
        description: action.payload.description,
        goalId: action.payload.goalId,
        projectId: action.payload.projectId,
        schedule: action.payload.schedule,
        settings: action.payload.settings,
        dailyStatus: {},
        dailyEntries: {},
        createdAt: action.payload.createdAt ?? t,
        updatedAt: action.payload.updatedAt ?? t,
      }
      return { ...state, habits: [...state.habits, habit] }
    }

    case "UPDATE_HABIT": {
      const { id, patch } = action.payload
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === id ? { ...h, ...patch, updatedAt: t } : h,
        ),
      }
    }

    case "DELETE_HABIT": {
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.payload.id),
      }
    }

    case "SET_HABIT_ENTRY": {
      const { id, date, entry } = action.payload
      return {
        ...state,
        habits: state.habits.map((habit) => {
          if (habit.id !== id) return habit
          return {
            ...habit,
            dailyEntries: {
              ...(habit.dailyEntries ?? {}),
              [date]: entry,
            },
            dailyStatus: {
              ...habit.dailyStatus,
              [date]: entry.completed,
            },
            updatedAt: t,
          }
        }),
      }
    }

    case "TOGGLE_HABIT_DATE": {
      const { id, date } = action.payload
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== id) return h
          const prev = h.dailyStatus[date]
          const nextVal =
            typeof action.payload.completed === "boolean"
              ? action.payload.completed
              : prev !== true
          return {
            ...h,
            dailyStatus: { ...h.dailyStatus, [date]: nextVal },
            dailyEntries: {
              ...(h.dailyEntries ?? {}),
              [date]: {
                ...(h.dailyEntries?.[date] ?? {}),
                completed: nextVal,
                skipped: false,
                status: nextVal ? "completed" : "planned",
                reason: undefined,
                helped: undefined,
                rescheduledTo: undefined,
                recordedAt: t,
              },
            },
            updatedAt: t,
          }
        }),
      }
    }

    case "ADD_MILESTONE": {
      const p = action.payload
      const milestone: Milestone = {
        id: p.id ?? createId("milestone"),
        ...(p.goalId !== undefined ? { goalId: p.goalId } : {}),
        projectId: p.projectId,
        title: p.title,
        date: p.date,
        completed: p.completed ?? false,
        createdAt: p.createdAt ?? t,
        updatedAt: p.updatedAt ?? t,
      }
      return { ...state, milestones: [...state.milestones, milestone] }
    }

    case "UPDATE_MILESTONE": {
      const { id, patch } = action.payload
      return {
        ...state,
        milestones: state.milestones.map((m) =>
          m.id === id ? { ...m, ...patch, updatedAt: t } : m,
        ),
      }
    }

    case "DELETE_MILESTONE": {
      return {
        ...state,
        milestones: state.milestones.filter((m) => m.id !== action.payload.id),
      }
    }

    case "TOGGLE_MILESTONE": {
      const id = action.payload.id
      return {
        ...state,
        milestones: state.milestones.map((m) =>
          m.id === id
            ? {
                ...m,
                completed:
                  typeof action.payload.completed === "boolean"
                    ? action.payload.completed
                    : !m.completed,
                updatedAt: t,
              }
            : m,
        ),
      }
    }

    case "UPDATE_SETTINGS": {
      return {
        ...state,
        settings: { ...state.settings, ...action.payload.patch },
      }
    }
  }
}
