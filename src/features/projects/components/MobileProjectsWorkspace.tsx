import { useMemo, useState } from "react"
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Circle,
  Flag,
  FolderKanban,
  MoreHorizontal,
  Pencil,
  Plus,
  Target,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import { getCharacterStatTitle } from "@/features/dashboard/characterStats"
import { formatDateOnly } from "@/shared/lib/dateFormat"
import {
  getProjectPhaseBadgeClassName,
  getProjectPhaseTitle,
} from "@/shared/lib/projectPhases"
import { getProjectGoalLabel } from "@/shared/lib/selectedGoal"
import type { Goal, Project, Task } from "@/store/appState.types"
import {
  getGroupProgress,
  getProjectNextTask,
  getProjectOverdueTaskCount,
  getProjectProgress,
  getProjectTaskStats,
} from "@/store/selectors"
import { TaskItem } from "./TaskItem"

type MobileProjectsWorkspaceProps = {
  projects: Project[]
  goals: Goal[]
  selectedGoalTitle: string
  onSelectProject: (projectId: string) => void
  onAddProject: () => void
  onEditProject: (project: Project) => void
  onDeleteProject: (project: Project) => void
  onAddGroup: (projectId: string) => void
  onEditGroup: (projectId: string, groupId: string) => void
  onDeleteGroup: (projectId: string, groupId: string) => void
  onAddTask: (projectId: string, groupId: string) => void
  onEditTask: (projectId: string, groupId: string, taskId: string) => void
  onDeleteTask: (projectId: string, groupId: string, taskId: string) => void
  onToggleTask: (projectId: string, groupId: string, taskId: string) => void
}

const phaseOrder: Record<string, number> = {
  active: 0,
  later: 1,
  strategic: 2,
}

const priorityTitle: Record<NonNullable<Task["priority"]>, string> = {
  high: "Высокий",
  medium: "Средний",
  low: "Низкий",
}

function ProgressRing({ value }: { value: number }) {
  const size = 64
  const strokeWidth = 7
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={"0 0 " + size + " " + size}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-100 dark:stroke-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-blue-600 transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-slate-950 dark:text-white">
        {clamped}%
      </span>
    </div>
  )
}

function getPortfolioStats(projects: Project[]) {
  let totalTasks = 0
  let completedTasks = 0
  let overdue = 0
  const today = new Date().toISOString().slice(0, 10)

  for (const project of projects) {
    for (const group of project.groups) {
      for (const task of group.tasks) {
        totalTasks += 1
        if (task.completed) completedTasks += 1
        if (!task.completed && task.deadline && task.deadline.slice(0, 10) < today) {
          overdue += 1
        }
      }
    }
  }

  const progress =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100)

  return {
    totalTasks,
    completedTasks,
    overdue,
    progress,
  }
}

function sortProjects(projects: Project[]) {
  return [...projects].sort((a, b) => {
    const phaseDiff =
      (phaseOrder[a.phase ?? "active"] ?? 99) -
      (phaseOrder[b.phase ?? "active"] ?? 99)
    if (phaseDiff !== 0) return phaseDiff

    if (a.targetDate && b.targetDate) {
      return a.targetDate.localeCompare(b.targetDate)
    }
    if (a.targetDate) return -1
    if (b.targetDate) return 1

    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export function MobileProjectsWorkspace({
  projects,
  goals,
  selectedGoalTitle,
  onSelectProject,
  onAddProject,
  onEditProject,
  onDeleteProject,
  onAddGroup,
  onEditGroup,
  onDeleteGroup,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTask,
}: MobileProjectsWorkspaceProps) {
  const [detailProjectId, setDetailProjectId] = useState<string | null>(null)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})

  const portfolio = useMemo(() => getPortfolioStats(projects), [projects])
  const orderedProjects = useMemo(() => sortProjects(projects), [projects])
  const activeProjects = projects.filter(
    (project) => project.phase === undefined || project.phase === "active",
  ).length

  const detailProject = detailProjectId
    ? projects.find((project) => project.id === detailProjectId)
    : undefined

  const openProject = (projectId: string) => {
    onSelectProject(projectId)
    setDetailProjectId(projectId)
  }

  if (!detailProject) {
    return (
      <div className="space-y-6 md:hidden">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
              {selectedGoalTitle}
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Проекты
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Выбери проект и переходи прямо к работе
            </p>
          </div>
          <Button
            type="button"
            size="icon"
            className="size-11 shrink-0 rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
            onClick={onAddProject}
            aria-label="Добавить проект"
          >
            <Plus className="size-5" aria-hidden />
          </Button>
        </header>

        <section className="rounded-[26px] border border-blue-200/70 bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 shadow-sm dark:border-blue-500/20 dark:from-blue-500/10 dark:via-slate-900 dark:to-indigo-500/10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                Портфель проектов
              </p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">
                {portfolio.progress}%
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                общий прогресс по задачам
              </p>
            </div>
            <ProgressRing value={portfolio.progress} />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-white/70 p-2.5 dark:bg-slate-950/45">
              <FolderKanban className="size-4 text-blue-600 dark:text-blue-300" aria-hidden />
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {activeProjects}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                в фокусе
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-2.5 dark:bg-slate-950/45">
              <CheckCircle2 className="size-4 text-blue-600 dark:text-blue-300" aria-hidden />
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {portfolio.completedTasks}/{portfolio.totalTasks}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                выполнено
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-2.5 dark:bg-slate-950/45">
              <Target className="size-4 text-blue-600 dark:text-blue-300" aria-hidden />
              <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                {portfolio.overdue}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                просрочено
              </p>
            </div>
          </div>
        </section>

        {orderedProjects.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                  Работа
                </p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                  Мои проекты
                </h2>
              </div>
              <span className="text-xs text-slate-400">
                {orderedProjects.length} всего
              </span>
            </div>

            <div className="space-y-3">
              {orderedProjects.map((project) => {
                const progress = getProjectProgress(project)
                const stats = getProjectTaskStats(project)
                const overdue = getProjectOverdueTaskCount(project)

                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => openProject(project.id)}
                    className="w-full rounded-[22px] border border-slate-200 bg-white p-4 text-left shadow-sm transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        <CharacterStatIcon statType={project.statType} className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <p className="min-w-0 flex-1 text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
                            {project.title}
                          </p>
                          <span className="shrink-0 text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {progress}%
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className={getProjectPhaseBadgeClassName(project.phase)}>
                            {getProjectPhaseTitle(project.phase)}
                          </span>
                          <span>·</span>
                          <span>{stats.pending} задач осталось</span>
                          {overdue > 0 ? (
                            <>
                              <span>·</span>
                              <span className="font-medium text-red-600 dark:text-red-400">
                                {overdue} просрочено
                              </span>
                            </>
                          ) : null}
                        </div>

                        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-600 transition-[width] duration-500"
                            style={{ width: String(progress) + "%" }}
                          />
                        </div>

                        {project.targetDate ? (
                          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            <CalendarDays className="size-3.5" aria-hidden />
                            <span>До {formatDateOnly(project.targetDate)}</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        ) : (
          <div className="rounded-[24px] border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
            <Circle className="mx-auto size-8 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-slate-100">
              Проектов пока нет
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Создай первый проект и добавь в него этапы и задачи.
            </p>
            <Button
              type="button"
              className="mt-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              onClick={onAddProject}
            >
              <Plus className="mr-1 size-4" aria-hidden />
              Создать проект
            </Button>
          </div>
        )}
      </div>
    )
  }

  const selectedProgress = getProjectProgress(detailProject)
  const selectedStats = getProjectTaskStats(detailProject)
  const selectedOverdue = getProjectOverdueTaskCount(detailProject)
  const nextTask = getProjectNextTask(detailProject)
  const goalLabel = getProjectGoalLabel(detailProject, goals)

  return (
    <div className="space-y-5 md:hidden">
      <header>
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="-ml-2 rounded-xl px-2 text-slate-600 dark:text-slate-300"
            onClick={() => setDetailProjectId(null)}
          >
            <ArrowLeft className="mr-1 size-4" aria-hidden />
            Проекты
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-9 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                aria-label="Действия с проектом"
              >
                <MoreHorizontal className="size-5" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-52 p-1.5 dark:border-slate-700 dark:bg-slate-900"
            >
              <DropdownMenuItem
                className="gap-2 px-2.5 py-2"
                onSelect={() => onEditProject(detailProject)}
              >
                <Pencil className="size-4" aria-hidden />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                className="gap-2 px-2.5 py-2"
                onSelect={() => onDeleteProject(detailProject)}
              >
                <Trash2 className="size-4" aria-hidden />
                Удалить проект
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className={getProjectPhaseBadgeClassName(detailProject.phase)}>
            {getProjectPhaseTitle(detailProject.phase)}
          </span>
          <span className="text-xs text-slate-400">·</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {goalLabel}
          </span>
        </div>

        <h1 className="mt-2 text-2xl font-semibold leading-8 tracking-tight text-slate-950 dark:text-white">
          {detailProject.title}
        </h1>
        {detailProject.description ? (
          <p className="mt-2 text-sm leading-5 text-slate-500 dark:text-slate-400">
            {detailProject.description}
          </p>
        ) : null}
      </header>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-4">
          <ProgressRing value={selectedProgress} />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400">Прогресс проекта</p>
            <p className="mt-1 text-lg font-semibold text-slate-950 dark:text-white">
              {selectedStats.completed} из {selectedStats.total} задач
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {selectedStats.pending > 0
                ? String(selectedStats.pending) + " осталось"
                : selectedStats.total > 0
                  ? "Все задачи выполнены"
                  : "Задачи ещё не добавлены"}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-slate-50 p-2.5 dark:bg-slate-950/55">
            <p className="text-[10px] text-slate-400">Этапов</p>
            <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
              {detailProject.groups.length}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-2.5 dark:bg-slate-950/55">
            <p className="text-[10px] text-slate-400">Осталось</p>
            <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
              {selectedStats.pending}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-2.5 dark:bg-slate-950/55">
            <p className="text-[10px] text-slate-400">Просрочено</p>
            <p
              className={
                selectedOverdue > 0
                  ? "mt-1 text-base font-semibold text-red-600 dark:text-red-400"
                  : "mt-1 text-base font-semibold text-slate-950 dark:text-slate-100"
              }
            >
              {selectedOverdue}
            </p>
          </div>
        </div>

        {detailProject.targetDate ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CalendarDays className="size-4" aria-hidden />
            <span>Целевая дата: {formatDateOnly(detailProject.targetDate)}</span>
          </div>
        ) : null}

        {detailProject.statType ? (
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <CharacterStatIcon statType={detailProject.statType} className="size-4" />
            <span>{getCharacterStatTitle(detailProject.statType)}</span>
          </div>
        ) : null}
      </section>

      <section>
        <div className="mb-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Фокус
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Следующий шаг
            </h2>
          </div>
        </div>

        {nextTask ? (
          <div className="rounded-[22px] border border-blue-200/80 bg-blue-50/70 p-4 dark:border-blue-500/20 dark:bg-blue-500/10">
            <div className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <Flag className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-5 text-slate-950 dark:text-slate-100">
                  {nextTask.task.title}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Этап: {nextTask.group.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                  {nextTask.task.deadline ? (
                    <span>До {formatDateOnly(nextTask.task.deadline)}</span>
                  ) : null}
                  {nextTask.task.priority ? (
                    <span>Приоритет: {priorityTitle[nextTask.task.priority]}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              className="mt-3 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              onClick={() =>
                onToggleTask(
                  detailProject.id,
                  nextTask.group.id,
                  nextTask.task.id,
                )
              }
            >
              <CheckCircle2 className="mr-1.5 size-4" aria-hidden />
              Отметить выполненной
            </Button>
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-slate-300 p-5 text-center dark:border-slate-700">
            <CheckCircle2 className="mx-auto size-7 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-2 text-sm font-semibold text-slate-950 dark:text-slate-100">
              {selectedStats.total > 0 ? "Все задачи выполнены" : "Следующего шага пока нет"}
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {selectedStats.total > 0
                ? "Можно завершить проект или добавить следующий этап."
                : "Добавь этап и первую задачу, чтобы начать движение."}
            </p>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              План
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Этапы проекта
            </h2>
          </div>
          <Button
            type="button"
            size="sm"
            className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => onAddGroup(detailProject.id)}
          >
            <Plus className="mr-1 size-4" aria-hidden />
            Этап
          </Button>
        </div>

        {detailProject.groups.length === 0 ? (
          <div className="rounded-[22px] border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
            <FolderKanban className="mx-auto size-8 text-slate-300 dark:text-slate-600" aria-hidden />
            <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-slate-100">
              Этапов пока нет
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Разбей проект на несколько понятных частей.
            </p>
            <Button
              type="button"
              size="sm"
              className="mt-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => onAddGroup(detailProject.id)}
            >
              <Plus className="mr-1 size-4" aria-hidden />
              Добавить этап
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {[...detailProject.groups]
              .sort((a, b) => a.order - b.order)
              .map((group) => {
                const progress = getGroupProgress(group)
                const taskCount = group.tasks.length
                const completedCount = group.tasks.filter((task) => task.completed).length
                const open = openGroups[group.id] ?? true

                return (
                  <section
                    key={group.id}
                    className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenGroups((current) => ({
                          ...current,
                          [group.id]: !open,
                        }))
                      }
                      className="flex w-full items-center gap-3 px-4 py-4 text-left"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
                            {group.title}
                          </h3>
                          <span className="shrink-0 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {progress}%
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                          <div
                            className="h-full rounded-full bg-blue-600"
                            style={{ width: String(progress) + "%" }}
                          />
                        </div>
                        <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                          {completedCount}/{taskCount} выполнено
                        </p>
                      </div>
                      <ChevronDown
                        className={
                          open
                            ? "size-4 shrink-0 rotate-180 text-slate-400 transition-transform"
                            : "size-4 shrink-0 text-slate-400 transition-transform"
                        }
                        aria-hidden
                      />
                    </button>

                    {open ? (
                      <div className="border-t border-slate-100 px-3 pb-3 pt-3 dark:border-slate-800">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-300 dark:border-slate-700"
                              >
                                <MoreHorizontal className="mr-1 size-4" aria-hidden />
                                Этап
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              className="w-48 p-1.5 dark:border-slate-700 dark:bg-slate-900"
                            >
                              <DropdownMenuItem
                                className="gap-2 px-2.5 py-2"
                                onSelect={() => onEditGroup(detailProject.id, group.id)}
                              >
                                <Pencil className="size-4" aria-hidden />
                                Редактировать
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                variant="destructive"
                                className="gap-2 px-2.5 py-2"
                                onSelect={() => onDeleteGroup(detailProject.id, group.id)}
                              >
                                <Trash2 className="size-4" aria-hidden />
                                Удалить этап
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          <Button
                            type="button"
                            size="sm"
                            className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                            onClick={() => onAddTask(detailProject.id, group.id)}
                          >
                            <Plus className="mr-1 size-4" aria-hidden />
                            Задача
                          </Button>
                        </div>

                        {group.tasks.length === 0 ? (
                          <div className="rounded-xl bg-slate-50 px-3 py-5 text-center text-xs text-slate-500 dark:bg-slate-950/55 dark:text-slate-400">
                            В этом этапе пока нет задач
                          </div>
                        ) : (
                          <ul className="space-y-2">
                            {group.tasks.map((task) => (
                              <li key={task.id}>
                                <TaskItem
                                  task={task}
                                  onToggle={() =>
                                    onToggleTask(detailProject.id, group.id, task.id)
                                  }
                                  onEdit={() =>
                                    onEditTask(detailProject.id, group.id, task.id)
                                  }
                                  onDelete={() =>
                                    onDeleteTask(detailProject.id, group.id, task.id)
                                  }
                                />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ) : null}
                  </section>
                )
              })}
          </div>
        )}
      </section>
    </div>
  )
}
