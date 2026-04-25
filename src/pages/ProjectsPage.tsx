import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { DeleteConfirmDialog } from "@/features/projects/components/DeleteConfirmDialog"
import { GroupDialog } from "@/features/projects/components/GroupDialog"
import {
  ProjectDialog,
  type ProjectFormValues,
} from "@/features/projects/components/ProjectDialog"
import { ProjectList } from "@/features/projects/components/ProjectList"
import { ProjectView } from "@/features/projects/components/ProjectView"
import {
  TaskDialog,
  type TaskFormValues,
} from "@/features/projects/components/TaskDialog"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import {
  ALL_GOALS_SCOPE,
  getSelectableGoals,
  getSelectedGoalTitle,
  normalizeSelectedGoalId,
} from "@/shared/lib/selectedGoal"
import {
  SELECTED_GOAL_STORAGE_KEY,
  SELECTED_PROJECT_STORAGE_KEY,
} from "@/shared/lib/storageKeys"
import type { Project, Task, TaskGroup } from "@/store/appState.types"
import { useAppState } from "@/store/useAppState"

type DeleteTarget =
  | { kind: "project"; id: string; name: string }
  | {
      kind: "group"
      projectId: string
      groupId: string
      name: string
    }
  | {
      kind: "task"
      projectId: string
      groupId: string
      taskId: string
      name: string
    }

export default function ProjectsPage() {
  const { state, dispatch } = useAppState()

  const [rawSelectedGoalId] = useLocalStorage(
    SELECTED_GOAL_STORAGE_KEY,
    ALL_GOALS_SCOPE,
  )
  const selectedGoalId = normalizeSelectedGoalId(rawSelectedGoalId, state.goals)
  const selectableGoals = getSelectableGoals(state.goals)

  const visibleGoalIds = useMemo(
    () => new Set(selectableGoals.map((goal) => goal.id)),
    [selectableGoals],
  )
  const scopedProjects = useMemo(() => {
    if (selectedGoalId === ALL_GOALS_SCOPE) {
      return state.projects.filter((project) => {
        if (!project.goalId) return visibleGoalIds.has("goal-canada")
        return visibleGoalIds.has(project.goalId)
      })
    }
    return state.projects.filter((project) => project.goalId === selectedGoalId)
  }, [selectedGoalId, state.projects, visibleGoalIds])

  const defaultGoalId =
    selectedGoalId === ALL_GOALS_SCOPE ? selectableGoals[0]?.id : selectedGoalId

  const [selectedProjectId, setSelectedProjectId] = useLocalStorage<string>(
    SELECTED_PROJECT_STORAGE_KEY,
    "",
  )

  const [projectDialogOpen, setProjectDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)

  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [groupDialogProjectId, setGroupDialogProjectId] = useState<string | null>(
    null,
  )
  const [editingGroup, setEditingGroup] = useState<TaskGroup | null>(null)

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [taskDialogProjectId, setTaskDialogProjectId] = useState<string | null>(
    null,
  )
  const [taskDialogGroupId, setTaskDialogGroupId] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  // Синхронизация выбора после удаления проекта или смены списка (данные из store).
  useEffect(() => {
    if (scopedProjects.length === 0) {
      queueMicrotask(() => setSelectedProjectId(""))
      return
    }
    if (!scopedProjects.some((p) => p.id === selectedProjectId)) {
      queueMicrotask(() => setSelectedProjectId(scopedProjects[0].id))
    }
  }, [scopedProjects, selectedProjectId, setSelectedProjectId])

  const selectedProject = useMemo(() => {
    if (scopedProjects.length === 0) return undefined
    return (
      scopedProjects.find((project) => project.id === selectedProjectId) ??
      scopedProjects[0]
    )
  }, [scopedProjects, selectedProjectId])

  const openAddProject = () => {
    setEditingProject(null)
    setProjectDialogOpen(true)
  }

  const openEditProject = (project: Project) => {
    setEditingProject(project)
    setProjectDialogOpen(true)
  }

  const handleProjectSubmit = (values: ProjectFormValues) => {
    if (editingProject) {
      dispatch({
        type: "UPDATE_PROJECT",
        payload: {
          id: editingProject.id,
          patch: {
            title: values.title,
            goalId: values.goalId,
            description: values.description,
            showOnDashboard: values.showOnDashboard,
            statType: values.statType,
            phase: values.phase,
            targetDate: values.targetDate,
          },
        },
      })
      toast.success("Проект обновлён")
    } else {
      dispatch({
        type: "ADD_PROJECT",
        payload: {
          title: values.title,
          goalId: values.goalId || defaultGoalId,
          description: values.description,
          showOnDashboard: values.showOnDashboard ?? true,
          statType: values.statType,
          phase: values.phase ?? "active",
          targetDate: values.targetDate,
        },
      })
      toast.success("Проект создан")
    }
  }

  const openAddGroup = (projectId: string) => {
    setGroupDialogProjectId(projectId)
    setEditingGroup(null)
    setGroupDialogOpen(true)
  }

  const openEditGroup = (projectId: string, group: TaskGroup) => {
    setGroupDialogProjectId(projectId)
    setEditingGroup(group)
    setGroupDialogOpen(true)
  }

  const handleGroupSubmit = (values: { title: string }) => {
    if (!groupDialogProjectId) return
    if (editingGroup) {
      dispatch({
        type: "UPDATE_GROUP",
        payload: {
          projectId: groupDialogProjectId,
          groupId: editingGroup.id,
          patch: { title: values.title },
        },
      })
      toast.success("Группа обновлена")
    } else {
      dispatch({
        type: "ADD_GROUP",
        payload: { projectId: groupDialogProjectId, title: values.title },
      })
      toast.success("Группа создана")
    }
  }

  const openAddTask = (projectId: string, groupId: string) => {
    setTaskDialogProjectId(projectId)
    setTaskDialogGroupId(groupId)
    setEditingTask(null)
    setTaskDialogOpen(true)
  }

  const openEditTask = (projectId: string, groupId: string, task: Task) => {
    setTaskDialogProjectId(projectId)
    setTaskDialogGroupId(groupId)
    setEditingTask(task)
    setTaskDialogOpen(true)
  }

  const handleTaskSubmit = (values: TaskFormValues) => {
    if (!taskDialogProjectId || !taskDialogGroupId) return
    if (editingTask) {
      dispatch({
        type: "UPDATE_TASK",
        payload: {
          projectId: taskDialogProjectId,
          groupId: taskDialogGroupId,
          taskId: editingTask.id,
          patch: {
            title: values.title,
            deadline: values.deadline,
            notes: values.notes,
            priority: values.priority,
          },
        },
      })
      toast.success("Задача обновлена")
    } else {
      dispatch({
        type: "ADD_TASK",
        payload: {
          projectId: taskDialogProjectId,
          groupId: taskDialogGroupId,
          title: values.title,
          deadline: values.deadline,
          notes: values.notes,
          priority: values.priority,
        },
      })
      toast.success("Задача создана")
    }
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    if (deleteTarget.kind === "project") {
      dispatch({
        type: "DELETE_PROJECT",
        payload: { id: deleteTarget.id },
      })
      toast.success("Проект удалён")
    } else if (deleteTarget.kind === "group") {
      dispatch({
        type: "DELETE_GROUP",
        payload: {
          projectId: deleteTarget.projectId,
          groupId: deleteTarget.groupId,
        },
      })
      toast.success("Группа удалена")
    } else {
      dispatch({
        type: "DELETE_TASK",
        payload: {
          projectId: deleteTarget.projectId,
          groupId: deleteTarget.groupId,
          taskId: deleteTarget.taskId,
        },
      })
      toast.success("Задача удалена")
    }
    setDeleteTarget(null)
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Проекты и задачи
        </h1>
        <p className="mt-3 text-slate-600">
          Управление проектами, группами задач, дедлайнами и прогрессом.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <ProjectList
          projects={scopedProjects}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onAddProject={openAddProject}
        />

        <div className="min-w-0">
          {scopedProjects.length > 0 && selectedProject ? (
            <ProjectView
              project={selectedProject}
              onEditProject={() => openEditProject(selectedProject)}
              onDeleteProject={() =>
                setDeleteTarget({
                  kind: "project",
                  id: selectedProject.id,
                  name: selectedProject.title,
                })
              }
              onAddGroup={() => openAddGroup(selectedProject.id)}
              onEditGroup={(groupId) => {
                const g = selectedProject.groups.find((x) => x.id === groupId)
                if (g) openEditGroup(selectedProject.id, g)
              }}
              onDeleteGroup={(groupId) => {
                const g = selectedProject.groups.find((x) => x.id === groupId)
                if (g)
                  setDeleteTarget({
                    kind: "group",
                    projectId: selectedProject.id,
                    groupId,
                    name: g.title,
                  })
              }}
              onAddTask={(groupId) => openAddTask(selectedProject.id, groupId)}
              onEditTask={(groupId, taskId) => {
                const g = selectedProject.groups.find((x) => x.id === groupId)
                const t = g?.tasks.find((x) => x.id === taskId)
                if (t) openEditTask(selectedProject.id, groupId, t)
              }}
              onDeleteTask={(groupId, taskId) => {
                const g = selectedProject.groups.find((x) => x.id === groupId)
                const t = g?.tasks.find((x) => x.id === taskId)
                if (t)
                  setDeleteTarget({
                    kind: "task",
                    projectId: selectedProject.id,
                    groupId,
                    taskId,
                    name: t.title,
                  })
              }}
              onToggleTask={(groupId, taskId) => {
                dispatch({
                  type: "TOGGLE_TASK",
                  payload: {
                    projectId: selectedProject.id,
                    groupId,
                    taskId,
                  },
                })
              }}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="font-medium text-slate-950">
                {selectedGoalId === ALL_GOALS_SCOPE
                  ? "Проектов пока нет"
                  : `В цели «${getSelectedGoalTitle(selectedGoalId, state.goals)}» пока нет проектов`}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {selectedGoalId === ALL_GOALS_SCOPE
                  ? "Создайте первый проект в списке слева, чтобы планировать задачи и дедлайны."
                  : "Создайте первый проект для выбранной цели."}
              </p>
            </div>
          )}
        </div>
      </div>

      <ProjectDialog
        open={projectDialogOpen}
        onOpenChange={setProjectDialogOpen}
        initialProject={editingProject ?? undefined}
        goals={selectableGoals}
        defaultGoalId={defaultGoalId}
        onSubmit={handleProjectSubmit}
      />

      <GroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        initialGroup={editingGroup ?? undefined}
        onSubmit={handleGroupSubmit}
      />

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        initialTask={editingTask ?? undefined}
        onSubmit={handleTaskSubmit}
      />

      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={
          !deleteTarget
            ? ""
            : deleteTarget.kind === "project"
              ? "Удалить проект?"
              : deleteTarget.kind === "group"
                ? "Удалить группу?"
                : "Удалить задачу?"
        }
        description={
          !deleteTarget
            ? ""
            : deleteTarget.kind === "project"
              ? `Проект «${deleteTarget.name}» и все его группы и задачи будут удалены безвозвратно.`
              : deleteTarget.kind === "group"
                ? `Группа «${deleteTarget.name}» и все задачи внутри неё будут удалены.`
                : `Задача «${deleteTarget.name}» будет удалена.`
        }
        onConfirm={confirmDelete}
      />
    </div>
  )
}
