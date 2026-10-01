import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Flag,
  LockKeyhole,
} from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  getIncompleteTaskBlockers,
  getTaskById,
} from "@/shared/lib/taskDependencies"
import type { TaskCalendarEvent } from "@/shared/lib/taskCalendar"

type CalendarEventDialogProps = {
  event: TaskCalendarEvent
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (date?: string, time?: string) => void
  onOpenTask: () => void
}

export function CalendarEventDialog({
  event,
  open,
  onOpenChange,
  onSave,
  onOpenTask,
}: CalendarEventDialogProps) {
  const [date, setDate] = useState(event.date)
  const [time, setTime] = useState(event.time ?? "")

  const incompleteBlockers = getIncompleteTaskBlockers(
    event.project,
    event.task,
  )
  const allBlockers = (event.task.blockedByTaskIds ?? [])
    .map((id) => getTaskById(event.project, id))
    .filter((task) => task !== undefined)
  const successor = event.task.completionNextTaskId
    ? getTaskById(event.project, event.task.completionNextTaskId)
    : undefined

  const kindLabel = event.kind === "deadline" ? "Дедлайн" : "Контроль"
  const changed =
    date !== event.date ||
    (time || undefined) !== event.time

  const handleSave = () => {
    onSave(date.trim() || undefined, date.trim() ? time.trim() || undefined : undefined)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-200 bg-white text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-start gap-3 pr-8">
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {event.kind === "deadline" ? (
                <Flag className="size-4" aria-hidden />
              ) : (
                <Clock3 className="size-4" aria-hidden />
              )}
            </span>
            <div className="min-w-0">
              <DialogTitle className="break-words text-base leading-5">
                {event.task.title}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {kindLabel} · {event.project.title} · {event.group.title}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4">
          <section className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40">
            <div className="grid gap-1.5">
              <label
                htmlFor="calendar-event-date"
                className="text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Дата
              </label>
              <Input
                id="calendar-event-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="h-10 bg-white dark:bg-slate-950"
              />
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-center justify-between gap-3">
                <label
                  htmlFor="calendar-event-time"
                  className="text-xs font-medium text-slate-700 dark:text-slate-300"
                >
                  Точное время
                </label>
                {time ? (
                  <button
                    type="button"
                    onClick={() => setTime("")}
                    className="text-[11px] font-medium text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    Убрать время
                  </button>
                ) : null}
              </div>
              <Input
                id="calendar-event-time"
                type="time"
                value={time}
                disabled={!date}
                onChange={(event) => setTime(event.target.value)}
                className="h-10 bg-white dark:bg-slate-950"
              />
              <p className="text-[11px] leading-4 text-slate-400">
                Без времени событие остаётся на весь день. Искусственное время не подставляется.
              </p>
            </div>
          </section>

          {(allBlockers.length > 0 || successor) ? (
            <section className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Связи задачи
              </p>

              {allBlockers.length > 0 ? (
                <div className="mt-2 space-y-1.5">
                  {allBlockers.map((blocker) => {
                    const pending = incompleteBlockers.some(
                      (task) => task.id === blocker.id,
                    )
                    return (
                      <div
                        key={blocker.id}
                        className="flex items-start gap-2 rounded-lg bg-slate-50 px-2.5 py-2 dark:bg-slate-950/60"
                      >
                        {pending ? (
                          <LockKeyhole
                            className="mt-0.5 size-3.5 shrink-0 text-amber-600 dark:text-amber-400"
                            aria-hidden
                          />
                        ) : (
                          <CheckCircle2
                            className="mt-0.5 size-3.5 shrink-0 text-slate-400"
                            aria-hidden
                          />
                        )}
                        <div className="min-w-0">
                          <p className="break-words text-xs font-medium text-slate-700 dark:text-slate-300">
                            {blocker.title}
                          </p>
                          <p className="mt-0.5 text-[10px] text-slate-400">
                            {pending ? "Ещё блокирует задачу" : "Зависимость выполнена"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {successor ? (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-blue-50/70 px-2.5 py-2 dark:bg-blue-500/5">
                  <ArrowRight
                    className="mt-0.5 size-3.5 shrink-0 text-blue-600 dark:text-blue-300"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="break-words text-xs font-medium text-slate-700 dark:text-slate-300">
                      После выполнения → {successor.title}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      Следующая задача будет выбрана только когда её блокеры выполнены.
                    </p>
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onOpenTask}
            className="gap-2"
          >
            <ExternalLink className="size-4" aria-hidden />
            Открыть задачу
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!changed}
          >
            Сохранить
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
