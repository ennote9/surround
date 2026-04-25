import { createId } from "@/shared/lib/ids"
import type { AppState, Habit, Milestone, Project, Task, TaskGroup } from "./appState.types"
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

    case "ADD_PROJECT": {
      const p = action.payload
      const project: Project = {
        id: createId("project"),
        title: p.title,
        description: p.description,
        targetDate: p.targetDate?.trim() || undefined,
        showOnDashboard: p.showOnDashboard ?? true,
        phase: p.phase ?? "active",
        groups: [],
        createdAt: t,
        updatedAt: t,
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
            id: createId("group"),
            projectId,
            title,
            tasks: [],
            order: maxOrder + 1,
            createdAt: t,
            updatedAt: t,
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
      const { projectId, groupId, title, deadline, notes, priority } =
        action.payload
      const task: Task = {
        id: createId("task"),
        groupId,
        projectId,
        title,
        completed: false,
        deadline,
        notes,
        priority,
        createdAt: t,
        updatedAt: t,
      }
      return {
        ...state,
        projects: state.projects.map((proj) => {
          if (proj.id !== projectId) return proj
          return {
            ...proj,
            groups: proj.groups.map((g) =>
              g.id === groupId
                ? {
                    ...g,
                    tasks: [...g.tasks, task],
                    updatedAt: t,
                  }
                : g,
            ),
            updatedAt: t,
          }
        }),
      }
    }

    case "UPDATE_TASK": {
      const { projectId, groupId, taskId, patch } = action.payload
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
                tasks: g.tasks.map((task) =>
                  task.id === taskId
                    ? { ...task, ...patch, updatedAt: t }
                    : task,
                ),
                updatedAt: t,
              }
            }),
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
                tasks: g.tasks.map((task) =>
                  task.id === taskId
                    ? {
                        ...task,
                        completed: !task.completed,
                        updatedAt: t,
                      }
                    : task,
                ),
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
        id: createId("habit"),
        name: action.payload.name,
        description: action.payload.description,
        dailyStatus: {},
        createdAt: t,
        updatedAt: t,
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

    case "TOGGLE_HABIT_DATE": {
      const { id, date } = action.payload
      return {
        ...state,
        habits: state.habits.map((h) => {
          if (h.id !== id) return h
          const prev = h.dailyStatus[date]
          const nextVal = prev !== true
          return {
            ...h,
            dailyStatus: { ...h.dailyStatus, [date]: nextVal },
            updatedAt: t,
          }
        }),
      }
    }

    case "ADD_MILESTONE": {
      const p = action.payload
      const milestone: Milestone = {
        id: createId("milestone"),
        projectId: p.projectId,
        title: p.title,
        date: p.date,
        completed: p.completed ?? false,
        createdAt: t,
        updatedAt: t,
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
            ? { ...m, completed: !m.completed, updatedAt: t }
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
