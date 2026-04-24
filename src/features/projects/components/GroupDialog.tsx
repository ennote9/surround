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
import type { TaskGroup } from "@/store/appState.types"

type GroupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialGroup?: TaskGroup
  onSubmit: (values: { title: string }) => void
}

function GroupDialogFields({
  initialGroup,
  onSubmit,
  onOpenChange,
}: {
  initialGroup?: TaskGroup
  onSubmit: (values: { title: string }) => void
  onOpenChange: (open: boolean) => void
}) {
  const [title, setTitle] = useState(initialGroup?.title ?? "")

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onSubmit({ title: t })
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {initialGroup ? "Редактировать группу" : "Новая группа"}
        </DialogTitle>
      </DialogHeader>
      <div className="grid gap-2 py-2">
        <Label htmlFor="group-title">Название группы</Label>
        <Input
          id="group-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border-slate-300"
          placeholder="Например, Документы"
        />
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
          disabled={!title.trim()}
          onClick={handleSubmit}
        >
          Сохранить
        </Button>
      </DialogFooter>
    </>
  )
}

export function GroupDialog({
  open,
  onOpenChange,
  initialGroup,
  onSubmit,
}: GroupDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
        {open ? (
          <GroupDialogFields
            key={initialGroup?.id ?? "__add__"}
            initialGroup={initialGroup}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
