import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import {
  ArrowRight,
  CheckCircle2,
  CircleDot,
  Gauge,
  SkipForward,
} from "lucide-react"
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
  HABIT_REASON_OPTIONS,
  getHabitEntryStatus,
} from "@/shared/lib/habitEntries"
import {
  getHabitCompletionType,
  getHabitMinimumValue,
  getHabitTargetValue,
  getHabitUnit,
} from "@/store/selectors"
import type {
  Habit,
  HabitEntry,
  HabitEntryLoad,
  HabitEntryReason,
  HabitEntryStatus,
} from "@/store/appState.types"

type HabitLogDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit | null
  date: string | null
  onSave: (entry: HabitEntry) => void
}

const OUTCOMES: Array<{
  value: HabitEntryStatus
  label: string
  icon: typeof CheckCircle2
}> = [
  { value: "completed", label: "Выполнено", icon: CheckCircle2 },
  { value: "partial", label: "Частично", icon: CircleDot },
  { value: "skipped", label: "Пропустить", icon: SkipForward },
  { value: "rescheduled", label: "Перенести", icon: ArrowRight },
]

function LogFields({
  habit,
  date,
  onSave,
  onOpenChange,
}: {
  habit: Habit
  date: string
  onSave: (entry: HabitEntry) => void
  onOpenChange: (open: boolean) => void
}) {
  const existing = habit.dailyEntries?.[date]
  const completionType = getHabitCompletionType(habit)
  const minimum = getHabitMinimumValue(habit)
  const target = getHabitTargetValue(habit)
  const unit = getHabitUnit(habit)

  const initialStatus = getHabitEntryStatus(existing)
  const [status, setStatus] = useState<HabitEntryStatus>(
    initialStatus === "planned" ? "completed" : initialStatus,
  )
  const [value, setValue] = useState(
    existing?.value != null ? String(existing.value) : "",
  )
  const [note, setNote] = useState(existing?.note ?? "")
  const [reason, setReason] = useState<HabitEntryReason | "">(
    existing?.reason ?? "",
  )
  const [helped, setHelped] = useState(existing?.helped ?? "")
  const [rescheduledTo, setRescheduledTo] = useState(
    existing?.rescheduledTo ?? "",
  )
  const [energy, setEnergy] = useState(
    existing?.energy != null ? String(existing.energy) : "",
  )
  const [load, setLoad] = useState<HabitEntryLoad | "">(
    existing?.load ?? "",
  )
  const [error, setError] = useState<string | null>(null)

  const numericStatus = status === "completed" || status === "partial"
  const numeric = Number(value)

  const handleSave = () => {
    let parsedValue: number | undefined

    if (numericStatus && completionType !== "check") {
      if (!Number.isFinite(numeric) || numeric < 0) {
        setError("Введите корректное значение.")
        return
      }
      parsedValue = numeric

      if (status === "completed" && minimum !== undefined && numeric < minimum) {
        setError(
          `Для полного выполнения нужно минимум ${minimum} ${unit}. Выбери «Частично» или увеличь значение.`,
        )
        return
      }
      if (status === "partial" && numeric <= 0) {
        setError("Для частичного выполнения укажи фактический результат больше нуля.")
        return
      }
    }

    if (status === "rescheduled") {
      if (!rescheduledTo) {
        setError("Выбери дату переноса.")
        return
      }
      if (rescheduledTo <= date) {
        setError("Перенос должен быть на более позднюю дату.")
        return
      }
    }

    const parsedEnergy = Number(energy)
    const validEnergy =
      Number.isInteger(parsedEnergy) && parsedEnergy >= 1 && parsedEnergy <= 5
        ? (parsedEnergy as 1 | 2 | 3 | 4 | 5)
        : undefined

    onSave({
      completed: status === "completed",
      ...(parsedValue !== undefined ? { value: parsedValue } : {}),
      note: note.trim() || undefined,
      skipped: status === "skipped",
      status,
      ...(reason ? { reason } : {}),
      ...(helped.trim() ? { helped: helped.trim() } : {}),
      ...(status === "rescheduled" && rescheduledTo
        ? { rescheduledTo }
        : {}),
      recordedAt: new Date().toISOString(),
      ...(validEnergy ? { energy: validEnergy } : {}),
      ...(load ? { load } : {}),
    })
    onOpenChange(false)
  }

  const progress =
    target && Number(value) >= 0
      ? Math.min(100, Math.round((Number(value || 0) / target) * 100))
      : 0

  const showReason = status === "partial" || status === "skipped" || status === "rescheduled"
  const showHelped = status === "completed" || status === "partial"

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle className="text-slate-950 dark:text-slate-100">
          Отметка привычки
        </DialogTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {habit.name} · {format(parseISO(date), "d MMMM", { locale: ru })}
        </p>
      </DialogHeader>

      <div className="max-h-[68vh] space-y-4 overflow-y-auto py-2 pr-0.5">
        <div className="grid grid-cols-2 gap-2">
          {OUTCOMES.map(({ value: outcome, label, icon: Icon }) => {
            const selected = status === outcome
            return (
              <button
                key={outcome}
                type="button"
                onClick={() => {
                  setStatus(outcome)
                  setError(null)
                }}
                className={
                  selected
                    ? "flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-500 bg-blue-50 px-3 text-sm font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                    : "flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-950/55 dark:text-slate-300"
                }
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </button>
            )
          })}
        </div>

        {numericStatus && completionType !== "check" ? (
          <>
            <div className="rounded-2xl bg-slate-50 p-3.5 dark:bg-slate-950/55">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {completionType === "duration" ? "Время" : "Количество"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-950 dark:text-slate-100">
                    {minimum != null ? `Минимум ${minimum} ${unit}` : "Без минимума"}
                    {target != null ? ` · цель ${target} ${unit}` : ""}
                  </p>
                </div>
                <span className="flex size-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                  <Gauge className="size-5" aria-hidden />
                </span>
              </div>

              {target ? (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-[width]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="habit-log-value">
                Фактическое значение, {unit}
              </Label>
              <Input
                id="habit-log-value"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={value}
                onChange={(event) => {
                  setValue(event.target.value)
                  setError(null)
                }}
                className="min-h-12 text-lg dark:border-slate-700 dark:bg-slate-950"
                placeholder={target != null ? String(target) : "0"}
              />
            </div>
          </>
        ) : null}

        {status === "rescheduled" ? (
          <div className="grid gap-2">
            <Label htmlFor="habit-rescheduled-to">Перенести на</Label>
            <Input
              id="habit-rescheduled-to"
              type="date"
              min={date}
              value={rescheduledTo}
              onChange={(event) => {
                setRescheduledTo(event.target.value)
                setError(null)
              }}
              className="min-h-11 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        ) : null}

        {showReason ? (
          <div className="space-y-2">
            <Label>Причина</Label>
            <div className="flex flex-wrap gap-2">
              {HABIT_REASON_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setReason((current) =>
                      current === option.value ? "" : option.value,
                    )
                  }
                  className={
                    reason === option.value
                      ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {showHelped ? (
          <div className="grid gap-2">
            <Label htmlFor="habit-log-helped">Что помогло?</Label>
            <Input
              id="habit-log-helped"
              value={helped}
              onChange={(event) => setHelped(event.target.value)}
              placeholder="Необязательно"
              className="dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        ) : null}

        <div className="grid gap-2">
          <Label htmlFor="habit-log-note">Комментарий</Label>
          <Textarea
            id="habit-log-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Контекст дня, что помешало или что было необычного"
            className="dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

        <details className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <summary className="cursor-pointer text-sm font-medium text-slate-700 dark:text-slate-300">
            Дополнительный контекст
          </summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="habit-energy">Энергия 1–5</Label>
              <select
                id="habit-energy"
                value={energy}
                onChange={(event) => setEnergy(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Не указывать</option>
                <option value="1">1 — очень низкая</option>
                <option value="2">2 — низкая</option>
                <option value="3">3 — нормальная</option>
                <option value="4">4 — высокая</option>
                <option value="5">5 — очень высокая</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="habit-load">Нагрузка</Label>
              <select
                id="habit-load"
                value={load}
                onChange={(event) => setLoad(event.target.value as HabitEntryLoad | "")}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Не указывать</option>
                <option value="low">Низкая</option>
                <option value="normal">Обычная</option>
                <option value="high">Высокая</option>
              </select>
            </div>
          </div>
        </details>

        {error ? (
          <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        ) : null}
      </div>

      <DialogFooter className="gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 sm:gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full border-slate-300 dark:border-slate-700 dark:bg-slate-900 sm:w-auto"
          onClick={() => onOpenChange(false)}
        >
          Отмена
        </Button>
        <Button
          type="button"
          className="min-h-11 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
          onClick={handleSave}
        >
          <CheckCircle2 className="mr-1.5 size-4" aria-hidden />
          Сохранить
        </Button>
      </DialogFooter>
    </>
  )
}

export function HabitLogDialog({
  open,
  onOpenChange,
  habit,
  date,
  onSave,
}: HabitLogDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[calc(100vw-1rem)] border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:max-w-md"
      >
        {open && habit && date ? (
          <LogFields
            key={`${habit.id}-${date}`}
            habit={habit}
            date={date}
            onSave={onSave}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
