import { CalendarDays, CircleAlert, Clock3, Pencil, Plus, Trash2 } from "lucide-react"
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
import { formatDateOnly } from "@/shared/lib/dateFormat"
import { getTodayISO } from "@/shared/lib/dates"
import { getTaskStatus } from "@/shared/lib/workManagement"
import {
  compareTasksByDeadline,
  formatTaskScheduleLabel,
  isTaskOverdue,
} from "@/shared/lib/taskSchedule"
import { getHabitTimingLabel } from "@/shared/lib/habitEntries"
import {
  getProjectPhaseBadgeClassName,
  getProjectPhaseTitle,
} from "@/shared/lib/projectPhases"
import type { Habit, Project } from "@/store/appState.types"
import {
  getGroupProgress,
  getHabitTotalCompliance,
  getProjectNextTask,
  getProjectProgress,
  getProjectTaskStats,
} from "@/store/selectors"
import { TaskItem } from "./TaskItem"

type ProjectViewProps = {
  project: Project
  habits: Habit[]
  /** Подпись цели из `getProjectGoalLabel` — «Без цели» или название цели */
  goalContextLabel: string
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

const NO_GOAL_LABEL = "Без цели"

function ProjectViewContent({
  project,
  habits,
  goalContextLabel,
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
  const openTasks = project.groups
    .flatMap((group) => group.tasks)
    .filter((task) => getTaskStatus(task) !== "done")
  const inProgress = openTasks.filter(
    (task) => getTaskStatus(task) === "in_progress",
  ).length
  // Reuse the same date/time-aware overdue rule as the project selector.
  const overdue = openTasks.filter((task) => isTaskOverdue(task)).length
  const waitingOrControl = openTasks.filter((task) => {
    const status = getTaskStatus(task)
    return status === "waiting" || status === "delegated" || Boolean(task.followUpDate)
  }).length
  const today = getTodayISO()
  const nearestDeadline = openTasks
    .filter((task) => task.deadline && task.deadline.slice(0, 10) >= today)
    .sort(compareTasksByDeadline)[0]
  const nextTask = getProjectNextTask(project)
  const hasIndicators = inProgress > 0 || overdue > 0 ||
    waitingOrControl > 0 || Boolean(nearestDeadline)
  const linkedHabits = useMemo(
    () => habits.filter((habit) => habit.projectId === project.id),
    [habits, project.id],
  )
  const sortedGroups = useMemo(
    () => [...project.groups].sort((a, b) => a.order - b.order),
    [project.groups],
  )
  const groupIds = useMemo(
    () => sortedGroups.map((group) => group.id),
    [sortedGroups],
  )
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const expandedGroupIds = expandedIds.filter((id) => groupIds.includes(id))

  const handleExpandAllGroups = () => {
    setExpandedIds(groupIds)
  }

  const handleCollapseAllGroups = () => {
    setExpandedIds([])
  }

  const handleExpandedGroupsChange = (nextExpandedIds: string[]) => {
    setExpandedIds(nextExpandedIds.filter((id) => groupIds.includes(id)))
  }

  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <section aria-label="Сводка проекта" className="space-y-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-start gap-2 sm:items-center">
              <CharacterStatIcon
                statType={project.statType}
                className="mt-0.5 h-5 w-5 shrink-0 text-slate-600 sm:mt-0"
              />
              <h2 className="min-w-0 flex-1 break-words text-xl font-semibold text-slate-950 dark:text-slate-100">
                {project.title}
              </h2>
            </div>
            <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              {goalContextLabel === NO_GOAL_LABEL ? (
                <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">Без цели</span>
              ) : (
                <span className="min-w-0 break-words">Цель: {goalContextLabel}</span>
              )}
              <span className={getProjectPhaseBadgeClassName(project.phase)}>
                {getProjectPhaseTitle(project.phase)}
              </span>
              <span>{project.showOnDashboard === false ? "Скрыт с Главной" : "На Главной"}</span>
              {project.statType ? (
                <span>{getCharacterStatTitle(project.statType)}</span>
              ) : null}
              {project.targetDate ? (
                <span>Срок проекта: <time dateTime={project.targetDate}>{formatDateOnly(project.targetDate)}</time></span>
              ) : null}
            </div>
            {project.description ? (
              <p className="mt-2 line-clamp-2 break-words text-sm leading-5 text-slate-600 dark:text-slate-400" title={project.description}>
                {project.description}
              </p>
            ) : null}
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
            Добавить этап
          </Button>
        </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400">Прогресс</h3>
            <p className="text-sm tabular-nums text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-blue-600 dark:text-blue-400">{progress}%</span>
              <span className="mx-2 text-slate-300 dark:text-slate-600" aria-hidden>·</span>
              {stats.completed} из {stats.total} выполнено
            </p>
          </div>
          <Progress
            value={stats.total > 0 ? progress : 0}
            aria-label="Прогресс проекта"
            className="h-2 w-full bg-slate-200 dark:bg-slate-800 [&>[data-slot=progress-indicator]]:bg-blue-600"
          />
        </div>

        {hasIndicators ? (
          <div aria-label="Состояние задач проекта" className="flex min-w-0 flex-wrap gap-2 text-xs">
            {inProgress > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-blue-50/50 px-2.5 py-1 font-medium text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/5 dark:text-blue-300">
                <span className="size-1.5 rounded-full bg-current" aria-hidden />{inProgress} в работе
              </span>
            ) : null}
            {overdue > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-red-200/70 bg-red-50/40 px-2.5 py-1 font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/5 dark:text-red-300">
                <CircleAlert className="size-3.5" aria-hidden />{overdue} просрочено
              </span>
            ) : null}
            {waitingOrControl > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/70 bg-amber-50/40 px-2.5 py-1 font-medium text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/5 dark:text-amber-300">
                <Clock3 className="size-3.5" aria-hidden />{waitingOrControl} жду / контроль
              </span>
            ) : null}
            {nearestDeadline ? (
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                <CalendarDays className="size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 break-words">Ближайший срок: <time dateTime={nearestDeadline.deadline}>{formatTaskScheduleLabel(nearestDeadline.deadline, nearestDeadline.deadlineTime)}</time></span>
              </span>
            ) : null}
          </div>
        ) : null}

        {nextTask ? (
          <p className="flex min-w-0 items-baseline gap-2 text-sm leading-5">
            <span className="shrink-0 text-slate-500 dark:text-slate-400">Следующая <span aria-hidden>→</span></span>
            <span className="min-w-0 truncate font-medium text-slate-800 dark:text-slate-200" title={nextTask.task.title}>{nextTask.task.title}</span>
          </p>
        ) : null}
      </section>

      {linkedHabits.length > 0 ? (
        <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Поддержка проекта
              </p>
              <h3 className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
                Связанные привычки
              </h3>
            </div>
            <span className="text-xs text-slate-400">
              {linkedHabits.length}
            </span>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {linkedHabits.map((habit) => (
              <div
                key={habit.id}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-950 dark:text-slate-100">
                      {habit.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {getHabitTimingLabel(habit)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-blue-600 dark:text-blue-400">
                    {getHabitTotalCompliance(habit)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="project-stages-heading" className="mt-6 space-y-4">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 id="project-stages-heading" className="text-base font-semibold text-slate-800 dark:text-slate-200">
            Этапы проекта <span className="ml-2 text-sm font-normal tabular-nums text-slate-500 dark:text-slate-400">· {sortedGroups.length}</span>
          </h3>
          {sortedGroups.length > 1 ? (
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Button type="button" variant="outline" size="sm" className="min-h-10 border-slate-300 text-slate-700 sm:min-h-9" onClick={handleExpandAllGroups}>
                Развернуть все
              </Button>
              <Button type="button" variant="outline" size="sm" className="min-h-10 border-slate-300 text-slate-700 sm:min-h-9" onClick={handleCollapseAllGroups}>
                Свернуть все
              </Button>
            </div>
          ) : null}
        </div>
      {sortedGroups.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm text-slate-600">В проекте пока нет этапов</p>
          <Button
            type="button"
            className="mt-4 min-h-10 w-full max-w-xs bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
            onClick={onAddGroup}
          >
            Добавить этап
          </Button>
        </div>
      ) : (
          <Accordion
            type="multiple"
            value={expandedGroupIds}
            onValueChange={handleExpandedGroupsChange}
            className="w-full gap-4"
          >
          {sortedGroups.map((group) => {
            const gProgress = getGroupProgress(group)
            const taskCount = group.tasks.length

            return (
              <AccordionItem
                key={group.id}
                value={group.id}
                className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-700 dark:bg-slate-950/30"
              >
                <AccordionTrigger className="min-h-11 items-center gap-3 rounded-none px-4 py-4 hover:bg-slate-100/80 hover:no-underline focus-visible:ring-2 focus-visible:ring-inset dark:hover:bg-slate-800/50">
                  <div className="min-w-0 flex-1 space-y-3 text-left">
                    <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                      <span className="min-w-0 break-words text-base font-semibold text-slate-800 dark:text-slate-200">
                        {group.title}
                      </span>
                      <span className="shrink-0 text-xs font-normal tabular-nums text-slate-500 dark:text-slate-400">
                        {gProgress}% · Задач: {taskCount}
                      </span>
                    </div>
                    <Progress
                      value={gProgress}
                      aria-label={`Прогресс этапа: ${group.title}`}
                      className="h-1 w-full bg-slate-200/80 dark:bg-slate-700 [&>[data-slot=progress-indicator]]:bg-blue-500/70"
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="border-t border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="grid grid-cols-1 gap-2 border-b border-slate-100 pb-3 sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-10 w-full border-slate-300 sm:w-auto sm:min-h-9"
                      onClick={() => onEditGroup(group.id)}
                    >
                      <Pencil className="mr-1 size-3.5" />
                      Этап
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
                        В этом этапе пока нет задач
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
                            project={project}
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
      )}
      </section>
    </div>
  )
}
export function ProjectView(props: ProjectViewProps) {
  // A new project opening gets fresh UI state, including when returning to it.
  return <ProjectViewContent key={props.project.id} {...props} />
}
