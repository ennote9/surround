import { CircleHelp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TaskHistoryPanel } from "@/features/projects/components/TaskHistoryPanel"
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
import { getTaskReminderOptions } from "@/shared/lib/taskReminders"
import { wouldCreateBlockingDependencyCycle } from "@/shared/lib/taskDependencies"
import type {
  Project,
  Task,
  TaskDeferReason,
  TaskPriority,
  TaskReminderPreset,
  TaskStatus,
} from "@/store/appState.types"

export type TaskFormValues = {
  title: string
  deadline?: string
  deadlineTime?: string
  deadlineReminder?: TaskReminderPreset
  notes?: string
  priority?: TaskPriority
  status?: TaskStatus
  assignee?: string
  followUpDate?: string
  followUpTime?: string
  followUpReminder?: TaskReminderPreset
  deferReason?: TaskDeferReason
  deferNote?: string
  deferredUntil?: string
  delegationNote?: string
  isNextAction?: boolean
  blockedByTaskIds?: string[]
  completionNextTaskId?: string
  changeReason?: string
}

type TaskDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialTask?: Task
  project?: Project
  onSubmit: (values: TaskFormValues) => void
}

function TaskDialogFields({
  initialTask,
  project,
  onSubmit,
  onOpenChange,
}: {
  initialTask?: Task
  project?: Project
  onSubmit: (values: TaskFormValues) => void
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState(initialTask?.title ?? "")
  const [deadline, setDeadline] = useState(initialTask?.deadline ?? "")
  const [deadlineTime, setDeadlineTime] = useState(initialTask?.deadlineTime ?? "")
  const [deadlineReminder, setDeadlineReminder] = useState<TaskReminderPreset | "">(
    initialTask?.deadlineReminder ?? "",
  )
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
  const [followUpReminder, setFollowUpReminder] = useState<TaskReminderPreset | "">(
    initialTask?.followUpReminder ?? "",
  )
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
  const [blockedByTaskIds, setBlockedByTaskIds] = useState<string[]>(
    initialTask?.blockedByTaskIds ?? [],
  )
  const [completionNextTaskId, setCompletionNextTaskId] = useState(
    initialTask?.completionNextTaskId ?? "",
  )
  const [changeReason, setChangeReason] = useState("")

  const relationCandidates =
    project?.groups.flatMap((group) =>
      group.tasks
        .filter((task) => task.id !== initialTask?.id)
        .map((task) => ({
          task,
          groupTitle: group.title,
        })),
    ) ?? []

  const incompleteSelectedBlockers = relationCandidates.filter(
    ({ task }) =>
      blockedByTaskIds.includes(task.id) &&
      !task.completed,
  )

  const normalizeOptional = (value: string): string | undefined =>
    value.trim() || undefined

  const initialStatus =
    initialTask?.status ?? (initialTask?.completed ? "done" : "planned")
  const nextActionForSave =
    status === "done" || incompleteSelectedBlockers.length > 0
      ? false
      : isNextAction

  const sameIds = (left: string[], right: string[]): boolean => {
    const a = [...left].sort()
    const b = [...right].sort()
    return (
      a.length === b.length &&
      a.every((value, index) => value === b[index])
    )
  }

  const hasTrackedChanges = Boolean(
    initialTask &&
      (
        title.trim() !== initialTask.title ||
        normalizeOptional(deadline) !== initialTask.deadline ||
        normalizeOptional(deadlineTime) !== initialTask.deadlineTime ||
        (deadlineReminder || undefined) !== initialTask.deadlineReminder ||
        (priority || undefined) !== initialTask.priority ||
        status !== initialStatus ||
        normalizeOptional(assignee) !== initialTask.assignee ||
        normalizeOptional(followUpDate) !== initialTask.followUpDate ||
        normalizeOptional(followUpTime) !== initialTask.followUpTime ||
        (followUpReminder || undefined) !== initialTask.followUpReminder ||
        (deferReason || undefined) !== initialTask.deferReason ||
        normalizeOptional(deferNote) !== initialTask.deferNote ||
        normalizeOptional(deferredUntil) !== initialTask.deferredUntil ||
        nextActionForSave !== (initialTask.isNextAction === true) ||
        !sameIds(
          blockedByTaskIds,
          initialTask.blockedByTaskIds ?? [],
        ) ||
        (completionNextTaskId || undefined) !==
          initialTask.completionNextTaskId
      )
  )

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onSubmit({
      title: t,
      deadline: deadline.trim() || undefined,
      deadlineTime: deadline ? deadlineTime.trim() || undefined : undefined,
      deadlineReminder: deadline ? deadlineReminder || undefined : undefined,
      notes: notes.trim() || undefined,
      priority: priority === "" ? undefined : priority,
      status,
      assignee: assignee.trim() || undefined,
      followUpDate: followUpDate.trim() || undefined,
      followUpTime: followUpDate ? followUpTime.trim() || undefined : undefined,
      followUpReminder: followUpDate ? followUpReminder || undefined : undefined,
      deferReason: deferReason || undefined,
      deferNote: deferNote.trim() || undefined,
      deferredUntil: deferredUntil.trim() || undefined,
      delegationNote: delegationNote.trim() || undefined,
      isNextAction: nextActionForSave,
      blockedByTaskIds,
      completionNextTaskId: completionNextTaskId || undefined,
      changeReason: hasTrackedChanges
        ? changeReason.trim() || undefined
        : undefined,
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
                if (!e.target.value) {
                  setDeadlineTime("")
                  setDeadlineReminder("")
                }
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
          <select
            value={deadlineReminder}
            disabled={!deadline}
            onChange={(e) =>
              setDeadlineReminder(
                (e.target.value || "") as TaskReminderPreset | "",
              )
            }
            className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            aria-label="Напоминание о дедлайне"
          >
            <option value="">Не напоминать</option>
            {getTaskReminderOptions(Boolean(deadlineTime), "deadline").map(
              (option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ),
            )}
          </select>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Время необязательно. Без времени срок действует до конца дня, а
            напоминание «в день срока» срабатывает в 09:00.
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
                  if (!e.target.value) {
                    setFollowUpTime("")
                    setFollowUpReminder("")
                  }
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
            <select
              value={followUpReminder}
              disabled={!followUpDate}
              onChange={(e) =>
                setFollowUpReminder(
                  (e.target.value || "") as TaskReminderPreset | "",
                )
              }
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              aria-label="Напоминание о контроле"
            >
              <option value="">Не напоминать</option>
              {getTaskReminderOptions(Boolean(followUpTime), "control").map(
                (option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>
        {relationCandidates.length > 0 ? (
          <section className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Связи задач
              </p>
              <p className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                Зависимости управляют доступностью задачи. Завершение не переводит следующую задачу в работу автоматически.
              </p>
            </div>

            <div className="mt-3 grid gap-2">
              <Label>Задача доступна после</Label>
              <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
                {relationCandidates.map(({ task, groupTitle }) => {
                  const checked = blockedByTaskIds.includes(task.id)
                  const createsCycle =
                    !checked &&
                    Boolean(
                      project &&
                        initialTask &&
                        wouldCreateBlockingDependencyCycle(
                          project,
                          initialTask.id,
                          task.id,
                        ),
                    )
                  return (
                    <label
                      key={task.id}
                      className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={createsCycle}
                        onChange={(event) => {
                          setBlockedByTaskIds((current) =>
                            event.target.checked
                              ? [...new Set([...current, task.id])]
                              : current.filter((id) => id !== task.id),
                          )
                        }}
                        className="mt-0.5 size-4"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block break-words font-medium text-slate-800 dark:text-slate-200">
                          {task.title}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {groupTitle}
                          {task.completed ? " · выполнено" : ""}
                          {createsCycle ? " · создаст цикл" : ""}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </div>
              {incompleteSelectedBlockers.length > 0 ? (
                <p className="text-[11px] text-amber-600 dark:text-amber-400">
                  Пока не выполнено: {incompleteSelectedBlockers.length}. Эту задачу нельзя считать следующей задачей проекта.
                </p>
              ) : null}
            </div>

            <div className="mt-3 grid gap-2">
              <Label htmlFor="task-completion-next">
                После выполнения
              </Label>
              <select
                id="task-completion-next"
                value={completionNextTaskId}
                disabled={status === "done"}
                onChange={(event) =>
                  setCompletionNextTaskId(event.target.value)
                }
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Ничего не выбирать автоматически</option>
                {relationCandidates
                  .filter(({ task }) => !task.completed)
                  .map(({ task, groupTitle }) => (
                    <option key={task.id} value={task.id}>
                      {task.title} · {groupTitle}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
                Выбранная задача станет «Следующей задачей проекта» после выполнения текущей, но только если все её блокирующие задачи уже выполнены.
              </p>
            </div>
          </section>
        ) : null}

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
            disabled={
              status === "done" ||
              incompleteSelectedBlockers.length > 0
            }
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

        {initialTask && hasTrackedChanges ? (
          <div className="grid gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/20 dark:bg-amber-500/5">
            <Label htmlFor="task-change-reason">
              Причина этой правки
              <span className="ml-1 font-normal text-slate-400">
                необязательно
              </span>
            </Label>
            <Input
              id="task-change-reason"
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="Например: жду ответ от ИТ, срок перенесён"
              className="border-amber-200 bg-white dark:border-amber-500/20 dark:bg-slate-950"
            />
            <p className="text-[11px] leading-4 text-slate-500 dark:text-slate-400">
              Причина сохранится в истории вместе с этой группой изменений.
            </p>
          </div>
        ) : null}

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

        {initialTask ? <TaskHistoryPanel taskId={initialTask.id} /> : null}
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
  project,
  onSubmit,
}: TaskDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:max-w-xl">
        {open ? (
          <TaskDialogFields
            key={initialTask?.id ?? "__add__"}
            initialTask={initialTask}
            project={project}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
