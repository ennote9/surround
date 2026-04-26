type AnalyticsSummaryCardsProps = {
  totalProjects: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overallProgress: number
  averageHabitCompliance: number
}

export function AnalyticsSummaryCards({
  totalProjects,
  totalTasks,
  completedTasks,
  pendingTasks,
  overallProgress,
  averageHabitCompliance,
}: AnalyticsSummaryCardsProps) {
  const taskLine =
    totalTasks > 0 ? `${completedTasks} / ${totalTasks}` : "0 / 0"

  const items = [
    {
      label: "Общий прогресс",
      value: `${overallProgress}%`,
      hint: "По всем задачам",
    },
    {
      label: "Выполнено задач",
      value: taskLine,
      hint: pendingTasks > 0 ? `В ожидании: ${pendingTasks}` : "Все задачи закрыты",
    },
    {
      label: "Активных проектов",
      value: String(totalProjects),
      hint: "Всего в списке",
    },
    {
      label: "Средний compliance",
      value: `${averageHabitCompliance}%`,
      hint: "По привычкам",
    },
  ] as const

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <p className="break-words text-sm font-medium text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 min-w-0 break-words text-2xl font-semibold tracking-tight text-blue-600 tabular-nums">
            {item.value}
          </p>
          <p className="mt-1 text-pretty text-xs break-words text-slate-500">
            {item.hint}
          </p>
        </div>
      ))}
    </div>
  )
}
