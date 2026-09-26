import { useEffect, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { ru } from "date-fns/locale"
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Habit } from "@/store/appState.types"
import { getHabitEntryStatus } from "@/shared/lib/habitEntries"
import { RoutineTodayPanel } from "./RoutineTodayPanel"
import { RoutineInsights } from "./RoutineInsights"
import {
  getHabitCompletionType,
  getHabitScheduleMode,
  getHabitTargetValue,
  getHabitTotalCompliance,
  getHabitUnit,
  getHabitWeeklyCompleted,
  getHabitWeeklyCompliance,
  getHabitWeeklyTarget,
  isHabitActiveOnDate,
  isHabitScheduledOnDate,
} from "@/store/selectors"

type MobileRoutineWorkspaceProps = {
  habits: Habit[]
  weekDates: string[]
  onPreviousWeek: () => void
  onCurrentWeek: () => void
  onNextWeek: () => void
  onAddHabit: () => void
  onToggleHabitDate: (habitId: string, date: string) => void
  onOpenHabitLog: (habitId: string, date: string) => void
  onEditHabit: (habitId: string) => void
  onDeleteHabit: (habitId: string) => void
}

const WEEKDAY_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"] as const

function toLocalISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function ProgressRing({ value }: { value: number }) {
  const size = 68
  const strokeWidth = 7
  const clamped = Math.max(0, Math.min(100, value))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - clamped / 100)

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      aria-label={`Прогресс недели ${clamped}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-white/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-white transition-[stroke-dashoffset] duration-500"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-white">
        {clamped}%
      </span>
    </div>
  )
}

function formatWeekRange(weekDates: string[]): string {
  if (weekDates.length === 0) return ""
  const first = parseISO(weekDates[0])
  const last = parseISO(weekDates[weekDates.length - 1])
  return `${format(first, "d MMM", { locale: ru })} — ${format(last, "d MMM", { locale: ru })}`
}

function formatHabitSchedule(habit: Habit): string {
  const mode = getHabitScheduleMode(habit)
  if (mode === "daily") return "Каждый день"
  if (mode === "specific-days") {
    const labels = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    return (habit.schedule?.daysOfWeek ?? [])
      .map((day) => labels[day - 1])
      .filter(Boolean)
      .join(" · ")
  }
  return `${habit.schedule?.targetPerWeek ?? 7}× в неделю`
}

function formatHabitTarget(habit: Habit): string {
  const type = getHabitCompletionType(habit)
  if (type === "check") return "Галочка"
  const target = getHabitTargetValue(habit)
  const unit = getHabitUnit(habit)
  return target ? `${target} ${unit}` : type === "duration" ? "Время" : "Количество"
}

function formatEntryValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    const compact = value / 1000
    return `${Number.isInteger(compact) ? compact : compact.toFixed(1)}k`
  }
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

export function MobileRoutineWorkspace({
  habits,
  weekDates,
  onPreviousWeek,
  onCurrentWeek,
  onNextWeek,
  onAddHabit,
  onToggleHabitDate,
  onOpenHabitLog,
  onEditHabit,
  onDeleteHabit,
}: MobileRoutineWorkspaceProps) {
  const todayISO = toLocalISO(new Date())
  const currentWeekStartISO = toLocalISO(
    new Date(
      new Date().setDate(
        new Date().getDate() - ((new Date().getDay() + 6) % 7),
      ),
    ),
  )
  const viewingCurrentWeek = weekDates[0] === currentWeekStartISO
  const initialSelectedDate = weekDates.includes(todayISO)
    ? todayISO
    : (weekDates[0] ?? todayISO)
  const [selectedDate, setSelectedDate] = useState(initialSelectedDate)

  useEffect(() => {
    if (!weekDates.includes(selectedDate)) {
      setSelectedDate(weekDates.includes(todayISO) ? todayISO : (weekDates[0] ?? todayISO))
    }
  }, [selectedDate, todayISO, weekDates])

  const weeklyStats = useMemo(() => {
    const possible = habits.reduce(
      (sum, habit) => sum + getHabitWeeklyTarget(habit, weekDates),
      0,
    )
    const completed = habits.reduce((sum, habit) => {
      const target = getHabitWeeklyTarget(habit, weekDates)
      const done = getHabitWeeklyCompleted(habit, weekDates)
      return sum + Math.min(done, target)
    }, 0)
    return {
      completed,
      possible,
      progress: possible === 0 ? 0 : Math.round((completed / possible) * 100),
    }
  }, [habits, weekDates])

  const todayHabits = habits.filter((habit) =>
    isHabitScheduledOnDate(habit, todayISO),
  )
  const todayDone = todayHabits.filter(
    (habit) => habit.dailyStatus[todayISO] === true,
  ).length

  const activeHabits = habits.filter(
    (habit) => !habit.settings?.period?.paused,
  )
  const averageTotalCompliance =
    activeHabits.length === 0
      ? 0
      : Math.round(
          activeHabits.reduce(
            (sum, habit) => sum + getHabitTotalCompliance(habit),
            0,
          ) / activeHabits.length,
        )

  return (
    <div className="space-y-6 md:hidden">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
            Регулярность
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Рутина
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {activeHabits.length} активных · сегодня {todayDone}/{todayHabits.length}
          </p>
        </div>
        <Button
          type="button"
          size="icon"
          className="size-11 shrink-0 rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20 hover:bg-blue-700"
          onClick={onAddHabit}
          aria-label="Добавить привычку"
        >
          <Plus className="size-5" aria-hidden />
        </Button>
      </header>

      {habits.length > 0 ? (
        <RoutineTodayPanel
          habits={habits}
          weekDates={weekDates}
          selectedDate={selectedDate}
          todayISO={todayISO}
          onSelectDate={setSelectedDate}
          onQuickToggle={onToggleHabitDate}
          onOpenLog={onOpenHabitLog}
        />
      ) : null}

      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-5 text-white shadow-lg shadow-blue-950/10 dark:from-blue-600 dark:via-indigo-700 dark:to-slate-900 dark:shadow-black/20">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-xs font-medium text-white/90 ring-1 ring-white/15">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatWeekRange(weekDates)}
            </div>
            <h2 className="mt-3 text-xl font-semibold tracking-tight">
              Ритм недели
            </h2>
            <p className="mt-1 text-sm leading-5 text-blue-100">
              {weeklyStats.completed} из {weeklyStats.possible} отметок выполнено
            </p>
          </div>
          <ProgressRing value={weeklyStats.progress} />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12">
            <p className="text-[10px] text-blue-100">Сегодня</p>
            <p className="mt-1 text-lg font-semibold">
              {todayDone}/{todayHabits.length}
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12">
            <p className="text-[10px] text-blue-100">Неделя</p>
            <p className="mt-1 text-lg font-semibold">
              {weeklyStats.progress}%
            </p>
          </div>
          <div className="rounded-2xl bg-white/10 p-3 ring-1 ring-white/12">
            <p className="text-[10px] text-blue-100">Общий</p>
            <p className="mt-1 text-lg font-semibold">
              {averageTotalCompliance}%
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={onPreviousWeek}
            aria-label="Предыдущая неделя"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Button>

          <button
            type="button"
            onClick={onCurrentWeek}
            className="min-w-0 flex-1 rounded-xl px-2 py-2 text-center hover:bg-slate-50 dark:hover:bg-slate-800/70"
          >
            <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-100">
              {formatWeekRange(weekDates)}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {viewingCurrentWeek ? "Текущая неделя" : "Нажми, чтобы вернуться к текущей"}
            </p>
          </button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-10 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            onClick={onNextWeek}
            aria-label="Следующая неделя"
          >
            <ChevronRight className="size-5" aria-hidden />
          </Button>
        </div>
      </section>

      {habits.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <RefreshCw className="mx-auto size-8 text-slate-300 dark:text-slate-600" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-slate-950 dark:text-slate-100">
            Привычек пока нет
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Добавь первую привычку и начни отмечать прогресс.
          </p>
          <Button
            type="button"
            className="mt-4 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
            onClick={onAddHabit}
          >
            <Plus className="mr-1 size-4" aria-hidden />
            Добавить привычку
          </Button>
        </div>
      ) : (
        <section className="space-y-3.5">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                Отметки
              </p>
              <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
                Привычки
              </h2>
            </div>
            <span className="text-xs text-slate-400">
              {weeklyStats.progress}% за неделю
            </span>
          </div>

          <div className="space-y-3">
            {habits.map((habit) => {
              const weeklyCompliance = getHabitWeeklyCompliance(habit, weekDates)
              const totalCompliance = getHabitTotalCompliance(habit)
              const targetPerWeek = getHabitWeeklyTarget(habit, weekDates)
              const completionType = getHabitCompletionType(habit)
              const paused = habit.settings?.period?.paused === true

              return (
                <article
                  key={habit.id}
                  className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-semibold leading-5 text-slate-950 dark:text-slate-100">
                        {habit.name}
                      </h3>
                      {habit.description ? (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                          {habit.description}
                        </p>
                      ) : null}
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-9 shrink-0 rounded-xl text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                          aria-label={`Действия с привычкой «${habit.name}»`}
                        >
                          <MoreHorizontal className="size-5" aria-hidden />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 p-1.5 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <DropdownMenuItem
                          className="gap-2 px-2.5 py-2"
                          onSelect={() => onOpenHabitLog(habit.id, selectedDate)}
                          disabled={selectedDate > todayISO}
                        >
                          <Check className="size-4" aria-hidden />
                          Отметка выбранного дня
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="gap-2 px-2.5 py-2"
                          onSelect={() => onEditHabit(habit.id)}
                        >
                          <Pencil className="size-4" aria-hidden />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          className="gap-2 px-2.5 py-2"
                          onSelect={() => onDeleteHabit(habit.id)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                      {formatHabitSchedule(habit)}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                      {formatHabitTarget(habit)}
                    </span>
                    {paused ? (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        На паузе
                      </span>
                    ) : habit.projectId ? (
                      <span className="truncate rounded-full bg-blue-50 px-2 py-1 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                        Привязана к проекту
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2 py-1 dark:bg-slate-800">
                        Глобальная
                      </span>
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-7 gap-1.5">
                    {weekDates.map((date, index) => {
                      const done = habit.dailyStatus[date] === true
                      const entry = habit.dailyEntries?.[date]
                      const entryStatus = getHabitEntryStatus(entry)
                      const isToday = date === todayISO
                      const active = isHabitActiveOnDate(habit, date)
                      const scheduled = isHabitScheduledOnDate(habit, date)
                      const enabled = active && scheduled && date <= todayISO

                      return (
                        <button
                          key={date}
                          type="button"
                          disabled={!enabled}
                          onClick={() => onToggleHabitDate(habit.id, date)}
                          className={
                            enabled
                              ? "flex min-w-0 flex-col items-center gap-1.5"
                              : "flex min-w-0 flex-col items-center gap-1.5 opacity-35"
                          }
                          aria-label={`${habit.name}, ${date}, ${enabled ? entryStatus : "не запланировано"}`}
                        >
                          <span
                            className={
                              isToday
                                ? "text-[10px] font-semibold text-blue-600 dark:text-blue-400"
                                : "text-[10px] font-medium text-slate-400"
                            }
                          >
                            {WEEKDAY_SHORT[index]}
                          </span>
                          <span
                            className={
                              entryStatus === "skipped"
                                ? "flex size-9 items-center justify-center rounded-xl bg-amber-50 text-xs font-semibold text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                                : entryStatus === "rescheduled"
                                  ? "flex size-9 items-center justify-center rounded-xl bg-violet-50 text-xs font-semibold text-violet-600 dark:bg-violet-500/10 dark:text-violet-300"
                                  : done
                                    ? "flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                                    : entryStatus === "partial"
                                      ? "flex size-9 items-center justify-center rounded-xl border border-amber-300 bg-amber-50 text-[10px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300"
                                      : isToday
                                        ? "flex size-9 items-center justify-center rounded-xl border border-blue-500 bg-blue-50 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                                        : "flex size-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                            }
                          >
                            {entryStatus === "skipped" ? (
                              "—"
                            ) : entryStatus === "rescheduled" ? (
                              "→"
                            ) : entry?.value != null && completionType !== "check" ? (
                              formatEntryValue(entry.value)
                            ) : done ? (
                              <Check className="size-4" aria-hidden />
                            ) : entryStatus === "partial" ? (
                              "½"
                            ) : (
                              format(parseISO(date), "d", { locale: ru })
                            )}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/55">
                      <p className="text-[10px] text-slate-400">Эта неделя</p>
                      <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
                        {targetPerWeek === 0 ? "Пауза" : `${weeklyCompliance}%`}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 dark:bg-slate-950/55">
                      <p className="text-[10px] text-slate-400">Общий ритм</p>
                      <p className="mt-1 text-base font-semibold text-slate-950 dark:text-slate-100">
                        {totalCompliance}%
                      </p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      )}

      {habits.length > 0 ? (
        <RoutineInsights habits={habits} todayISO={todayISO} />
      ) : null}
    </div>
  )
}
