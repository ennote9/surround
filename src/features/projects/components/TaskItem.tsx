import { Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import type { Task } from "@/store/appState.types"

const priorityLabel: Record<NonNullable<Task["priority"]>, string> = {
  low: "Низкий",
  medium: "Средний",
  high: "Высокий",
}

type TaskItemProps = {
  task: Task
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

export function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:flex-row sm:flex-wrap sm:items-start sm:gap-3",
        task.completed && "bg-slate-50",
      )}
    >
      <div className="flex min-w-0 flex-1 gap-3">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggle()}
          className="mt-1 size-5 shrink-0 border-slate-400 data-checked:border-blue-600 data-checked:bg-blue-600 sm:mt-0.5 sm:size-4"
          aria-label={`Выполнено: ${task.title}`}
        />
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`task-${task.id}`}
            className={cn(
              "block cursor-pointer break-words text-sm font-medium text-slate-950",
              task.completed && "text-slate-400 line-through",
            )}
          >
            {task.title}
          </label>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-slate-600">
            {task.deadline ? (
              <span className="break-words">Дедлайн: {task.deadline}</span>
            ) : null}
            {task.priority ? (
              <span className="shrink-0">
                Приоритет: {priorityLabel[task.priority]}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 justify-end gap-1 border-t border-slate-200/80 pt-2 sm:ml-auto sm:border-0 sm:pt-0">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="min-h-10 min-w-10 text-slate-600 hover:bg-slate-200 hover:text-slate-950 sm:min-h-8 sm:min-w-8"
          aria-label="Редактировать задачу"
          onClick={onEdit}
        >
          <Pencil className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="min-h-10 min-w-10 text-slate-600 hover:bg-red-50 hover:text-red-600 sm:min-h-8 sm:min-w-8"
          aria-label="Удалить задачу"
          onClick={onDelete}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
