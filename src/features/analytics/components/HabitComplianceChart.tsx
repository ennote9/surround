import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import type { Habit } from "@/store/appState.types"
import { getHabitTotalCompliance } from "@/store/selectors"

type HabitComplianceChartProps = {
  habits: Habit[]
}

export function HabitComplianceChart({ habits }: HabitComplianceChartProps) {
  const data = habits.map((h) => ({
    name: h.name,
    compliance: getHabitTotalCompliance(h),
  }))

  return (
    <div className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="min-w-0 break-words text-lg font-semibold text-slate-950">
        Compliance привычек
      </h2>
      {data.length === 0 ? (
        <p className="mt-6 text-sm text-slate-600">Нет привычек для анализа</p>
      ) : (
        <div className="mt-4 min-h-0 w-full min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
          <div className="h-[220px] w-full min-w-[min(100%,280px)] sm:h-[280px] sm:min-w-0">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 4, left: 0, bottom: 52 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={52}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 12, fill: "#64748b" }}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="compliance" fill="#4a86e8" radius={[4, 4, 0, 0]} />
            </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
