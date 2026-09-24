import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import { CheckCircle2, Gauge, SkipForward } from "lucide-react"
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
  getHabitCompletionType,
  getHabitMinimumValue,
  getHabitTargetValue,
  getHabitUnit,
} from "@/store/selectors"
import type { Habit, HabitEntry } from "@/store/appState.types"

type HabitLogDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit | null
  date: string | null
  onSave: (entry: HabitEntry) => void
}

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

  const [value, setValue] = useState(
    existing?.value != null ? String(existing.value) : "",
  )
  const [note, setNote] = useState(existing?.note ?? "")
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    const numeric = Number(value)
    if (!Number.isFinite(numeric) || numeric < 0) {
      setError("Введите корректное значение.")
      return
    }

    onSave({
      value: numeric,
      completed: minimum !== undefined ? numeric >= minimum : numeric > 0,
      note: note.trim() || undefined,
      skipped: false,
    })
    onOpenChange(false)
  }

  const handleSkip = () => {
    onSave({
      completed: false,
      note: note.trim() || undefined,
      skipped: true,
    })
    onOpenChange(false)
  }

  const progress =
    target && Number(value) >= 0
      ? Math.min(100, Math.round((Number(value || 0) / target) * 100))
      : 0

  return (
    <>
      <DialogHeader className="text-left">
        <DialogTitle className="text-slate-950 dark:text-slate-100">
          Отметить выполнение
        </DialogTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {habit.name} · {format(parseISO(date), "d MMMM", { locale: ru })}
        </p>
      </DialogHeader>

      <div className="space-y-4 py-2">
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
            autoFocus
            className="min-h-12 text-lg dark:border-slate-700 dark:bg-slate-950"
            placeholder={target != null ? String(target) : "0"}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="habit-log-note">Заметка</Label>
          <Textarea
            id="habit-log-note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={2}
            placeholder="Необязательно"
            className="dark:border-slate-700 dark:bg-slate-950"
          />
        </div>

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
          onClick={handleSkip}
        >
          <SkipForward className="mr-1.5 size-4" aria-hidden />
          Пропустить
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
