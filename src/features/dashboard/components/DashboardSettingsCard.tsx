import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { CHARACTER_STATS } from "@/features/dashboard/characterStats"
import type { DashboardStatVisibilityConfig } from "@/features/dashboard/dashboardStatVisibility"
import type { DashboardWidgetConfig } from "@/features/dashboard/dashboardWidgets"
import { cn } from "@/lib/utils"

export type DashboardSettingsCardProps = {
  widgets: DashboardWidgetConfig[]
  statVisibility: DashboardStatVisibilityConfig[]
  onChangeWidgets: (widgets: DashboardWidgetConfig[]) => void
  onChangeStatVisibility: (items: DashboardStatVisibilityConfig[]) => void
  onReset: () => void
}

export function DashboardSettingsCard({
  widgets,
  statVisibility,
  onChangeWidgets,
  onChangeStatVisibility,
  onReset,
}: DashboardSettingsCardProps) {
  const toggleWidgetEnabled = (id: DashboardWidgetConfig["id"]) => {
    onChangeWidgets(
      widgets.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w)),
    )
  }

  const toggleStatEnabled = (id: DashboardStatVisibilityConfig["id"]) => {
    onChangeStatVisibility(
      statVisibility.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    )
  }

  return (
    <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 text-slate-950 shadow-sm sm:p-5">
      <div className="min-w-0 border-b border-slate-200 pb-4">
        <h3 className="break-words text-base font-semibold text-slate-950">
          Виджеты на Главной
        </h3>
        <p className="mt-1 text-pretty text-sm text-slate-600">
          Выберите, какие плитки отображать на странице.
        </p>
      </div>

      <ul className="mt-4 grid min-w-0 gap-3">
        {widgets.map((w) => (
          <li
            key={w.id}
            className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
          >
            <Checkbox
              id={`dashboard-settings-widget-${w.id}`}
              checked={w.enabled}
              onCheckedChange={() => toggleWidgetEnabled(w.id)}
              className="mt-0.5 border-slate-400 data-checked:border-blue-600 data-checked:bg-blue-600"
              aria-label={`Показывать: ${w.title}`}
            />
            <div className="min-w-0 flex-1">
              <label
                htmlFor={`dashboard-settings-widget-${w.id}`}
                className={cn(
                  "cursor-pointer text-sm font-medium break-words text-slate-950",
                )}
              >
                {w.title}
              </label>
              <p className="mt-1 text-pretty text-xs break-words text-slate-500">
                {w.description}
              </p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 min-w-0 space-y-2 border-t border-slate-200 pt-4">
        <h3 className="break-words text-sm font-semibold text-slate-950">
          Отображаемые статы
        </h3>
        <p className="text-pretty text-xs break-words text-slate-500">
          Выберите, какие статы персонажа показывать на Главной.
        </p>
        <ul className="mt-3 grid max-h-[min(360px,50vh)] min-w-0 grid-cols-1 gap-2 overflow-y-auto overscroll-contain pr-1 sm:grid-cols-2">
          {CHARACTER_STATS.map((stat) => {
            const row = statVisibility.find((v) => v.id === stat.id)
            const checked = row?.enabled ?? false
            return (
              <li
                key={stat.id}
                className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <Checkbox
                  id={`dashboard-settings-stat-${stat.id}`}
                  checked={checked}
                  onCheckedChange={() => toggleStatEnabled(stat.id)}
                  className="mt-0.5 shrink-0 border-slate-400 data-checked:border-blue-600 data-checked:bg-blue-600"
                  aria-label={`Показывать стат: ${stat.title}`}
                />
                <div className="min-w-0 flex-1">
                  <label
                    htmlFor={`dashboard-settings-stat-${stat.id}`}
                    className="cursor-pointer text-sm font-medium break-words text-slate-950"
                  >
                    {stat.title}{" "}
                    <span className="font-mono text-xs font-normal break-all text-slate-500">
                      ({stat.shortTitle})
                    </span>
                  </label>
                  <p className="mt-1 text-pretty text-xs break-words text-slate-500">
                    {stat.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-6 flex flex-col gap-2 border-t border-slate-200 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          className="min-h-10 w-full border-slate-200 bg-white text-slate-950 hover:bg-slate-50 sm:w-auto sm:min-h-9"
          onClick={onReset}
        >
          Сбросить всё
        </Button>
      </div>
    </div>
  )
}
