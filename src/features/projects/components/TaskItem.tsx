import { ArrowRight, LockKeyhole, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { getTaskStatusLabel } from "@/shared/lib/workManagement"
import {
  getIncompleteTaskBlockers,
  getTaskById,
} from "@/shared/lib/taskDependencies"
import { formatTaskScheduleLabel, isTaskOverdue } from "@/shared/lib/taskSchedule"
import { getTaskReminderPresetLabel } from "@/shared/lib/taskReminders"
import type { Project, Task } from "@/store/appState.types"

const priorityLabel: Record<NonNullable<Task["priority"]>, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
}

type TaskItemProps = {
  task: Task
  project?: Project
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export function TaskItem({
  task,
  project,
  onToggle,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const overdue = isTaskOverdue(task)
  const incompleteBlockers = project
    ? getIncompleteTaskBlockers(project, task)
    : []
  const completionSuccessor =
    project && task.completionNextTaskId
      ? getTaskById(project, task.completionNextTaskId)
      : undefined

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3 dark:border-slate-700 dark:bg-slate-900/75",
        task.completed && "bg-slate-50 dark:bg-slate-900/50",
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggle()}
          className="mt-1 size-5 shrink-0 border-slate-400 data-checked:border-blue-600 data-checked:bg-blue-600 sm:mt-0.5 sm:size-4 dark:border-slate-500"
          aria-label={`Выполнено: ${task.title}`}
        />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`task-${task.id}`}
            className={cn(
              "block cursor-pointer break-words text-sm font-medium text-slate-950 dark:text-slate-100",
              task.completed && "text-slate-400 line-through dark:text-slate-500",
            )}
          >
            {task.title}
          </label>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600 dark:text-slate-400">
            {task.deadline ? (
              <span
                className={cn(
                  "break-words",
                  overdue && "font-medium text-red-600 dark:text-red-400",
                )}
              >
                Дедлайн: {formatTaskScheduleLabel(task.deadline, task.deadlineTime)}
              </span>
            ) : null}
            {task.deadlineReminder ? (
              <span className="shrink-0">
                Напомнить:{" "}
                {getTaskReminderPresetLabel(
                  task.deadlineReminder,
                  Boolean(task.deadlineTime),
                  "deadline",
                )}
              </span>
            ) : null}
            {task.priority ? (
              <span className="shrink-0">
                Приоритет: {priorityLabel[task.priority]}
              </span>
            ) : null}
            <span className="shrink-0">Статус: {getTaskStatusLabel(task)}</span>
            {incompleteBlockers.length > 0 ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                <LockKeyhole className="size-3" aria-hidden />
                Заблокировано: {incompleteBlockers.length}
              </span>
            ) : null}
            {task.isNextAction ? (
              <span className="shrink-0 font-medium text-violet-600 dark:text-violet-400">
                Следующая задача проекта
              </span>
            ) : null}
            {task.assignee ? (
              <span className="shrink-0">Ответственный: {task.assignee}</span>
            ) : null}
            {task.followUpDate ? (
              <span className="shrink-0">
                Контроль: {formatTaskScheduleLabel(task.followUpDate, task.followUpTime)}
              </span>
            ) : null}
            {task.followUpReminder ? (
              <span className="shrink-0">
                Напоминание контроля:{" "}
                {getTaskReminderPresetLabel(
                  task.followUpReminder,
                  Boolean(task.followUpTime),
                  "control",
                )}
              </span>
            ) : null}
            {completionSuccessor ? (
              <span className="inline-flex min-w-0 items-center gap-1 text-blue-600 dark:text-blue-400">
                <ArrowRight className="size-3 shrink-0" aria-hidden />
                <span className="break-words">
                  После выполнения: {completionSuccessor.title}
                </span>
              </span>
            ) : null}
            {task.deferredUntil ? (
              <span className="shrink-0">Отложено до: {task.deferredUntil}</span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 justify-end gap-1 border-t border-slate-200/80 pt-2 sm:ml-auto sm:border-0 sm:pt-0 dark:border-slate-700">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="min-h-10 min-w-10 text-slate-600 hover:bg-slate-200 hover:text-slate-950 sm:min-h-8 sm:min-w-8 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          aria-label="Редактировать задачу"
          onClick={onEdit}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="min-h-10 min-w-10 text-slate-600 hover:bg-red-50 hover:text-red-600 sm:min-h-8 sm:min-w-8 dark:text-slate-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          aria-label="Удалить задачу"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
