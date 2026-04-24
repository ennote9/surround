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
      <DialogHeader>
        <DialogTitle>
          {initialHabit ? "Редактировать привычку" : "Новая привычка"}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-2">
        <div className="grid gap-2">
          <Label htmlFor="habit-name">Название</Label>
          <Input
            id="habit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border-slate-300"
            placeholder="Например, Duolingo"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="habit-desc">Описание</Label>
          <Textarea
            id="habit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
      <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
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
