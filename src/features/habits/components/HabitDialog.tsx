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
import type { Habit } from "@/store/appState.types"

type HabitDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialHabit?: Habit
  onSubmit: (values: { name: string; description?: string }) => void
}

function HabitDialogFields({
  initialHabit,
  onSubmit,
  onOpenChange,
}: {
  initialHabit?: Habit
  onSubmit: (values: { name: string; description?: string }) => void
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState(initialHabit?.name ?? "")
  const [description, setDescription] = useState(
    initialHabit?.description ?? "",
  )

  const handleSubmit = () => {
    const n = name.trim()
    if (!n) return
    onSubmit({
      name: n,
      description: description.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader className="min-w-0 shrink-0 px-0 text-left">
        <DialogTitle className="break-words text-slate-950">
          {initialHabit ? "Редактировать привычку" : "Новая привычка"}
        </DialogTitle>
      </DialogHeader>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain py-2">
        <div className="grid gap-4">
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="habit-name">Название</Label>
            <Input
              id="habit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-w-0 border-slate-300"
              placeholder="Например, Duolingo"
            />
          </div>
          <div className="grid min-w-0 gap-2">
            <Label htmlFor="habit-desc">Описание</Label>
            <Textarea
              id="habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-w-0 border-slate-300"
              rows={3}
            />
          </div>
        </div>
      </div>
      <DialogFooter className="mt-2 shrink-0 gap-2 sm:mt-0 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          className="min-h-10 w-full border-slate-300 sm:w-auto sm:min-h-9"
          onClick={() => onOpenChange(false)}
        >
          Отмена
        </Button>
        <Button
          type="button"
          className="min-h-10 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto sm:min-h-9"
          disabled={!name.trim()}
          onClick={handleSubmit}
        >
          Сохранить
        </Button>
      </DialogFooter>
    </>
  )
}

export function HabitDialog({
  open,
  onOpenChange,
  initialHabit,
  onSubmit,
}: HabitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex min-h-0 max-h-[90vh] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-4 text-slate-950 sm:max-w-md"
      >
        {open ? (
          <HabitDialogFields
            key={initialHabit?.id ?? "__add__"}
            initialHabit={initialHabit}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
