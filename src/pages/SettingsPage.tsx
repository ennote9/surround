import { useMemo } from "react"
import { toast } from "sonner"
import { DashboardSettingsCard } from "@/features/dashboard/components/DashboardSettingsCard"
import {
  DEFAULT_DASHBOARD_STAT_VISIBILITY,
  normalizeDashboardStatVisibility,
} from "@/features/dashboard/dashboardStatVisibility"
import {
  DEFAULT_DASHBOARD_WIDGETS,
  normalizeDashboardWidgets,
} from "@/features/dashboard/dashboardWidgets"
import { DataManagementCard } from "@/features/settings/components/DataManagementCard"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"

const DASHBOARD_WIDGETS_STORAGE_KEY = "canada-progress-os-dashboard-widgets"
const DASHBOARD_STAT_VISIBILITY_STORAGE_KEY =
  "canada-progress-os-dashboard-stat-visibility"

export default function SettingsPage() {
  const [widgetsStored, setWidgets] = useLocalStorage(
    DASHBOARD_WIDGETS_STORAGE_KEY,
    DEFAULT_DASHBOARD_WIDGETS,
  )

  const [statVisibilityStored, setStatVisibilityStored] = useLocalStorage(
    DASHBOARD_STAT_VISIBILITY_STORAGE_KEY,
    DEFAULT_DASHBOARD_STAT_VISIBILITY,
  )

  const widgets = useMemo(
    () => normalizeDashboardWidgets(widgetsStored),
    [widgetsStored],
  )

  const statVisibility = useMemo(
    () => normalizeDashboardStatVisibility(statVisibilityStored),
    [statVisibilityStored],
  )

  const handleResetDashboard = () => {
    setWidgets(DEFAULT_DASHBOARD_WIDGETS)
    setStatVisibilityStored(DEFAULT_DASHBOARD_STAT_VISIBILITY)
    toast.success("Настройки Главной сброшены")
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
          Настройки
        </h1>
        <p className="mt-3 text-slate-600">
          Управление отображением, данными и поведением приложения.
        </p>
      </div>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Главная</h2>
          <p className="mt-1 text-sm text-slate-600">
            Выберите, какие блоки и статы показывать на Главной.
          </p>
        </div>
        <DashboardSettingsCard
          widgets={widgets}
          statVisibility={statVisibility}
          onChangeWidgets={setWidgets}
          onChangeStatVisibility={setStatVisibilityStored}
          onReset={handleResetDashboard}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">
            Данные приложения
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Экспортируйте резервную копию, импортируйте seed JSON или очистите
            текущее состояние.
          </p>
        </div>
        <DataManagementCard />
      </section>
    </div>
  )
}
