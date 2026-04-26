import { useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
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
import {
  DEFAULT_PROJECT_GROUPS_COLLAPSE_MODE,
  normalizeProjectGroupsCollapseMode,
  PROJECT_GROUPS_COLLAPSE_MODE_OPTIONS,
  type ProjectGroupsCollapseMode,
} from "@/shared/lib/projectGroupsCollapse"
import {
  COLLAPSED_PROJECT_GROUPS_STORAGE_KEY,
  DASHBOARD_STAT_VISIBILITY_STORAGE_KEY,
  DASHBOARD_WIDGETS_STORAGE_KEY,
  PROJECT_GROUPS_COLLAPSE_MODE_STORAGE_KEY,
} from "@/shared/lib/storageKeys"

export default function SettingsPage() {
  const [widgetsStored, setWidgets] = useLocalStorage(
    DASHBOARD_WIDGETS_STORAGE_KEY,
    DEFAULT_DASHBOARD_WIDGETS,
  )

  const [statVisibilityStored, setStatVisibilityStored] = useLocalStorage(
    DASHBOARD_STAT_VISIBILITY_STORAGE_KEY,
    DEFAULT_DASHBOARD_STAT_VISIBILITY,
  )
  const [rawProjectGroupsCollapseMode, setProjectGroupsCollapseMode] =
    useLocalStorage<ProjectGroupsCollapseMode>(
      PROJECT_GROUPS_COLLAPSE_MODE_STORAGE_KEY,
      DEFAULT_PROJECT_GROUPS_COLLAPSE_MODE,
    )

  const widgets = useMemo(
    () => normalizeDashboardWidgets(widgetsStored),
    [widgetsStored],
  )

  const statVisibility = useMemo(
    () => normalizeDashboardStatVisibility(statVisibilityStored),
    [statVisibilityStored],
  )
  const projectGroupsCollapseMode = useMemo(
    () => normalizeProjectGroupsCollapseMode(rawProjectGroupsCollapseMode),
    [rawProjectGroupsCollapseMode],
  )
  const selectedProjectGroupsCollapseOption = useMemo(
    () =>
      PROJECT_GROUPS_COLLAPSE_MODE_OPTIONS.find(
        (option) => option.value === projectGroupsCollapseMode,
      ),
    [projectGroupsCollapseMode],
  )

  const handleResetDashboard = () => {
    setWidgets(DEFAULT_DASHBOARD_WIDGETS)
    setStatVisibilityStored(DEFAULT_DASHBOARD_STAT_VISIBILITY)
    toast.success("Настройки Главной сброшены")
  }

  const handleResetCollapsedGroups = () => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(COLLAPSED_PROJECT_GROUPS_STORAGE_KEY)
    }
    toast.success("Состояния групп сброшены")
  }

  return (
    <div className="mx-auto min-w-0 w-full max-w-5xl space-y-4 sm:space-y-6 lg:space-y-8">
      <div className="min-w-0">
        <h1 className="text-balance break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Настройки
        </h1>
        <p className="mt-2 max-w-full text-pretty text-sm text-slate-600 sm:mt-3 sm:text-base">
          Управление отображением, данными и поведением приложения.
        </p>
      </div>

      <section className="min-w-0 space-y-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-slate-950">Главная</h2>
          <p className="mt-1 text-pretty text-sm text-slate-600">
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

      <section className="min-w-0 space-y-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-slate-950">Проекты</h2>
          <p className="mt-1 text-pretty text-sm text-slate-600">
            Настройте поведение раскрытия групп задач при открытии проекта.
          </p>
        </div>

        <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="min-w-0 space-y-2">
            <h3 className="break-words text-base font-semibold text-slate-950">
              Группы внутри проекта
            </h3>
            <p className="text-pretty text-sm text-slate-600">
              Выберите, как открывать группы задач при переходе между проектами.
            </p>
          </div>

          <div className="mt-4 min-w-0 max-w-full space-y-2 sm:max-w-xl">
            <label
              htmlFor="project-groups-collapse-mode"
              className="text-sm font-medium text-slate-900"
            >
              Режим раскрытия групп
            </label>
            <select
              id="project-groups-collapse-mode"
              value={projectGroupsCollapseMode}
              onChange={(e) =>
                setProjectGroupsCollapseMode(
                  normalizeProjectGroupsCollapseMode(e.target.value),
                )
              }
              className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-xs outline-none focus-visible:border-blue-500 focus-visible:ring-2 focus-visible:ring-blue-500/30"
            >
              {PROJECT_GROUPS_COLLAPSE_MODE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {selectedProjectGroupsCollapseOption ? (
              <p className="text-pretty text-sm break-words text-slate-600">
                {selectedProjectGroupsCollapseOption.description}
              </p>
            ) : null}
          </div>

          {projectGroupsCollapseMode === "remember-per-project" ? (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <Button
                type="button"
                variant="outline"
                className="min-h-10 w-full border-slate-300 sm:w-auto sm:min-h-9"
                onClick={handleResetCollapsedGroups}
              >
                Сбросить состояния групп
              </Button>
              <p className="mt-2 text-pretty text-xs break-words text-slate-500">
                Очищает сохраненные раскрытые и свернутые группы для режима
                запоминания по проектам.
              </p>
            </div>
          ) : null}
        </div>
      </section>

      <section className="min-w-0 space-y-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-slate-950">
            Данные приложения
          </h2>
          <p className="mt-1 text-pretty text-sm text-slate-600">
            Экспортируйте резервную копию, импортируйте seed JSON или очистите
            текущее состояние.
          </p>
        </div>
        <DataManagementCard />
      </section>
    </div>
  )
}
