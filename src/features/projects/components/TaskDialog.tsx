import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { Task, TaskPriority } from "@/store/appState.types"

export type TaskFormValues = {
  title: string
  deadline?: string
  notes?: string
  priority?: TaskPriority
}

type TaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTask?: Task
  onSubmit: (values: TaskFormValues) => void
}

function TaskDialogFields({
  initialTask,
  onSubmit,
  onOpenChange,
}: {
  initialTask?: Task
  onSubmit: (values: TaskFormValues) => void
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState(initialTask?.title ?? "")
  const [deadline, setDeadline] = useState(initialTask?.deadline ?? "")
  const [notes, setNotes] = useState(initialTask?.notes ?? "")
  const [priority, setPriority] = useState<TaskPriority | "">(
    initialTask?.priority ?? "",
  )

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onSubmit({
      title: t,
      deadline: deadline.trim() || undefined,
      notes: notes.trim() || undefined,
      priority: priority === "" ? undefined : priority,
    })
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {initialTask ? "Редактировать задачу" : "Новая задача"}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="task-title">Название</Label>
          <Input
            id="task-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-slate-300"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-deadline">Дедлайн</Label>
          <Input
            id="task-deadline"
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="border-slate-300"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-priority">Приоритет</Label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) =>
              setPriority((e.target.value || "") as TaskPriority | "")
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950"
          >
            <option value="">Не задан</option>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-notes">Заметки</Label>
          <Textarea
            id="task-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border-slate-300"
            rows={3}
          />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          className="border-slate-300"
          onClick={() => onOpenChange(false)}
        >
          Отмена
        </Button>
        <Button
          type="button"
          className="bg-blue-600 text-white hover:bg-blue-700"
          disabled={!title.trim()}
          onClick={handleSubmit}
        >
          Сохранить
        </Button>
      </DialogFooter>
    </>
  )
}

export function TaskDialog({
  open,
  onOpenChange,
  initialTask,
  onSubmit,
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white text-slate-950 sm:max-w-md">
        {open ? (
          <TaskDialogFields
            key={initialTask?.id ?? "__add__"}
            initialTask={initialTask}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
