import { DeleteConfirmDialog } from "@/features/projects/components/DeleteConfirmDialog"

type DeleteHabitDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  habitName?: string
  onConfirm: () => void
}

export function DeleteHabitDialog({
  open,
  onOpenChange,
  habitName,
  onConfirm,
}: DeleteHabitDialogProps) {
  return (
    <DeleteConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Удалить привычку?"
      description={`Привычка «${habitName ?? ""}» и вся её история выполнения будут удалены.`}
      onConfirm={onConfirm}
    />
  )
}
