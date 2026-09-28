import { AlertTriangle, CheckCircle2, Gauge, Star } from "lucide-react"
import { getTodayISO } from "@/shared/lib/dates"
import { getTaskStatus } from "@/shared/lib/workManagement"
import type { Project } from "@/store/appState.types"

function dateOnly(value?: string): string | undefined {
  return value?.slice(0, 10)
}

function daysBetween(from: string, to: string): number {
  const fromTime = new Date(`${from}T12:00:00`).getTime()
  const toTime = new Date(`${to}T12:00:00`).getTime()
  return Math.floor((toTime - fromTime) / 86_400_000)
}

export function WorkloadAnalyticsCard({
  projects,
  wipLimit,
}: {
  projects: Project[]
  wipLimit: number
}) {
  const todayISO = getTodayISO()
  const activeProjects = projects.filter(
    (project) => project.phase === undefined || project.phase === "active",
  )
  const tasks = activeProjects.flatMap((project) =>
    project.groups.flatMap((group) => group.tasks),
  )
  const openTasks = tasks.filter((task) => getTaskStatus(task) !== "done")
  const inProgress = openTasks.filter(
    (task) => getTaskStatus(task) === "in_progress",
  )
  const stale = inProgress.filter((task) => {
    const since = dateOnly(task.statusChangedAt ?? task.updatedAt)
    return since ? daysBetween(since, todayISO) >= 3 : false
  })
  const controlDue = openTasks.filter((task) => {
    const status = getTaskStatus(task)
    return (
      (status === "waiting" || status === "delegated" || status === "control") &&
      task.followUpDate !== undefined &&
      task.followUpDate <= todayISO
    )
  })
  const overdue = openTasks.filter(
    (task) => task.deadline !== undefined && task.deadline < todayISO,
  )
  const deferred = openTasks.filter(
    (task) => task.deferredUntil !== undefined && task.deferredUntil > todayISO,
  )
  const withoutNextAction = activeProjects.filter((project) => {
    const projectTasks = project.groups.flatMap((group) => group.tasks)
    const open = projectTasks.filter((task) => getTaskStatus(task) !== "done")
    return open.length > 0 && !open.some((task) => task.isNextAction)
  })
  const overWip = Math.max(0, inProgress.length - wipLimit)
  const hasSignals =
    overWip > 0 ||
    stale.length > 0 ||
    controlDue.length > 0 ||
    overdue.length > 0 ||
    withoutNextAction.length > 0

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="flex items-start gap-3">
        <span
          className={
            hasSignals
              ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
              : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
          }
        >
          {hasSignals ? (
            <AlertTriangle className="size-5" aria-hidden />
          ) : (
            <CheckCircle2 className="size-5" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-slate-950 dark:text-slate-100">
            Рабочая нагрузка
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Операционные сигналы по текущему рабочему контуру.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
          <div className="flex items-center gap-1.5">
            <Gauge className="size-3.5 text-slate-400" aria-hidden />
            <p className="text-lg font-semibold text-slate-950 dark:text-white">
              {inProgress.length}/{wipLimit}
            </p>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">WIP</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
          <p className="text-lg font-semibold text-slate-950 dark:text-white">
            {stale.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">зависли 3+ дня</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
          <p className="text-lg font-semibold text-slate-950 dark:text-white">
            {controlDue.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">контроль наступил</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
          <p className="text-lg font-semibold text-slate-950 dark:text-white">
            {overdue.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">просрочено</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
          <div className="flex items-center gap-1.5">
            <Star className="size-3.5 text-slate-400" aria-hidden />
            <p className="text-lg font-semibold text-slate-950 dark:text-white">
              {withoutNextAction.length}
            </p>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">без след. шага</p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/60">
          <p className="text-lg font-semibold text-slate-950 dark:text-white">
            {deferred.length}
          </p>
          <p className="mt-1 text-[10px] text-slate-500">отложено</p>
        </div>
      </div>

      {overWip > 0 ? (
        <p className="mt-3 text-xs font-medium text-amber-700 dark:text-amber-300">
          WIP превышен на {overWip}: текущих задач в работе больше установленного лимита.
        </p>
      ) : null}
    </section>
  )
}
