import { CircleHelp } from "lucide-react"
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
import {
  TASK_DEFER_REASON_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/shared/lib/workManagement"
import type {
  Task,
  TaskDeferReason,
  TaskPriority,
  TaskStatus,
} from "@/store/appState.types"

export type TaskFormValues = {
  title: string
  deadline?: string
  deadlineTime?: string
  notes?: string
  priority?: TaskPriority
  status?: TaskStatus
  assignee?: string
  followUpDate?: string
  followUpTime?: string
  deferReason?: TaskDeferReason
  deferNote?: string
  deferredUntil?: string
  delegationNote?: string
  isNextAction?: boolean
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
  const [deadlineTime, setDeadlineTime] = useState(initialTask?.deadlineTime ?? "")
  const [notes, setNotes] = useState(initialTask?.notes ?? "")
  const [priority, setPriority] = useState<TaskPriority | "">(
    initialTask?.priority ?? "",
  )
  const [status, setStatus] = useState<TaskStatus>(
    initialTask?.status ?? (initialTask?.completed ? "done" : "planned"),
  )
  const [assignee, setAssignee] = useState(initialTask?.assignee ?? "")
  const [followUpDate, setFollowUpDate] = useState(initialTask?.followUpDate ?? "")
  const [followUpTime, setFollowUpTime] = useState(initialTask?.followUpTime ?? "")
  const [deferReason, setDeferReason] = useState<TaskDeferReason | "">(
    initialTask?.deferReason ?? "",
  )
  const [deferNote, setDeferNote] = useState(initialTask?.deferNote ?? "")
  const [deferredUntil, setDeferredUntil] = useState(initialTask?.deferredUntil ?? "")
  const [delegationNote, setDelegationNote] = useState(
    initialTask?.delegationNote ?? "",
  )
  const [isNextAction, setIsNextAction] = useState(
    initialTask?.isNextAction === true,
  )

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onSubmit({
      title: t,
      deadline: deadline.trim() || undefined,
      deadlineTime: deadline ? deadlineTime.trim() || undefined : undefined,
      notes: notes.trim() || undefined,
      priority: priority === "" ? undefined : priority,
      status,
      assignee: assignee.trim() || undefined,
      followUpDate: followUpDate.trim() || undefined,
      followUpTime: followUpDate ? followUpTime.trim() || undefined : undefined,
      deferReason: deferReason || undefined,
      deferNote: deferNote.trim() || undefined,
      deferredUntil: deferredUntil.trim() || undefined,
      delegationNote: delegationNote.trim() || undefined,
      isNextAction: status === "done" ? false : isNextAction,
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
            className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-deadline">Дедлайн</Label>
          <div className="grid grid-cols-[minmax(0,1fr)_120px] gap-2">
            <Input
              id="task-deadline"
              type="date"
              value={deadline}
              onChange={(e) => {
                setDeadline(e.target.value)
                if (!e.target.value) setDeadlineTime("")
              }}
              className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
            <Input
              id="task-deadline-time"
              type="time"
              value={deadlineTime}
              disabled={!deadline}
              onChange={(e) => setDeadlineTime(e.target.value)}
              aria-label="Время дедлайна"
              className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Время необязательно. Без времени срок действует до конца дня.
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-priority">Приоритет</Label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) =>
              setPriority((e.target.value || "") as TaskPriority | "")
            }
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="">Не задан</option>
            <option value="low">Низкий</option>
            <option value="medium">Средний</option>
            <option value="high">Высокий</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="task-status">Статус</Label>
          <select
            id="task-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {TASK_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="task-assignee">Ответственный</Label>
            <Input
              id="task-assignee"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Имя или роль"
              className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-follow-up">Контроль</Label>
            <div className="grid grid-cols-[minmax(0,1fr)_110px] gap-2">
              <Input
                id="task-follow-up"
                type="date"
                value={followUpDate}
                onChange={(e) => {
                  setFollowUpDate(e.target.value)
                  if (!e.target.value) setFollowUpTime("")
                }}
                className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <Input
                id="task-follow-up-time"
                type="time"
                value={followUpTime}
                disabled={!followUpDate}
                onChange={(e) => setFollowUpTime(e.target.value)}
                aria-label="Время контроля"
                className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="task-deferred-until">Отложить до</Label>
            <Input
              id="task-deferred-until"
              type="date"
              value={deferredUntil}
              onChange={(e) => setDeferredUntil(e.target.value)}
              className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="task-defer-reason">Причина переноса</Label>
            <select
              id="task-defer-reason"
              value={deferReason}
              onChange={(e) =>
                setDeferReason((e.target.value || "") as TaskDeferReason | "")
              }
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Не указана</option>
              {TASK_DEFER_REASON_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="task-defer-note">Комментарий к переносу</Label>
          <Input
            id="task-defer-note"
            value={deferNote}
            onChange={(e) => setDeferNote(e.target.value)}
            placeholder="Что изменилось и при каком условии вернуться"
            className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="task-delegation-note">Комментарий по делегированию</Label>
          <Textarea
            id="task-delegation-note"
            value={delegationNote}
            onChange={(e) => setDelegationNote(e.target.value)}
            className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            rows={2}
            placeholder="Что передано и какой результат должен вернуться"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-800 dark:bg-slate-950/50">
          <input
            type="checkbox"
            checked={isNextAction}
            disabled={status === "done"}
            onChange={(e) => setIsNextAction(e.target.checked)}
            className="size-4"
          />
          <span className="flex min-w-0 items-center gap-1.5">
            <span>Следующая задача проекта</span>
            <span
              className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              title="Отметь одну задачу, которую нужно выполнить следующей, чтобы продвинуть проект. В проекте может быть только одна такая задача."
              aria-label="Подсказка: следующая задача проекта"
              onClick={(event) => event.preventDefault()}
            >
              <CircleHelp className="size-3.5" aria-hidden />
            </span>
          </span>
        </label>

        <div className="grid gap-2">
          <Label htmlFor="task-notes">Заметки</Label>
          <Textarea
            id="task-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            rows={3}
          />
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          className="border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
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
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:max-w-md">
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
