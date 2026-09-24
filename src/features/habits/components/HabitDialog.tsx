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
import type { Habit, Project } from "@/store/appState.types"

export type HabitFormValues = {
  name: string
  description?: string
  projectId?: string
  targetPerWeek: number
}

type HabitDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialHabit?: Habit
  projects: Project[]
  onSubmit: (values: HabitFormValues) => void
}

function HabitDialogFields({
  initialHabit,
  projects,
  onSubmit,
  onOpenChange,
}: {
  initialHabit?: Habit
  projects: Project[]
  onSubmit: (values: HabitFormValues) => void
  onOpenChange: (open: boolean) => void
}) {
  const [name, setName] = useState(initialHabit?.name ?? "")
  const [description, setDescription] = useState(
    initialHabit?.description ?? "",
  )
  const [projectId, setProjectId] = useState(initialHabit?.projectId ?? "")
  const [targetPerWeek, setTargetPerWeek] = useState(
    initialHabit?.schedule?.targetPerWeek ?? 7,
  )

  const handleSubmit = () => {
    const n = name.trim()
    if (!n) return
    onSubmit({
      name: n,
      description: description.trim() || undefined,
      projectId: projectId || undefined,
      targetPerWeek: Math.max(1, Math.min(7, targetPerWeek)),
    })
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader className="min-w-0 shrink-0 px-0 text-left">
        <DialogTitle className="break-words text-slate-950 dark:text-slate-100">
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
              className="min-w-0 border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              placeholder="Например, Прогулка 30 минут"
            />
          </div>

          <div className="grid min-w-0 gap-2">
            <Label htmlFor="habit-desc">Описание</Label>
            <Textarea
              id="habit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-w-0 border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              rows={3}
            />
          </div>

          <div className="grid min-w-0 gap-2">
            <Label htmlFor="habit-frequency">Норма в неделю</Label>
            <select
              id="habit-frequency"
              value={targetPerWeek}
              onChange={(e) => setTargetPerWeek(Number(e.target.value))}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {Array.from({ length: 7 }, (_, index) => index + 1).map((count) => (
                <option key={count} value={count}>
                  {count} {count === 1 ? "раз" : count < 5 ? "раза" : "раз"} в неделю
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Compliance считается относительно этой нормы, а не автоматически из 7 дней.
            </p>
          </div>

          <div className="grid min-w-0 gap-2">
            <Label htmlFor="habit-project">Связь с проектом</Label>
            <select
              id="habit-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Глобальная привычка</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.title}
                </option>
              ))}
            </select>
            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
              Связанная привычка будет учитываться в аналитике соответствующей цели.
            </p>
          </div>
        </div>
      </div>

      <DialogFooter className="mt-2 shrink-0 gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 sm:mt-0 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          className="min-h-10 w-full border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto sm:min-h-9"
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
  projects,
  onSubmit,
}: HabitDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex min-h-0 max-h-[90vh] max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-4 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:max-w-md"
      >
        {open ? (
          <HabitDialogFields
            key={initialHabit?.id ?? "__add__"}
            initialHabit={initialHabit}
            projects={projects}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
