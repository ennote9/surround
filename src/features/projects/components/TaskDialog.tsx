import { CalendarDays, Check, ChevronDown, Clock3, Link2, X } from "lucide-react"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { TaskHistoryPanel } from "@/features/projects/components/TaskHistoryPanel"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  TASK_DEFER_REASON_OPTIONS,
  TASK_STATUS_OPTIONS,
} from "@/shared/lib/workManagement"
import { getTaskReminderOptions, getTaskReminderPresetLabel } from "@/shared/lib/taskReminders"
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


const controlClass = "h-11 min-w-0 w-full rounded-lg border border-slate-200 bg-white px-3 text-base text-slate-950 outline-none transition-colors hover:border-slate-300 focus-visible:border-blue-400 focus-visible:ring-2 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-slate-600"
const inspectorControlClass = `${controlClass} sm:h-10`
const summaryClass = "flex min-h-[76px] cursor-pointer list-none items-center gap-3 rounded-xl px-4 py-4 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-400/40 focus-visible:ring-inset dark:hover:bg-slate-800/60 [&::-webkit-details-marker]:hidden"
const badgeClass = "inline-flex min-w-8 shrink-0 items-center justify-center rounded-full bg-slate-200/60 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-600 dark:bg-slate-800 dark:text-slate-300"

function TaskScheduleFields({
  kind,
  date,
  time,
  reminder,
  onDateChange,
  onTimeChange,
  onReminderChange,
}: {
  kind: "deadline" | "control"
  date: string
  time: string
  reminder: TaskReminderPreset | ""
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
  onReminderChange: (value: TaskReminderPreset | "") => void
}) {
  const id = kind === "deadline" ? "task-deadline" : "task-follow-up"
  const label = kind === "deadline" ? "Дедлайн" : "Контроль"
  const reminderOptions = getTaskReminderOptions(Boolean(time), kind)
  const hasCurrentReminder = reminderOptions.some((option) => option.value === reminder)
  return (
    <fieldset className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-950/30">
      <legend className="sr-only">{label}</legend>
      <div aria-hidden className="mb-3 flex items-center gap-2 text-sm font-semibold">
        {kind === "deadline"
          ? <CalendarDays className="size-4 text-blue-600 dark:text-blue-400" />
          : <Clock3 className="size-4 text-slate-600 dark:text-slate-400" />}
        {label}
      </div>
      <div className="grid gap-3">
        <div className="grid min-w-0 grid-cols-1 gap-2 min-[400px]:grid-cols-[minmax(0,1fr)_100px]">
          <Input
            id={id}
            type="date"
            value={date}
            onChange={(event) => {
              onDateChange(event.target.value)
              if (!event.target.value) {
                onTimeChange("")
                onReminderChange("")
              }
            }}
            aria-label={`Дата: ${label}`}
            className={controlClass}
          />
          <Input
            id={`${id}-time`}
            type="time"
            value={time}
            disabled={!date}
            onChange={(event) => onTimeChange(event.target.value)}
            aria-label={`Время: ${label}`}
            className={controlClass}
          />
        </div>
        <select
          value={reminder}
          disabled={!date}
          onChange={(event) => onReminderChange(event.target.value as TaskReminderPreset | "")}
          aria-label={`Напоминание: ${label}`}
          className={controlClass}
        >
          <option value="">Не напоминать</option>
          {reminder && !hasCurrentReminder ? (
            <option value={reminder}>
              {getTaskReminderPresetLabel(reminder, true, kind)}
            </option>
          ) : null}
          {reminderOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>
    </fieldset>
  )
}

function TaskDialogEditor({
  open,
  initialTask,
  project,
  onSubmit,
  onOpenChange,
}: TaskDialogProps) {
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
  const [titleTouched, setTitleTouched] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const closeFocusRef = useRef<HTMLElement | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const [advancedOpen, setAdvancedOpen] = useState(Boolean(
    initialTask?.deferredUntil || initialTask?.deferReason ||
    initialTask?.deferNote || initialTask?.delegationNote,
  ))

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
  const statusForSave: TaskStatus =
    status === "in_progress" && incompleteSelectedBlockers.length > 0
      ? "planned"
      : status
  const nextActionForSave =
    statusForSave === "done" || incompleteSelectedBlockers.length > 0
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
        statusForSave !== initialStatus ||
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
    if (!t) {
      setTitleTouched(true)
      titleRef.current?.focus()
      return
    }
    onSubmit({
      title: t,
      deadline: deadline.trim() || undefined,
      deadlineTime: deadline ? deadlineTime.trim() || undefined : undefined,
      deadlineReminder: deadline ? deadlineReminder || undefined : undefined,
      notes: notes.trim() || undefined,
      priority: priority === "" ? undefined : priority,
      status: statusForSave,
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


  // Closing tracks every editable field, independently of history's tracked fields.
  const isDirty =
    title !== (initialTask?.title ?? "") ||
    notes !== (initialTask?.notes ?? "") ||
    deadline !== (initialTask?.deadline ?? "") ||
    deadlineTime !== (initialTask?.deadlineTime ?? "") ||
    deadlineReminder !== (initialTask?.deadlineReminder ?? "") ||
    priority !== (initialTask?.priority ?? "") ||
    status !== initialStatus ||
    assignee !== (initialTask?.assignee ?? "") ||
    followUpDate !== (initialTask?.followUpDate ?? "") ||
    followUpTime !== (initialTask?.followUpTime ?? "") ||
    followUpReminder !== (initialTask?.followUpReminder ?? "") ||
    deferReason !== (initialTask?.deferReason ?? "") ||
    deferNote !== (initialTask?.deferNote ?? "") ||
    deferredUntil !== (initialTask?.deferredUntil ?? "") ||
    delegationNote !== (initialTask?.delegationNote ?? "") ||
    isNextAction !== (initialTask?.isNextAction === true) ||
    !sameIds(blockedByTaskIds, initialTask?.blockedByTaskIds ?? []) ||
    completionNextTaskId !== (initialTask?.completionNextTaskId ?? "") ||
    Boolean(changeReason)

  const requestOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isDirty) {
      closeFocusRef.current = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
      setConfirmClose(true)
      return
    }
    onOpenChange(nextOpen)
  }
  const group = project?.groups.find((item) => item.id === initialTask?.groupId)
  const successor = relationCandidates.find(
    ({ task }) => task.id === completionNextTaskId,
  )?.task
  const advancedCount = [
    deferredUntil, deferReason, deferNote, delegationNote,
  ].filter(Boolean).length
  const advancedSummary = deferredUntil
    ? `Отложено до ${deferredUntil.split("-").reverse().join(".")}`
    : TASK_DEFER_REASON_OPTIONS.find((option) => option.value === deferReason)?.label
      ?? (delegationNote ? "Комментарий по делегированию"
        : deferNote ? "Комментарий к переносу" : "Перенос и делегирование")
  const titleInvalid = titleTouched && !title.trim()

  return (
    <>
      <Dialog open={open} onOpenChange={requestOpenChange}>
        <DialogContent
          showCloseButton={false}
          className="flex max-h-[90dvh] w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden bg-white p-0 text-slate-950 dark:bg-slate-900 dark:text-slate-100 sm:max-w-[1140px]"
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            returnFocusRef.current = document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null
            if (initialTask) headingRef.current?.focus()
            else titleRef.current?.focus()
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus()
          }}
          onKeyDown={(event) => {
            if (
              event.key === "Enter" &&
              (event.ctrlKey || event.metaKey) &&
              !event.nativeEvent.isComposing
            ) {
              event.preventDefault()
              if (!event.repeat && !(initialTask && !isDirty)) handleSubmit()
            }
          }}
        >
          <DialogHeader className="shrink-0 flex-row items-center justify-between gap-4 border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-7">
            <div className="flex min-w-0 flex-col gap-1.5 lg:flex-row lg:items-center lg:gap-6">
              <DialogTitle ref={headingRef} tabIndex={-1} className="shrink-0 text-xl font-semibold leading-7 tracking-tight outline-none">
                {initialTask ? "Редактировать задачу" : "Новая задача"}
              </DialogTitle>
              <DialogDescription className={project ? "truncate text-xs leading-5 text-slate-500 dark:text-slate-400 sm:text-sm" : "sr-only"}>
                {project
                  ? `Проект: ${project.title}${group ? ` / Раздел: ${group.title}` : ""}`
                  : "Название, содержание и параметры задачи"}
              </DialogDescription>
            </div>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="icon" className="size-11 rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2 focus-visible:ring-blue-400/40 dark:hover:bg-slate-800 dark:hover:text-slate-100" aria-label="Закрыть редактор задачи">
                <X aria-hidden />
              </Button>
            </DialogClose>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <div className="grid min-w-0 grid-cols-1 bg-slate-50 lg:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)] dark:bg-slate-950/40">
              <section aria-label="Содержание задачи" className="min-w-0 space-y-5 bg-white px-5 pt-6 pb-6 lg:col-start-1 lg:row-start-1 lg:px-7 lg:pb-0 dark:bg-slate-900">
                <div className="grid gap-2">
                  <Label htmlFor="task-title" className="text-sm font-medium">
                    Название задачи <span className="text-red-600 dark:text-red-400" aria-hidden>*</span>
                  </Label>
                  <Input
                    ref={titleRef}
                    id="task-title"
                    value={title}
                    required
                    aria-invalid={titleInvalid}
                    aria-describedby={titleInvalid ? "task-title-error" : undefined}
                    onBlur={() => setTitleTouched(true)}
                    onChange={(event) => setTitle(event.target.value)}
                    className={`${controlClass} h-[50px] px-4 font-medium md:text-base`}
                  />
                  {titleInvalid ? <p id="task-title-error" role="alert" className="text-xs text-red-600 dark:text-red-400">Введите название задачи.</p> : null}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="task-notes">Заметки</Label>
                  <Textarea
                    id="task-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={4}
                    className={`${controlClass} h-auto min-h-40 resize-y field-sizing-fixed bg-slate-50/70 px-4 py-3.5 leading-6 dark:bg-slate-950/30`}
                  />
                </div>
              </section>

              <section aria-labelledby="task-parameters-heading" className="min-w-0 space-y-4 border-y border-slate-200 px-5 py-6 lg:col-start-2 lg:row-start-1 lg:border-y-0 lg:border-l lg:px-6 dark:border-slate-800">
                <h2 id="task-parameters-heading" className="text-base font-semibold tracking-tight">Параметры задачи</h2>
                <div className="grid gap-2">
                  <Label htmlFor="task-status">Статус</Label>
                  <select id="task-status" value={status} onChange={(event) => setStatus(event.target.value as TaskStatus)} className={inspectorControlClass} aria-describedby={status === "in_progress" && incompleteSelectedBlockers.length ? "task-status-warning" : undefined}>
                    {TASK_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {status === "in_progress" && incompleteSelectedBlockers.length > 0 ? (
                    <p id="task-status-warning" role="status" className="text-xs leading-5 text-amber-700 dark:text-amber-400">
                      Пока зависимости не выполнены, при сохранении статус станет «Запланировано».
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-priority">Приоритет</Label>
                  <select id="task-priority" value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority | "")} className={inspectorControlClass}>
                    <option value="">Не задан</option>
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="task-assignee">Ответственный</Label>
                  <Input id="task-assignee" value={assignee} onChange={(event) => setAssignee(event.target.value)} placeholder="Имя или роль" className={inspectorControlClass} />
                </div>
              </section>

              <section aria-labelledby="task-schedule-heading" className="min-w-0 bg-white px-5 py-6 lg:col-start-1 lg:row-start-2 lg:px-7 dark:bg-slate-900">
                <h2 id="task-schedule-heading" className="mb-4 flex items-center gap-2.5 text-base font-semibold"><CalendarDays className="size-4 text-slate-600 dark:text-slate-400" aria-hidden />Сроки</h2>
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  <TaskScheduleFields
                    kind="deadline"
                    date={deadline}
                    time={deadlineTime}
                    reminder={deadlineReminder}
                    onDateChange={setDeadline}
                    onTimeChange={setDeadlineTime}
                    onReminderChange={setDeadlineReminder}
                  />
                  <TaskScheduleFields
                    kind="control"
                    date={followUpDate}
                    time={followUpTime}
                    reminder={followUpReminder}
                    onDateChange={setFollowUpDate}
                    onTimeChange={setFollowUpTime}
                    onReminderChange={setFollowUpReminder}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">Без времени — до конца дня; напоминание в день срока — в 09:00.</p>
              </section>

              <section aria-label="Настройки рабочего процесса" className="min-w-0 space-y-5 border-y border-slate-200 px-5 py-6 lg:col-start-2 lg:row-start-2 lg:row-span-2 lg:border-y-0 lg:border-l lg:px-6 lg:pt-0 dark:border-slate-800">
                <div className="border-y border-slate-200 py-5 dark:border-slate-800">
                  <label className="flex min-h-11 cursor-pointer items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span id="task-next-action-label" className="block text-sm font-medium">Следующая задача проекта</span>
                      <span id="task-next-action-help" className="mt-2 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                        {status === "done"
                          ? "Выполненная задача не может быть следующей."
                          : incompleteSelectedBlockers.length > 0
                            ? `Сначала завершите блокирующие задачи: ${incompleteSelectedBlockers.length}.`
                            : "Одна задача, которую нужно выполнить следующей, чтобы продвинуть проект."}
                      </span>
                    </span>
                    <span className="flex min-h-11 min-w-11 shrink-0 items-start justify-center pt-0.5">
                    <input
                      type="checkbox"
                      checked={isNextAction}
                      disabled={status === "done" || incompleteSelectedBlockers.length > 0}
                      onChange={(event) => setIsNextAction(event.target.checked)}
                      aria-labelledby="task-next-action-label"
                      aria-describedby="task-next-action-help"
                      className="peer sr-only"
                    />
                    <span aria-hidden className="relative h-6 w-11 rounded-full border border-slate-300 bg-slate-300/70 transition-colors after:absolute after:top-0.5 after:left-0.5 after:size-[18px] after:rounded-full after:bg-white after:transition-transform peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-blue-400/50 peer-focus-visible:ring-offset-2 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:ring-offset-slate-900" />
                    </span>
                  </label>
                </div>
                <details open={advancedOpen} onToggle={(event) => setAdvancedOpen(event.currentTarget.open)} className="group/advanced">
                  <summary className={summaryClass}>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">Дополнительно</span>
                      <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">{advancedSummary}</span>
                    </span>
                    {advancedCount > 0 ? <span className={badgeClass} aria-label={`Заполнено полей: ${advancedCount}`}>{advancedCount}</span> : null}
                    <ChevronDown className="size-4 shrink-0 text-slate-500 transition-transform group-open/advanced:rotate-180" aria-hidden />
                  </summary>
                  <div className="mt-3 grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="task-deferred-until">Отложить до</Label>
                      <Input id="task-deferred-until" type="date" value={deferredUntil} onChange={(event) => setDeferredUntil(event.target.value)} className={controlClass} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-defer-reason">Причина переноса</Label>
                      <select id="task-defer-reason" value={deferReason} onChange={(event) => setDeferReason(event.target.value as TaskDeferReason | "")} className={controlClass}>
                        <option value="">Не указана</option>
                        {TASK_DEFER_REASON_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-defer-note">Комментарий к переносу</Label>
                      <Textarea id="task-defer-note" value={deferNote} onChange={(event) => setDeferNote(event.target.value)} rows={2} placeholder="Что изменилось и при каком условии вернуться" className={`${controlClass} h-auto resize-y field-sizing-fixed py-2`} />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="task-delegation-note">Комментарий по делегированию</Label>
                      <Textarea id="task-delegation-note" value={delegationNote} onChange={(event) => setDelegationNote(event.target.value)} rows={2} placeholder="Что передано и какой результат должен вернуться" className={`${controlClass} h-auto resize-y field-sizing-fixed py-2`} />
                    </div>
                  </div>
                </details>
              </section>

              <div className="min-w-0 space-y-4 bg-white px-5 pb-6 pt-6 lg:col-start-1 lg:row-start-3 lg:px-7 lg:pb-7 lg:pt-0 dark:bg-slate-900">
                {relationCandidates.length > 0 ? (
                  <details className="group/relations rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/30">
                    <summary className={summaryClass}>
                      <Link2 className="size-4 shrink-0 text-slate-500" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">Связи задач</span>
                        <span className="mt-0.5 block break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {blockedByTaskIds.length ? `Зависимости: ${blockedByTaskIds.length}` : "Нет зависимостей"}
                          {successor ? ` · После выполнения: ${successor.title}` : ""}
                        </span>
                      </span>
                      <span className={badgeClass} aria-label={`Зависимости: ${blockedByTaskIds.length}`}>{blockedByTaskIds.length}</span>
                      <ChevronDown className="size-4 shrink-0 text-slate-500 transition-transform group-open/relations:rotate-180" aria-hidden />
                    </summary>
                    <div className="space-y-4 border-t border-slate-200 p-4 dark:border-slate-800">
                      <fieldset className="min-w-0">
                        <legend className="mb-2 text-sm font-medium">Задача доступна после</legend>
                        <div className="space-y-1 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900">
                          {relationCandidates.map(({ task, groupTitle }) => {
                            const checked = blockedByTaskIds.includes(task.id)
                            const createsCycle = !checked && Boolean(
                              project && initialTask &&
                              wouldCreateBlockingDependencyCycle(
                                project, initialTask.id, task.id,
                              ),
                            )
                            return (
                              <label key={task.id} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={createsCycle}
                                  onChange={(event) => setBlockedByTaskIds((current) =>
                                    event.target.checked ? [...new Set([...current, task.id])] : current.filter((id) => id !== task.id),
                                  )}
                                  className="mt-0.5 size-4 shrink-0 accent-blue-600 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:ring-offset-slate-900"
                                />
                                <span className="min-w-0">
                                  <span className="block break-words font-medium">{task.title}</span>
                                  <span className="block break-words text-xs leading-5 text-slate-500 dark:text-slate-400">
                                    {groupTitle}{task.completed ? " · выполнено" : ""}{createsCycle ? " · создаст цикл" : ""}
                                  </span>
                                </span>
                              </label>
                            )
                          })}
                        </div>
                        {incompleteSelectedBlockers.length > 0 ? (
                          <p className="mt-2 text-xs leading-5 text-amber-700 dark:text-amber-400">Пока не выполнено: {incompleteSelectedBlockers.length}. Эту задачу нельзя считать следующей задачей проекта.</p>
                        ) : null}
                      </fieldset>
                      <div className="grid gap-2">
                        <Label htmlFor="task-completion-next">После выполнения</Label>
                        <select id="task-completion-next" value={completionNextTaskId} disabled={status === "done"} onChange={(event) => setCompletionNextTaskId(event.target.value)} className={controlClass}>
                          <option value="">Ничего не выбирать автоматически</option>
                          {relationCandidates.filter(({ task }) => !task.completed).map(({ task, groupTitle }) => (
                            <option key={task.id} value={task.id}>{task.title} · {groupTitle}</option>
                          ))}
                        </select>
                        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Выбранная задача станет следующей после выполнения текущей, если все её блокирующие задачи выполнены. В работу автоматически не переходит.</p>
                      </div>
                    </div>
                  </details>
                ) : null}
                {initialTask ? <TaskHistoryPanel taskId={initialTask.id} /> : null}
              </div>
            </div>
          </div>

          <DialogFooter className="m-0 shrink-0 flex-col gap-4 border-slate-200 bg-slate-50/70 px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:flex-row sm:items-end sm:px-7 dark:border-slate-800 dark:bg-slate-950/30">
            {initialTask && hasTrackedChanges ? (
              <div className="grid min-w-0 flex-1 gap-1.5">
                <Label htmlFor="task-change-reason" className="text-xs text-slate-600 dark:text-slate-400">Причина правки <span className="font-normal">— необязательно</span></Label>
                <Input id="task-change-reason" value={changeReason} onChange={(event) => setChangeReason(event.target.value)} placeholder="Например: срок изменён после встречи" className={controlClass} />
              </div>
            ) : null}
            <div className="flex shrink-0 items-center justify-end gap-2">
              <Button type="button" variant="outline" className="h-11 border-slate-200 bg-white px-5 text-slate-600 focus-visible:ring-2 focus-visible:ring-blue-400/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" onClick={() => requestOpenChange(false)}>Отмена</Button>
              <Button type="button" className="h-11 min-w-32 bg-blue-600 px-5 text-white hover:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400/40 disabled:bg-slate-200 disabled:text-slate-500 disabled:opacity-100 dark:disabled:bg-slate-800 dark:disabled:text-slate-400" disabled={!title.trim() || Boolean(initialTask && !isDirty)} onClick={handleSubmit}>
                <Check className="size-4" aria-hidden />Сохранить
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent
          className="bg-white data-[size=default]:max-w-[calc(100%-2rem)] data-[size=default]:sm:max-w-md dark:bg-slate-900"
          onCloseAutoFocus={(event) => {
            event.preventDefault()
            if (closeFocusRef.current?.isConnected) closeFocusRef.current.focus()
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>Закрыть без сохранения?</AlertDialogTitle>
            <AlertDialogDescription>Изменения задачи будут потеряны.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">Продолжить редактирование</AlertDialogCancel>
            <AlertDialogAction className="h-11" onClick={() => onOpenChange(false)}>Не сохранять</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export function TaskDialog(props: TaskDialogProps) {
  return props.open ? <TaskDialogEditor key={props.initialTask?.id ?? "__add__"} {...props} /> : null
}
