import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

type TaskStatusChartProps = {
  completed: number
  pending: number
}

const COLORS = ["#2563eb", "#cbd5e1"] as const

export function TaskStatusChart({ completed, pending }: TaskStatusChartProps) {
  const total = completed + pending
  const data = [
    { name: "Выполнено", value: completed },
    { name: "В ожидании", value: pending },
  ]

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="min-w-0 break-words text-lg font-semibold text-slate-950">
        Статус задач
      </h2>
      {total === 0 ? (
        <p className="mt-6 text-sm text-slate-600">Нет задач для анализа</p>
      ) : (
        <div className="mt-4 h-[240px] w-full min-w-0 max-w-full sm:h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="48%"
                innerRadius="42%"
                outerRadius="72%"
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={`slice-${i}`} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [
                  `${typeof value === "number" ? value : 0} задач`,
                  "",
                ]}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Legend
                wrapperStyle={{
                  fontSize: "12px",
                  color: "#475569",
                  width: "100%",
                  paddingLeft: 4,
                  paddingRight: 4,
                }}
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
