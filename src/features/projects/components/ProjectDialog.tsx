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
import { CHARACTER_STATS } from "@/features/dashboard/characterStats"
import { isProjectUnassigned } from "@/shared/lib/selectedGoal"
import { PROJECT_PHASES } from "@/shared/lib/projectPhases"
import type {
  CharacterStatType,
  Goal,
  Project,
  ProjectPhase,
} from "@/store/appState.types"

export type ProjectFormValues = {
  title: string
  goalId?: string
  description?: string
  showOnDashboard: boolean
  statType?: CharacterStatType
  phase: ProjectPhase
  targetDate?: string
}

type ProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialProject?: Project
  goals: Goal[]
  defaultGoalId?: string
  onSubmit: (values: ProjectFormValues) => void
}

function ProjectDialogFields({
  initialProject,
  goals,
  defaultGoalId,
  onSubmit,
  onOpenChange,
}: {
  initialProject?: Project
  goals: Goal[]
  defaultGoalId?: string
  onSubmit: (values: ProjectFormValues) => void
  onOpenChange: (open: boolean) => void
}) {
  const firstGoalId = goals[0]?.id
  const [goalId, setGoalId] = useState(() => {
    if (initialProject) {
      return isProjectUnassigned(initialProject, goals)
        ? ""
        : (initialProject.goalId ?? "")
    }
    return defaultGoalId ?? firstGoalId ?? ""
  })
  const [title, setTitle] = useState(initialProject?.title ?? "")
  const [description, setDescription] = useState(
    initialProject?.description ?? "",
  )
  const [showOnDashboard, setShowOnDashboard] = useState(
    initialProject ? initialProject.showOnDashboard !== false : true,
  )
  const [statTypeSelect, setStatTypeSelect] = useState(
    initialProject?.statType ?? "",
  )
  const [phase, setPhase] = useState<ProjectPhase>(
    initialProject?.phase ?? "active",
  )
  const [targetDate, setTargetDate] = useState(initialProject?.targetDate ?? "")

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onSubmit({
      title: t,
      goalId: goalId === "" ? "" : goalId,
      description: description.trim() || undefined,
      showOnDashboard,
      statType:
        statTypeSelect === ""
          ? undefined
          : (statTypeSelect as CharacterStatType),
      phase,
      targetDate: targetDate.trim() || undefined,
    })
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-5">
        <DialogTitle className="min-w-0 break-words text-lg text-slate-950">
          {initialProject ? "Редактировать проект" : "Новый проект"}
        </DialogTitle>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="grid gap-2">
              <Label htmlFor="project-title">Название</Label>
              <Input
                id="project-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border-slate-300"
                placeholder="Например, Подготовка к IELTS"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="project-desc">Описание</Label>
              <Textarea
                id="project-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="border-slate-300"
                rows={3}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="project-stat-type">Стат персонажа</Label>
              <select
                id="project-stat-type"
                value={statTypeSelect}
                onChange={(e) => setStatTypeSelect(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30"
              >
                <option value="">Не привязано</option>
                {CHARACTER_STATS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="project-phase">Фаза проекта</Label>
              <select
                id="project-phase"
                value={phase}
                onChange={(e) => setPhase(e.target.value as ProjectPhase)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30"
              >
                {PROJECT_PHASES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="project-goal">Цель</Label>
              <select
                id="project-goal"
                value={goalId}
                onChange={(e) => setGoalId(e.target.value)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30"
              >
                <option value="">Без цели</option>
                {goals.map((goal) => (
                  <option key={goal.id} value={goal.id}>
                    {goal.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="project-target-date">Целевая дата</Label>
              <Input
                id="project-target-date"
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="border-slate-300"
              />
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Checkbox
              id="project-show-dashboard"
              checked={showOnDashboard}
              onCheckedChange={(v) => setShowOnDashboard(v === true)}
              className="mt-0.5 border-slate-400 data-checked:border-blue-600 data-checked:bg-blue-600"
            />
            <div className="min-w-0 flex-1">
              <Label
                htmlFor="project-show-dashboard"
                className="cursor-pointer text-sm font-medium leading-snug text-slate-950"
              >
                Показывать плитку на Главной
              </Label>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200 bg-slate-50/90 px-4 pb-6 pt-4 sm:flex-row sm:justify-end sm:gap-2 sm:px-6 sm:pb-8">
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
          disabled={!title.trim()}
          onClick={handleSubmit}
        >
          Сохранить
        </Button>
      </DialogFooter>
    </>
  )
}

export function ProjectDialog({
  open,
  onOpenChange,
  initialProject,
  goals,
  defaultGoalId,
  onSubmit,
}: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[90vh] w-full max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-950 sm:max-w-xl"
      >
        {open ? (
          <ProjectDialogFields
            key={initialProject?.id ?? "__add__"}
            initialProject={initialProject}
            goals={goals}
            defaultGoalId={defaultGoalId}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
