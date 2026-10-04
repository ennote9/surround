import type { ReactNode } from "react"
import { ArrowRight, Bell, Calendar, CalendarClock, Flag, LockKeyhole, Pause, Pencil, Target, Trash2, User, type LucideIcon } from "lucide-react"
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
import { formatDateOnly } from "@/shared/lib/dateFormat"
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

function Metadata({ icon: Icon, label, children, className }: {
  icon: LucideIcon
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <span title={label} className={cn("inline-flex min-w-0 max-w-full items-center gap-1.5", className)}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      <span className="min-w-0 break-words">
        <span className="sr-only">{label}: </span>
        {children}
      </span>
    </span>
  )
}

function ReminderIndicator({ label }: { label: string }) {
  return (
    <span
      tabIndex={0}
      role="img"
      aria-label={label}
      title={label}
      className="group relative inline-flex shrink-0 items-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      <Bell className="size-3.5" aria-hidden />
      <span aria-hidden className="pointer-events-none absolute bottom-full right-0 z-10 mb-1 hidden w-max max-w-[min(14rem,70vw)] whitespace-normal rounded-md bg-slate-900 px-2 py-1 text-xs font-normal text-white shadow-sm group-hover:block group-focus-visible:block dark:bg-slate-100 dark:text-slate-900">
        {label}
      </span>
    </span>
  )
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
  const hasWorkflowMetadata = Boolean(
    task.assignee || incompleteBlockers.length || task.isNextAction ||
    task.deferredUntil || completionSuccessor,
  )
  const mutedClass = "text-slate-400 dark:text-slate-500"

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
          <div className={cn("mt-1.5 space-y-1 text-xs leading-5 text-slate-600 dark:text-slate-400", task.completed && mutedClass)}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {task.deadline ? (
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <Metadata icon={Calendar} label={overdue ? "Дедлайн просрочен" : "Дедлайн"} className={overdue ? "font-medium text-red-600 dark:text-red-400" : undefined}>
                    {formatTaskScheduleLabel(task.deadline, task.deadlineTime)}
                  </Metadata>
                  {task.deadlineReminder ? (
                    <ReminderIndicator label={`Напоминание: ${getTaskReminderPresetLabel(task.deadlineReminder, Boolean(task.deadlineTime), "deadline")}`} />
                  ) : null}
                </span>
              ) : null}
              <span title="Статус" className={cn("rounded-md bg-slate-200/60 px-1.5 font-medium dark:bg-slate-800", task.completed && "bg-transparent font-normal dark:bg-transparent")}>
                <span className="sr-only">Статус: </span>{getTaskStatusLabel(task)}
              </span>
              {task.priority ? (
                <Metadata icon={Flag} label="Приоритет" className={!task.completed && task.priority === "high" ? "text-red-700 dark:text-red-400" : undefined}>
                  {priorityLabel[task.priority]}
                </Metadata>
              ) : null}
              {task.followUpDate ? (
                <span className="inline-flex max-w-full items-center gap-1.5">
                  <Metadata icon={CalendarClock} label="Контроль">
                    {formatTaskScheduleLabel(task.followUpDate, task.followUpTime)}
                  </Metadata>
                  {task.followUpReminder ? (
                    <ReminderIndicator label={`Напоминание контроля: ${getTaskReminderPresetLabel(task.followUpReminder, Boolean(task.followUpTime), "control")}`} />
                  ) : null}
                </span>
              ) : null}
            </div>
            {hasWorkflowMetadata ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                {task.assignee ? (
                  <Metadata icon={User} label="Ответственный">{task.assignee}</Metadata>
                ) : null}
                {incompleteBlockers.length > 0 ? (
                  <Metadata icon={LockKeyhole} label="Невыполненные блокирующие задачи" className={cn("font-medium", task.completed ? mutedClass : "text-amber-700 dark:text-amber-400")}>
                    Заблокировано · {incompleteBlockers.length}
                  </Metadata>
                ) : null}
                {task.isNextAction ? (
                  <Metadata icon={Target} label="Следующая задача проекта" className={cn("font-medium", task.completed ? mutedClass : "text-violet-600 dark:text-violet-400")}>
                    Следующая
                  </Metadata>
                ) : null}
                {task.deferredUntil ? (
                  <Metadata icon={Pause} label="Отложено">
                    до {formatDateOnly(task.deferredUntil)}
                  </Metadata>
                ) : null}
                {completionSuccessor ? (
                  <span className={cn("inline-flex min-w-0 max-w-full items-start gap-1.5", task.completed ? mutedClass : "text-blue-600 dark:text-blue-400")}>
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    <span className="min-w-0 break-words">После выполнения → {completionSuccessor.title}</span>
                  </span>
                ) : null}
              </div>
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
