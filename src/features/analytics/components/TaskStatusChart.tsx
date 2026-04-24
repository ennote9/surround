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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-950">Статус задач</h2>
      {total === 0 ? (
        <p className="mt-6 text-sm text-slate-600">
          Нет задач для анализа
        </p>
      ) : (
        <div className="mt-4 h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={88}
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
                wrapperStyle={{ fontSize: "12px", color: "#475569" }}
                verticalAlign="bottom"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
