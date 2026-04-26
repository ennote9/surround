import { Pencil, Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Progress } from "@/components/ui/progress"
import { getCharacterStatTitle } from "@/features/dashboard/characterStats"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import { formatDateOnly } from "@/shared/lib/dateFormat"
import {
  DEFAULT_PROJECT_GROUPS_COLLAPSE_MODE,
  normalizeProjectGroupsCollapseMode,
} from "@/shared/lib/projectGroupsCollapse"
import {
  getProjectPhaseBadgeClassName,
  getProjectPhaseTitle,
} from "@/shared/lib/projectPhases"
import {
  COLLAPSED_PROJECT_GROUPS_STORAGE_KEY,
  PROJECT_GROUPS_COLLAPSE_MODE_STORAGE_KEY,
} from "@/shared/lib/storageKeys"
import type { Project } from "@/store/appState.types"
import { getGroupProgress, getProjectProgress, getProjectTaskStats } from "@/store/selectors"
import { TaskItem } from "./TaskItem"

type ProjectViewProps = {
  project: Project
  onEditProject: () => void
  onDeleteProject: () => void
  onAddGroup: () => void
  onEditGroup: (groupId: string) => void
  onDeleteGroup: (groupId: string) => void
  onAddTask: (groupId: string) => void
  onEditTask: (groupId: string, taskId: string) => void
  onDeleteTask: (groupId: string, taskId: string) => void
  onToggleTask: (groupId: string, taskId: string) => void
}

type CollapsedProjectGroupsByProjectId = Record<string, string[]>

function getSavedCollapsedGroupIds(
  value: unknown,
  projectId: string,
): string[] | undefined {
  if (!value || typeof value !== "object") return undefined
  const raw = (value as Record<string, unknown>)[projectId]
  if (!Array.isArray(raw)) return undefined
  return raw.filter((id): id is string => typeof id === "string")
}

function getInitialCollapsedGroupIds(params: {
  projectId: string
  groupIds: string[]
  mode: ReturnType<typeof normalizeProjectGroupsCollapseMode>
  savedCollapsedIds?: string[]
}): string[] {
  const { groupIds, mode, savedCollapsedIds } = params

  if (mode === "expanded") {
    return []
  }

  if (mode === "collapsed") {
    return [...groupIds]
  }

  if (mode === "smart") {
    return groupIds.length > 3 ? [...groupIds] : []
  }

  if (savedCollapsedIds) {
    const groupIdsSet = new Set(groupIds)
    return savedCollapsedIds.filter((id) => groupIdsSet.has(id))
  }

  return groupIds.length > 3 ? [...groupIds] : []
}

export function ProjectView({
  project,
  onEditProject,
  onDeleteProject,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
}: ProjectViewProps) {
  const progress = getProjectProgress(project)
  const stats = getProjectTaskStats(project)
  const sortedGroups = useMemo(
    () => [...project.groups].sort((a, b) => a.order - b.order),
    [project.groups],
  )
  const groupIds = useMemo(
    () => sortedGroups.map((group) => group.id),
    [sortedGroups],
  )
  const groupIdsKey = useMemo(() => groupIds.join("|"), [groupIds])

  const [rawGroupsCollapseMode] = useLocalStorage(
    PROJECT_GROUPS_COLLAPSE_MODE_STORAGE_KEY,
    DEFAULT_PROJECT_GROUPS_COLLAPSE_MODE,
  )
  const groupsCollapseMode = normalizeProjectGroupsCollapseMode(
    rawGroupsCollapseMode,
  )

  const [collapsedProjectGroupsByProjectId, setCollapsedProjectGroupsByProjectId] =
    useLocalStorage<CollapsedProjectGroupsByProjectId>(
      COLLAPSED_PROJECT_GROUPS_STORAGE_KEY,
      {},
    )

  const [collapsedOverridesByContext, setCollapsedOverridesByContext] = useState<
    Record<string, string[]>
  >({})
  const collapseContextKey = `${project.id}::${groupsCollapseMode}::${groupIdsKey}`
  const savedCollapsedIds = getSavedCollapsedGroupIds(
    collapsedProjectGroupsByProjectId,
    project.id,
  )
  const initialCollapsedIds = useMemo(
    () =>
      getInitialCollapsedGroupIds({
        projectId: project.id,
        groupIds,
        mode: groupsCollapseMode,
        savedCollapsedIds,
      }),
    [project.id, groupIds, groupsCollapseMode, savedCollapsedIds],
  )
  const effectiveCollapsedIds =
    collapsedOverridesByContext[collapseContextKey] ?? initialCollapsedIds
  const collapsedGroupIds = useMemo(
    () => new Set(effectiveCollapsedIds),
    [effectiveCollapsedIds],
  )

  const persistCollapsedGroupsForProject = (projectId: string, collapsedIds: string[]) => {
    if (groupsCollapseMode !== "remember-per-project") {
      return
    }
    setCollapsedProjectGroupsByProjectId((current) => ({
      ...current,
      [projectId]: collapsedIds,
    }))
  }

  const updateCollapsedGroups = (nextCollapsedIds: string[]) => {
    setCollapsedOverridesByContext((current) => ({
      ...current,
      [collapseContextKey]: nextCollapsedIds,
    }))
    persistCollapsedGroupsForProject(project.id, nextCollapsedIds)
  }

  const handleExpandAllGroups = () => {
    updateCollapsedGroups([])
  }

  const handleCollapseAllGroups = () => {
    updateCollapsedGroups(groupIds)
  }

  const handleExpandedGroupsChange = (expandedGroupIds: string[]) => {
    const expandedSet = new Set(expandedGroupIds)
    const nextCollapsedIds = groupIds.filter((id) => !expandedSet.has(id))
    updateCollapsedGroups(nextCollapsedIds)
  }

  const expandedGroupIds = useMemo(
    () => groupIds.filter((id) => !collapsedGroupIds.has(id)),
    [groupIds, collapsedGroupIds],
  )

  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-start gap-2 sm:items-center">
            <CharacterStatIcon
              statType={project.statType}
              className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 sm:mt-0"
            />
            <h2 className="min-w-0 flex-1 break-words text-xl font-semibold text-slate-950 lg:truncate">
              {project.title}
            </h2>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-pretty text-xs">
            <span
              className={
                project.showOnDashboard === false
                  ? "text-orange-600"
                  : "text-slate-500"
              }
            >
              {project.showOnDashboard === false
                ? "Скрыт с Главной"
                : "На Главной"}
            </span>
            <span className="text-slate-400">·</span>
            <span
              className={
                project.statType
                  ? "text-slate-500"
                  : "text-slate-400"
              }
            >
              {project.statType
                ? `Стат персонажа: ${getCharacterStatTitle(project.statType)}`
                : "Стат персонажа не назначен"}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">
              Фаза:{" "}
              <span
                className={getProjectPhaseBadgeClassName(project.phase)}
              >
                {getProjectPhaseTitle(project.phase)}
              </span>
            </span>
            {project.targetDate ? (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">
                  Цель: {formatDateOnly(project.targetDate)}
                </span>
              </>
            ) : null}
          </div>
          {project.description ? (
            <p className="mt-2 break-words text-sm text-slate-600">
              {project.description}
            </p>
          ) : null}
          <div className="mt-3 space-y-2">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <Progress
                value={stats.total > 0 ? progress : 0}
                className="h-2 min-w-0 flex-1 bg-slate-200 lg:max-w-xs [&>[data-slot=progress-indicator]]:bg-blue-600"
              />
              <span className="shrink-0 text-sm font-medium text-blue-600">
                {progress}%
              </span>
            </div>
            <p className="text-pretty text-sm text-slate-600">
              Задач: {stats.completed} / {stats.total} выполнено, в ожидании:{" "}
              {stats.pending}
            </p>
          </div>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-2 lg:w-auto lg:flex-row lg:flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 w-full border-slate-300 text-slate-700 lg:w-auto lg:min-h-9"
            onClick={onEditProject}
          >
            Редактировать
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-10 w-full border-red-200 text-red-600 hover:bg-red-50 lg:w-auto lg:min-h-9"
            onClick={onDeleteProject}
          >
            Удалить
          </Button>
          <Button
            type="button"
            size="sm"
            className="min-h-10 w-full bg-blue-600 text-white hover:bg-blue-700 lg:w-auto lg:min-h-9"
            onClick={onAddGroup}
          >
            <Plus className="mr-1 size-4" />
            Добавить группу
          </Button>
        </div>
      </div>

      {sortedGroups.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-600">В проекте пока нет групп задач</p>
          <Button
            type="button"
            className="mt-4 min-h-10 w-full max-w-xs bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            onClick={onAddGroup}
          >
            Добавить группу
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {sortedGroups.length > 1 ? (
            <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 border-slate-300 text-slate-700 sm:min-h-9"
                onClick={handleExpandAllGroups}
              >
                Развернуть все
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-10 border-slate-300 text-slate-700 sm:min-h-9"
                onClick={handleCollapseAllGroups}
              >
                Свернуть все
              </Button>
            </div>
          ) : null}
          <Accordion
            type="multiple"
            value={expandedGroupIds}
            onValueChange={handleExpandedGroupsChange}
            className="w-full"
          >
          {sortedGroups.map((group) => {
            const gProgress = getGroupProgress(group)
            const taskCount = group.tasks.length

            return (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="border-slate-200"
              >
                <AccordionTrigger className="min-h-11 items-center py-3 hover:no-underline">
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-1 pr-2 text-left sm:flex-row sm:items-center sm:gap-4">
                    <span className="min-w-0 break-words font-medium text-slate-950 sm:truncate">
                      {group.title}
                    </span>
                    <span className="shrink-0 text-xs text-slate-600">
                      {gProgress}% · Задач: {taskCount}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="grid grid-cols-1 gap-2 border-b border-slate-100 pb-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-10 w-full border-slate-300 sm:w-auto sm:min-h-9"
                      onClick={() => onEditGroup(group.id)}
                    >
                      <Pencil className="mr-1 size-3.5" />
                      Группа
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-10 w-full border-red-200 text-red-600 hover:bg-red-50 sm:w-auto sm:min-h-9"
                      onClick={() => onDeleteGroup(group.id)}
                    >
                      <Trash2 className="mr-1 size-3.5" />
                      Удалить
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="min-h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto sm:min-h-9"
                      onClick={() => onAddTask(group.id)}
                    >
                      <Plus className="mr-1 size-3.5" />
                      Задача
                    </Button>
                  </div>

                  {group.tasks.length === 0 ? (
                    <div className="py-6 text-center">
                      <p className="text-sm text-slate-600">
                        В этой группе пока нет задач
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        className="mt-3 min-h-10 w-full max-w-xs bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
                        onClick={() => onAddTask(group.id)}
                      >
                        Добавить задачу
                      </Button>
                    </div>
                  ) : (
                    <ul className="mt-3 flex flex-col gap-2">
                      {group.tasks.map((task) => (
                        <li key={task.id}>
                          <TaskItem
                            task={task}
                            onToggle={() => onToggleTask(group.id, task.id)}
                            onEdit={() => onEditTask(group.id, task.id)}
                            onDelete={() => onDeleteTask(group.id, task.id)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
            )
          })}
          </Accordion>
        </div>
      )}
    </div>
  )
}
