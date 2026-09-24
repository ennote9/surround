import { useMemo, useState } from "react"
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Hash,
  Link2,
  PauseCircle,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"
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
import { CHARACTER_STATS } from "@/shared/lib/characterStats"
import type {
  CharacterStatType,
  Habit,
  HabitCompletionType,
  HabitScheduleMode,
  HabitSettings,
  HabitTimePreference,
  Project,
} from "@/store/appState.types"

export type HabitFormValues = {
  name: string
  description?: string
  projectId?: string
  schedule: NonNullable<Habit["schedule"]>
  settings: HabitSettings
}

type HabitDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialHabit?: Habit
  projects: Project[]
  onSubmit: (values: HabitFormValues) => void
}

const WEEKDAYS = [
  { value: 1, label: "Пн" },
  { value: 2, label: "Вт" },
  { value: 3, label: "Ср" },
  { value: 4, label: "Чт" },
  { value: 5, label: "Пт" },
  { value: 6, label: "Сб" },
  { value: 7, label: "Вс" },
] as const

const COMPLETION_TYPES: Array<{
  value: HabitCompletionType
  title: string
  description: string
  icon: typeof CheckCircle2
}> = [
  {
    value: "check",
    title: "Галочка",
    description: "Сделал / не сделал",
    icon: CheckCircle2,
  },
  {
    value: "duration",
    title: "Время",
    description: "Минуты выполнения",
    icon: Clock3,
  },
  {
    value: "quantity",
    title: "Количество",
    description: "Шаги, страницы и т. п.",
    icon: Hash,
  },
]

function clampTargetPerWeek(value: number) {
  return Math.max(1, Math.min(7, Math.round(value)))
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
  const initialType = initialHabit?.settings?.target?.type ?? "check"
  const initialMode = initialHabit?.schedule?.mode ?? "times-per-week"

  const [name, setName] = useState(initialHabit?.name ?? "")
  const [description, setDescription] = useState(initialHabit?.description ?? "")
  const [projectId, setProjectId] = useState(initialHabit?.projectId ?? "")
  const [completionType, setCompletionType] =
    useState<HabitCompletionType>(initialType)
  const [targetValue, setTargetValue] = useState(
    initialHabit?.settings?.target?.targetValue != null
      ? String(initialHabit.settings.target.targetValue)
      : initialType === "duration"
        ? "30"
        : "",
  )
  const [minimumValue, setMinimumValue] = useState(
    initialHabit?.settings?.target?.minimumValue != null
      ? String(initialHabit.settings.target.minimumValue)
      : initialType === "duration"
        ? "15"
        : "",
  )
  const [unit, setUnit] = useState(
    initialHabit?.settings?.target?.unit ??
      (initialType === "duration" ? "мин" : ""),
  )

  const [scheduleMode, setScheduleMode] =
    useState<HabitScheduleMode>(initialMode)
  const [targetPerWeek, setTargetPerWeek] = useState(
    initialHabit?.schedule?.targetPerWeek ?? 7,
  )
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(
    initialHabit?.schedule?.daysOfWeek ?? [1, 3, 5],
  )

  const [timePreference, setTimePreference] =
    useState<HabitTimePreference>(
      initialHabit?.settings?.timing?.preference ?? "any",
    )
  const [startTime, setStartTime] = useState(
    initialHabit?.settings?.timing?.startTime ?? "",
  )
  const [endTime, setEndTime] = useState(
    initialHabit?.settings?.timing?.endTime ?? "",
  )

  const [periodStart, setPeriodStart] = useState(
    initialHabit?.settings?.period?.startDate ?? "",
  )
  const [periodEnd, setPeriodEnd] = useState(
    initialHabit?.settings?.period?.endDate ?? "",
  )
  const [paused, setPaused] = useState(
    initialHabit?.settings?.period?.paused ?? false,
  )
  const [statType, setStatType] = useState<CharacterStatType | "">(
    initialHabit?.settings?.statType ?? "",
  )
  const [showOnDashboard, setShowOnDashboard] = useState(
    initialHabit?.settings?.showOnDashboard !== false,
  )
  const [error, setError] = useState<string | null>(null)

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projectId, projects],
  )

  const setType = (type: HabitCompletionType) => {
    if (type === completionType) return

    setCompletionType(type)
    setError(null)

    if (type === "duration") {
      setTargetValue("30")
      setMinimumValue("15")
      setUnit("мин")
      return
    }

    if (type === "quantity") {
      setTargetValue("")
      setMinimumValue("")
      setUnit("")
      return
    }

    setTargetValue("")
    setMinimumValue("")
    setUnit("")
  }

  const toggleWeekday = (day: number) => {
    setDaysOfWeek((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    )
    setError(null)
  }

  const handleSubmit = () => {
    const cleanName = name.trim()
    if (!cleanName) {
      setError("Введите название привычки.")
      return
    }

    if (scheduleMode === "specific-days" && daysOfWeek.length === 0) {
      setError("Выберите хотя бы один день недели.")
      return
    }

    let parsedTarget: number | undefined
    let parsedMinimum: number | undefined
    if (completionType !== "check") {
      parsedTarget = Number(targetValue)
      parsedMinimum = minimumValue.trim()
        ? Number(minimumValue)
        : parsedTarget

      if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) {
        setError("Укажите цель выполнения больше нуля.")
        return
      }
      if (!Number.isFinite(parsedMinimum) || parsedMinimum <= 0) {
        setError("Минимум выполнения должен быть больше нуля.")
        return
      }
      if (parsedMinimum > parsedTarget) {
        setError("Минимум не может быть больше основной цели.")
        return
      }
      if (completionType === "quantity" && !unit.trim()) {
        setError("Укажите единицу измерения: шаги, страницы, стаканы и т. п.")
        return
      }
    }

    if (periodStart && periodEnd && periodEnd < periodStart) {
      setError("Дата окончания не может быть раньше даты начала.")
      return
    }
    if (timePreference === "window" && startTime && endTime && endTime <= startTime) {
      setError("Конец временного окна должен быть позже начала.")
      return
    }

    const normalizedTargetPerWeek =
      scheduleMode === "daily"
        ? 7
        : scheduleMode === "specific-days"
          ? daysOfWeek.length
          : clampTargetPerWeek(targetPerWeek)

    onSubmit({
      name: cleanName,
      description: description.trim() || undefined,
      projectId: projectId || undefined,
      schedule: {
        mode: scheduleMode,
        targetPerWeek: normalizedTargetPerWeek,
        ...(scheduleMode === "specific-days"
          ? { daysOfWeek }
          : {}),
      },
      settings: {
        target: {
          type: completionType,
          ...(parsedTarget !== undefined ? { targetValue: parsedTarget } : {}),
          ...(parsedMinimum !== undefined ? { minimumValue: parsedMinimum } : {}),
          ...(completionType === "duration"
            ? { unit: "мин" }
            : completionType === "quantity"
              ? { unit: unit.trim() }
              : {}),
        },
        timing: {
          preference: timePreference,
          ...(timePreference === "window" && startTime ? { startTime } : {}),
          ...(timePreference === "window" && endTime ? { endTime } : {}),
        },
        period: {
          ...(periodStart ? { startDate: periodStart } : {}),
          ...(periodEnd ? { endDate: periodEnd } : {}),
          paused,
        },
        ...(statType ? { statType } : {}),
        showOnDashboard,
      },
    })
    onOpenChange(false)
  }

  return (
    <>
      <DialogHeader className="min-w-0 shrink-0 px-0 text-left">
        <DialogTitle className="break-words text-xl text-slate-950 dark:text-slate-100">
          {initialHabit ? "Редактировать привычку" : "Новая привычка"}
        </DialogTitle>
      </DialogHeader>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain py-2 pr-0.5">
        <div className="space-y-5">
          <section className="space-y-3">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="habit-name">Название</Label>
              <Input
                id="habit-name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError(null)
                }}
                className="min-h-11 min-w-0 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                placeholder="Например, Прогулка 30 минут"
              />
            </div>

            <div className="grid min-w-0 gap-2">
              <Label htmlFor="habit-desc">Описание</Label>
              <Textarea
                id="habit-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-w-0 border-slate-300 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                rows={3}
                placeholder="Зачем нужна привычка и что считается хорошим выполнением"
              />
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                Как считать выполнение
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {COMPLETION_TYPES.map(({ value, title, description: hint, icon: Icon }) => {
                const selected = completionType === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    className={
                      selected
                        ? "rounded-2xl border border-blue-500/50 bg-blue-50 p-3 text-left ring-1 ring-blue-500/15 dark:bg-blue-500/10"
                        : "rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left dark:border-slate-800 dark:bg-slate-950/55"
                    }
                  >
                    <Icon
                      className={
                        selected
                          ? "size-5 text-blue-600 dark:text-blue-400"
                          : "size-5 text-slate-400"
                      }
                      aria-hidden
                    />
                    <p className="mt-2 text-xs font-semibold text-slate-950 dark:text-slate-100">
                      {title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">
                      {hint}
                    </p>
                  </button>
                )
              })}
            </div>

            {completionType !== "check" ? (
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/55">
                <div className="grid gap-1.5">
                  <Label htmlFor="habit-minimum" className="text-xs">
                    Минимум
                  </Label>
                  <Input
                    id="habit-minimum"
                    type="number"
                    min="0"
                    step="any"
                    value={minimumValue}
                    onChange={(e) => setMinimumValue(e.target.value)}
                    className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="15"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="habit-target" className="text-xs">
                    Цель
                  </Label>
                  <Input
                    id="habit-target"
                    type="number"
                    min="0"
                    step="any"
                    value={targetValue}
                    onChange={(e) => setTargetValue(e.target.value)}
                    className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                    placeholder="30"
                  />
                </div>
                {completionType === "quantity" ? (
                  <div className="col-span-2 grid gap-1.5">
                    <Label htmlFor="habit-unit" className="text-xs">
                      Единица измерения
                    </Label>
                    <Input
                      id="habit-unit"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="h-10 border-slate-300 dark:border-slate-700 dark:bg-slate-900"
                      placeholder="шагов, страниц, стаканов..."
                    />
                  </div>
                ) : (
                  <p className="col-span-2 text-xs text-slate-500 dark:text-slate-400">
                    Значения сохраняются в минутах. День считается выполненным после достижения минимума.
                  </p>
                )}
              </div>
            ) : null}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                Расписание
              </h3>
            </div>

            <select
              value={scheduleMode}
              onChange={(e) => {
                setScheduleMode(e.target.value as HabitScheduleMode)
                setError(null)
              }}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="times-per-week">N раз в неделю</option>
              <option value="specific-days">Конкретные дни недели</option>
              <option value="daily">Каждый день</option>
            </select>

            {scheduleMode === "times-per-week" ? (
              <select
                value={targetPerWeek}
                onChange={(e) => setTargetPerWeek(Number(e.target.value))}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                {Array.from({ length: 7 }, (_, index) => index + 1).map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? "раз" : count < 5 ? "раза" : "раз"} в неделю
                  </option>
                ))}
              </select>
            ) : null}

            {scheduleMode === "specific-days" ? (
              <div className="grid grid-cols-7 gap-1.5">
                {WEEKDAYS.map((day) => {
                  const selected = daysOfWeek.includes(day.value)
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeekday(day.value)}
                      className={
                        selected
                          ? "flex h-10 items-center justify-center rounded-xl bg-blue-600 text-xs font-semibold text-white"
                          : "flex h-10 items-center justify-center rounded-xl bg-slate-100 text-xs font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }
                    >
                      {day.label}
                    </button>
                  )
                })}
              </div>
            ) : null}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                Предпочтительное время
              </h3>
            </div>

            <select
              value={timePreference}
              onChange={(e) => setTimePreference(e.target.value as HabitTimePreference)}
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="any">В любое время</option>
              <option value="morning">Утро</option>
              <option value="day">День</option>
              <option value="evening">Вечер</option>
              <option value="window">Своё временное окно</option>
            </select>

            {timePreference === "window" ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="habit-time-start" className="text-xs">С</Label>
                  <Input
                    id="habit-time-start"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="h-10 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="habit-time-end" className="text-xs">До</Label>
                  <Input
                    id="habit-time-end"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="h-10 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>
            ) : null}
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Link2 className="size-4 text-blue-600 dark:text-blue-400" aria-hidden />
              <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                Связь с системой
              </h3>
            </div>

            <div className="grid gap-2">
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Глобальная привычка</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>

              <select
                value={statType}
                onChange={(e) => setStatType(e.target.value as CharacterStatType | "")}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="">Стат не назначен</option>
                {CHARACTER_STATS.map((stat) => (
                  <option key={stat.id} value={stat.id}>
                    {stat.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedProject ? (
              <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                Привычка будет учитываться в контексте проекта «{selectedProject.title}».
              </p>
            ) : null}
          </section>

          <details className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
            <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 px-3.5 py-3 [&::-webkit-details-marker]:hidden">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <Sparkles className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  Дополнительные настройки
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Период, пауза и отображение
                </p>
              </div>
              <ChevronDown className="size-4 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
            </summary>

            <div className="space-y-4 border-t border-slate-100 p-3.5 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-1.5">
                  <Label htmlFor="habit-period-start" className="text-xs">
                    Начать с
                  </Label>
                  <Input
                    id="habit-period-start"
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="h-10 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="habit-period-end" className="text-xs">
                    Завершить
                  </Label>
                  <Input
                    id="habit-period-end"
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="h-10 dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/55">
                <Checkbox
                  checked={paused}
                  onCheckedChange={(checked) => setPaused(checked === true)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                    <PauseCircle className="size-4 text-slate-400" aria-hidden />
                    Поставить на паузу
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    Пауза исключает привычку из текущих расчётов, не удаляя историю.
                  </span>
                </span>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/55">
                <Checkbox
                  checked={showOnDashboard}
                  onCheckedChange={(checked) => setShowOnDashboard(checked === true)}
                />
                <span>
                  <span className="block text-sm font-medium text-slate-900 dark:text-slate-100">
                    Показывать на Главной
                  </span>
                  <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                    Учитывать привычку в компактных блоках Главной.
                  </span>
                </span>
              </label>
            </div>
          </details>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          ) : null}
        </div>
      </div>

      <DialogFooter className="mt-2 shrink-0 gap-2 border-t border-slate-200 pt-3 dark:border-slate-800 sm:mt-0 sm:gap-0">
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 sm:w-auto"
          onClick={() => onOpenChange(false)}
        >
          Отмена
        </Button>
        <Button
          type="button"
          className="min-h-11 w-full bg-blue-600 text-white hover:bg-blue-700 sm:w-auto"
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
        className="flex min-h-0 max-h-[92vh] max-w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-4 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 sm:max-w-lg"
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
