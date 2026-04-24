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
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-blue-600">
            {item.value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{item.hint}</p>
        </div>
      ))}
    </div>
  )
}
