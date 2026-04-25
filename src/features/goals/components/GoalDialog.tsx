import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import type { Goal, GoalStatus } from "@/store/appState.types"

export type GoalFormValues = {
  title: string
  description?: string
  targetDate?: string
  status: GoalStatus
  showOnDashboard: boolean
}

type GoalDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: Goal
  onSubmit: (values: GoalFormValues) => void
}

function GoalDialogFields({
  goal,
  onSubmit,
  onOpenChange,
}: {
  goal?: Goal
  onSubmit: (values: GoalFormValues) => void
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState(goal?.title ?? "")
  const [description, setDescription] = useState(goal?.description ?? "")
  const [targetDate, setTargetDate] = useState(goal?.targetDate ?? "")
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? "active")
  const [showOnDashboard, setShowOnDashboard] = useState(
    goal ? goal.showOnDashboard !== false : true,
  )

  const isEdit = Boolean(goal)

  const handleSubmit = () => {
    const nextTitle = title.trim()
    if (!nextTitle) return

    onSubmit({
      title: nextTitle,
      description: description.trim() || undefined,
      targetDate: targetDate.trim() || undefined,
      status,
      showOnDashboard,
    })
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4">
        <DialogTitle className="text-lg text-slate-950">
          {isEdit ? "Редактировать цель" : "Новая цель"}
        </DialogTitle>
      </DialogHeader>

      <div className="space-y-4 px-5 py-4">
        <div className="grid gap-2">
          <Label htmlFor="goal-title">Название</Label>
          <Input
            id="goal-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="border-slate-300"
            placeholder="Например, Переезд в Канаду"
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="goal-description">Описание</Label>
          <Textarea
            id="goal-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="border-slate-300"
            rows={3}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="goal-target-date">Целевая дата</Label>
            <Input
              id="goal-target-date"
              type="date"
              value={targetDate}
              onChange={(event) => setTargetDate(event.target.value)}
              className="border-slate-300"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="goal-status">Статус</Label>
            <select
              id="goal-status"
              value={status}
              onChange={(event) => setStatus(event.target.value as GoalStatus)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            >
              <option value="active">Сейчас</option>
              <option value="later">Позже</option>
              <option value="archived">Архив</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <Checkbox
            id="goal-show-on-dashboard"
            checked={showOnDashboard}
            onCheckedChange={(value) => setShowOnDashboard(value === true)}
            className="mt-0.5 border-slate-400 data-checked:border-blue-600 data-checked:bg-blue-600"
          />
          <div className="min-w-0 flex-1">
            <Label
              htmlFor="goal-show-on-dashboard"
              className="cursor-pointer text-sm font-medium leading-snug text-slate-950"
            >
              Показывать на Главной
            </Label>
          </div>
        </div>
      </div>

      <DialogFooter className="shrink-0 gap-2 border-t border-slate-200 bg-slate-50/90 px-5 py-3 sm:flex-row sm:justify-end">
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
          {isEdit ? "Сохранить" : "Создать"}
        </Button>
      </DialogFooter>
    </>
  )
}

export function GoalDialog({ open, onOpenChange, goal, onSubmit }: GoalDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-950 sm:max-w-xl"
      >
        {open ? (
          <GoalDialogFields
            key={goal?.id ?? "__add_goal__"}
            goal={goal}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
