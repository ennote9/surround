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
import { PROJECT_PHASES } from "@/shared/lib/projectPhases"
import type {
  CharacterStatType,
  Project,
  ProjectPhase,
} from "@/store/appState.types"

export type ProjectFormValues = {
  title: string
  description?: string
  showOnDashboard: boolean
  statType?: CharacterStatType
  phase: ProjectPhase
}

type ProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialProject?: Project
  onSubmit: (values: ProjectFormValues) => void
}

function ProjectDialogFields({
  initialProject,
  onSubmit,
  onOpenChange,
}: {
  initialProject?: Project
  onSubmit: (values: ProjectFormValues) => void
  onOpenChange: (open: boolean) => void
}) {
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

  const handleSubmit = () => {
    const t = title.trim()
    if (!t) return
    onSubmit({
      title: t,
      description: description.trim() || undefined,
      showOnDashboard,
      statType:
        statTypeSelect === ""
          ? undefined
          : (statTypeSelect as CharacterStatType),
      phase,
    })
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader className="shrink-0 border-b border-slate-100 px-5 py-4">
        <DialogTitle className="text-lg text-slate-950">
          {initialProject ? "Редактировать проект" : "Новый проект"}
        </DialogTitle>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
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
              <p className="text-xs text-slate-500">
                Короткое название проекта. Оно будет отображаться в списке, на
                Главной и в аналитике.
              </p>
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
              <p className="text-xs text-slate-500">
                Кратко опишите роль проекта: зачем он нужен и какой результат должен
                дать.
              </p>
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
              <p className="text-xs text-slate-500">
                Выберите характеристику, которую прокачивает этот проект.
              </p>
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
              <p className="text-xs text-slate-500">
                Фаза помогает отличать текущие проекты от будущих и стратегических
                целей.
              </p>
            </div>
          </div>

          <div className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <Checkbox
              id="project-show-dashboard"
              checked={showOnDashboard}
              onCheckedChange={(v) => setShowOnDashboard(v === true)}
              className="mt-0.5 border-slate-400 data-checked:border-blue-600 data-checked:bg-blue-600"
              aria-describedby="project-show-dashboard-hint"
            />
            <div className="min-w-0 flex-1 space-y-1">
              <Label
                htmlFor="project-show-dashboard"
                className="cursor-pointer text-sm font-medium leading-snug text-slate-950"
              >
                Показывать плитку на Главной
              </Label>
              <p
                id="project-show-dashboard-hint"
                className="text-xs leading-relaxed text-slate-500"
              >
                Если выключено, проект останется во вкладке «Проекты», но исчезнет с
                Главной.
              </p>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="shrink-0 gap-2 border-t border-slate-200 bg-slate-50/90 px-5 py-4 sm:flex-row sm:justify-end sm:gap-2">
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

export function ProjectDialog({
  open,
  onOpenChange,
  initialProject,
  onSubmit,
}: ProjectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-950 sm:max-w-xl"
      >
        {open ? (
          <ProjectDialogFields
            key={initialProject?.id ?? "__add__"}
            initialProject={initialProject}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
