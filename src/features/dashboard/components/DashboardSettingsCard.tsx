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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm">
      <div className="border-b border-slate-200 pb-4">
        <h3 className="text-base font-semibold text-slate-950">
          Виджеты на Главной
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          Выберите, какие плитки отображать на странице.
        </p>
      </div>

      <ul className="mt-4 grid gap-3">
        {widgets.map((w) => (
          <li
            key={w.id}
            className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
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
                className={cn("cursor-pointer text-sm font-medium text-slate-950")}
              >
                {w.title}
              </label>
              <p className="mt-1 text-xs text-slate-500">{w.description}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-2 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-950">
          Отображаемые статы
        </h3>
        <p className="text-xs text-slate-500">
          Выберите, какие статы персонажа показывать на Главной.
        </p>
        <ul className="mt-3 grid max-h-[min(360px,50vh)] grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
          {CHARACTER_STATS.map((stat) => {
            const row = statVisibility.find((v) => v.id === stat.id)
            const checked = row?.enabled ?? false
            return (
              <li
                key={stat.id}
                className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3"
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
                    className="cursor-pointer text-sm font-medium text-slate-950"
                  >
                    {stat.title}{" "}
                    <span className="font-mono text-xs font-normal text-slate-500">
                      ({stat.shortTitle})
                    </span>
                  </label>
                  <p className="mt-1 text-xs text-slate-500">{stat.description}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-end gap-2 border-t border-slate-200 pt-4">
        <Button
          type="button"
          variant="outline"
          className="border-slate-200 bg-white text-slate-950 hover:bg-slate-50"
          onClick={onReset}
        >
          Сбросить всё
        </Button>
      </div>
    </div>
  )
}
