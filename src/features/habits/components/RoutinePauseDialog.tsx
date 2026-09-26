import { useState } from "react"
import { addDays, format } from "date-fns"
import { PauseCircle } from "lucide-react"
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

export type RoutinePauseValues = {
  startDate: string
  endDate: string
  reason?: string
}

type RoutinePauseDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: RoutinePauseValues) => void
}

function toDateInput(date: Date) {
  return format(date, "yyyy-MM-dd")
}

export function RoutinePauseDialog({
  open,
  onOpenChange,
  onSubmit,
}: RoutinePauseDialogProps) {
  const today = new Date()
  const [startDate, setStartDate] = useState(toDateInput(today))
  const [endDate, setEndDate] = useState(toDateInput(addDays(today, 6)))
  const [reasonPreset, setReasonPreset] = useState("")
  const [customReason, setCustomReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = () => {
    if (!startDate || !endDate) {
      setError("Укажи начало и конец паузы.")
      return
    }
    if (endDate < startDate) {
      setError("Конец паузы не может быть раньше начала.")
      return
    }

    const presetLabels: Record<string, string> = {
      vacation: "Отпуск",
      health: "Самочувствие",
      trip: "Командировка / поездка",
      recovery: "Восстановление",
      overload: "Высокая нагрузка",
      other: "Другое",
    }
    const reason =
      reasonPreset === "other"
        ? customReason.trim()
        : (presetLabels[reasonPreset] ?? "")

    onSubmit({
      startDate,
      endDate,
      ...(reason ? { reason } : {}),
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="max-w-[calc(100vw-1rem)] border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 sm:max-w-md"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="flex items-center gap-2 text-slate-950 dark:text-slate-100">
            <PauseCircle className="size-5 text-blue-600 dark:text-blue-400" aria-hidden />
            Пауза рутины
          </DialogTitle>
          <p className="text-sm leading-5 text-slate-500 dark:text-slate-400">
            Дни паузы исключаются из планов и расчёта регулярности, но история остаётся.
          </p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="routine-pause-start">С</Label>
              <Input
                id="routine-pause-start"
                type="date"
                value={startDate}
                onChange={(event) => {
                  setStartDate(event.target.value)
                  setError(null)
                }}
                className="dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="routine-pause-end">По</Label>
              <Input
                id="routine-pause-end"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(event) => {
                  setEndDate(event.target.value)
                  setError(null)
                }}
                className="dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="routine-pause-reason">Причина</Label>
            <select
              id="routine-pause-reason"
              value={reasonPreset}
              onChange={(event) => setReasonPreset(event.target.value)}
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950"
            >
              <option value="">Не указывать</option>
              <option value="vacation">Отпуск</option>
              <option value="health">Самочувствие</option>
              <option value="trip">Командировка / поездка</option>
              <option value="recovery">Восстановление</option>
              <option value="overload">Высокая нагрузка</option>
              <option value="other">Другое</option>
            </select>
          </div>

          {reasonPreset === "other" ? (
            <div className="grid gap-2">
              <Label htmlFor="routine-pause-custom">Комментарий</Label>
              <Textarea
                id="routine-pause-custom"
                value={customReason}
                onChange={(event) => setCustomReason(event.target.value)}
                rows={2}
                placeholder="Почему нужна пауза"
                className="dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          ) : null}

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
            onClick={handleSubmit}
          >
            Поставить на паузу
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
