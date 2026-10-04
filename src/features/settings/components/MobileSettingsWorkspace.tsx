import { Check, Monitor, Moon, Sun } from "lucide-react"
import { DataManagementCard } from "@/features/settings/components/DataManagementCard"
import { NotificationSettingsCard } from "@/features/settings/components/NotificationSettingsCard"

type ThemeValue = "light" | "dark" | "system"

type MobileSettingsWorkspaceProps = {
  currentTheme: ThemeValue
  onThemeChange: (theme: ThemeValue) => void
}

const THEME_OPTIONS = [
  { value: "light" as const, label: "Светлая", icon: Sun },
  { value: "dark" as const, label: "Тёмная", icon: Moon },
  { value: "system" as const, label: "Система", icon: Monitor },
]

export function MobileSettingsWorkspace({
  currentTheme,
  onThemeChange,
}: MobileSettingsWorkspaceProps) {
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
          Внешний вид, уведомления и данные приложения.
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
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
            Уведомления
          </p>
          <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-slate-950 dark:text-white">
            Напоминания
          </h2>
        </div>

        <NotificationSettingsCard compact />
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
