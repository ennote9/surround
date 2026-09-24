import {
  Check,
  ChevronDown,
  LayoutDashboard,
  Monitor,
  Moon,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Sun,
} from "lucide-react"
import { CHARACTER_STATS } from "@/features/dashboard/characterStats"
import type { DashboardStatVisibilityConfig } from "@/features/dashboard/dashboardStatVisibility"
import type { DashboardWidgetConfig } from "@/features/dashboard/dashboardWidgets"
import { CharacterStatIcon } from "@/shared/components/CharacterStatIcon"
import type { ProjectGroupsCollapseMode } from "@/shared/lib/projectGroupsCollapse"
import {
  PROJECT_GROUPS_COLLAPSE_MODE_OPTIONS,
} from "@/shared/lib/projectGroupsCollapse"
import { DataManagementCard } from "@/features/settings/components/DataManagementCard"

type ThemeValue = "light" | "dark" | "system"

type MobileSettingsWorkspaceProps = {
  currentTheme: ThemeValue
  widgets: DashboardWidgetConfig[]
  statVisibility: DashboardStatVisibilityConfig[]
  projectGroupsCollapseMode: ProjectGroupsCollapseMode
  onThemeChange: (theme: ThemeValue) => void
  onChangeWidgets: (widgets: DashboardWidgetConfig[]) => void
  onChangeStatVisibility: (items: DashboardStatVisibilityConfig[]) => void
  onChangeProjectGroupsCollapseMode: (mode: ProjectGroupsCollapseMode) => void
  onResetDashboard: () => void
  onResetCollapsedGroups: () => void
}

const THEME_OPTIONS = [
  { value: "light" as const, label: "Светлая", icon: Sun },
  { value: "dark" as const, label: "Тёмная", icon: Moon },
  { value: "system" as const, label: "Система", icon: Monitor },
]

function Toggle({
  checked,
  onClick,
  label,
}: {
  checked: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={
        checked
          ? "relative h-7 w-12 shrink-0 rounded-full bg-blue-600 p-0.5 transition-colors"
          : "relative h-7 w-12 shrink-0 rounded-full bg-slate-200 p-0.5 transition-colors dark:bg-slate-700"
      }
    >
      <span
        className={
          checked
            ? "block size-6 translate-x-5 rounded-full bg-white shadow-sm transition-transform"
            : "block size-6 translate-x-0 rounded-full bg-white shadow-sm transition-transform"
        }
      />
    </button>
  )
}

export function MobileSettingsWorkspace({
  currentTheme,
  widgets,
  statVisibility,
  projectGroupsCollapseMode,
  onThemeChange,
  onChangeWidgets,
  onChangeStatVisibility,
  onChangeProjectGroupsCollapseMode,
  onResetDashboard,
  onResetCollapsedGroups,
}: MobileSettingsWorkspaceProps) {
  const enabledWidgets = widgets.filter((item) => item.enabled).length
  const enabledStats = statVisibility.filter((item) => item.enabled).length

  const toggleWidget = (id: DashboardWidgetConfig["id"]) => {
    onChangeWidgets(
      widgets.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    )
  }

  const toggleStat = (id: DashboardStatVisibilityConfig["id"]) => {
    onChangeStatVisibility(
      statVisibility.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item,
      ),
    )
  }

  const selectedCollapse =
    PROJECT_GROUPS_COLLAPSE_MODE_OPTIONS.find(
      (option) => option.value === projectGroupsCollapseMode,
    ) ?? PROJECT_GROUPS_COLLAPSE_MODE_OPTIONS[0]

  return (
    <div className="space-y-6 md:hidden">
      <header>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
          Приложение
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">
          Настройки
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Интерфейс, Главная, проекты и данные
        </p>
      </header>

      <section className="space-y-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Интерфейс
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Внешний вид
            </h2>
          </div>
          <span className="text-xs text-slate-400">сохраняется в аккаунте</span>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => {
              const selected = currentTheme === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => onThemeChange(value)}
                  className={
                    selected
                      ? "relative flex min-h-24 flex-col items-center justify-center rounded-2xl border border-blue-500/50 bg-blue-50 px-2 py-3 text-blue-700 ring-1 ring-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300"
                      : "relative flex min-h-24 flex-col items-center justify-center rounded-2xl border border-transparent bg-slate-50 px-2 py-3 text-slate-600 dark:bg-slate-950/55 dark:text-slate-300"
                  }
                >
                  <span
                    className={
                      selected
                        ? "flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white"
                        : "flex size-9 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300"
                    }
                  >
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="mt-2 text-xs font-semibold">{label}</span>
                  {selected ? (
                    <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-blue-600 text-white">
                      <Check className="size-3" aria-hidden />
                    </span>
                  ) : null}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="space-y-3.5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
              Персонализация
            </p>
            <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
              Главная
            </h2>
          </div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
            {enabledWidgets}/{widgets.length} блоков
          </span>
        </div>

        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {widgets.map((widget, index) => (
            <div
              key={widget.id}
              className={
                index === widgets.length - 1
                  ? "flex min-h-16 items-center gap-3 px-4 py-3.5"
                  : "flex min-h-16 items-center gap-3 border-b border-slate-100 px-4 py-3.5 dark:border-slate-800"
              }
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
                {widget.id === "projects" ? (
                  <LayoutDashboard className="size-5" aria-hidden />
                ) : widget.id === "metrics" ? (
                  <Sparkles className="size-5" aria-hidden />
                ) : (
                  <SlidersHorizontal className="size-5" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  {widget.title}
                </p>
                <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                  {widget.description}
                </p>
              </div>
              <Toggle
                checked={widget.enabled}
                onClick={() => toggleWidget(widget.id)}
                label={`Показывать ${widget.title}`}
              />
            </div>
          ))}

          <details className="group border-t border-slate-100 dark:border-slate-800">
            <summary className="flex min-h-16 cursor-pointer list-none items-center gap-3 px-4 py-3.5 [&::-webkit-details-marker]:hidden">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Sparkles className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                  Статы персонажа
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Показывается {enabledStats} из {statVisibility.length}
                </p>
              </div>
              <ChevronDown className="size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden />
            </summary>

            <div className="border-t border-slate-100 px-3 pb-3 pt-3 dark:border-slate-800">
              <div className="grid grid-cols-2 gap-2">
                {CHARACTER_STATS.map((stat) => {
                  const enabled =
                    statVisibility.find((item) => item.id === stat.id)?.enabled ??
                    false
                  return (
                    <button
                      key={stat.id}
                      type="button"
                      onClick={() => toggleStat(stat.id)}
                      className={
                        enabled
                          ? "flex min-w-0 items-center gap-2 rounded-2xl border border-blue-500/40 bg-blue-50 p-2.5 text-left dark:bg-blue-500/10"
                          : "flex min-w-0 items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 text-left dark:border-slate-800 dark:bg-slate-950/55"
                      }
                    >
                      <span
                        className={
                          enabled
                            ? "flex size-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"
                            : "flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }
                      >
                        <CharacterStatIcon statType={stat.id} className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {stat.title}
                      </span>
                      {enabled ? (
                        <Check className="size-3.5 shrink-0 text-blue-600 dark:text-blue-400" aria-hidden />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          </details>
        </div>

        <button
          type="button"
          onClick={onResetDashboard}
          className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RotateCcw className="size-4" aria-hidden />
          Сбросить Главную
        </button>
      </section>

      <section className="space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Поведение
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Проекты
          </h2>
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <label
            htmlFor="mobile-project-groups-collapse-mode"
            className="text-sm font-semibold text-slate-950 dark:text-slate-100"
          >
            Группы задач
          </label>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Как группы будут выглядеть при открытии проекта.
          </p>

          <select
            id="mobile-project-groups-collapse-mode"
            value={projectGroupsCollapseMode}
            onChange={(event) =>
              onChangeProjectGroupsCollapseMode(
                event.target.value as ProjectGroupsCollapseMode,
              )
            }
            className="mt-3 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {PROJECT_GROUPS_COLLAPSE_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs leading-5 text-slate-500 dark:bg-slate-950/55 dark:text-slate-400">
            {selectedCollapse.description}
          </p>

          {projectGroupsCollapseMode === "remember-per-project" ? (
            <button
              type="button"
              onClick={onResetCollapsedGroups}
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 dark:border-slate-700 dark:text-slate-300"
            >
              <RotateCcw className="size-4" aria-hidden />
              Сбросить состояния групп
            </button>
          ) : null}
        </div>
      </section>

      <section className="space-y-3.5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Хранилище
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Данные
          </h2>
        </div>

        <DataManagementCard compact />
      </section>
    </div>
  )
}
