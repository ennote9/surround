import { Check, Monitor, Moon, Sun } from "lucide-react"
import { DataManagementCard } from "@/features/settings/components/DataManagementCard"
import { NotificationSettingsCard } from "@/features/settings/components/NotificationSettingsCard"
import { MobileSettingsWorkspace } from "@/features/settings/components/MobileSettingsWorkspace"
import { useAppState } from "@/store/useAppState"

const THEME_OPTIONS = [
  {
    value: "light" as const,
    label: "Светлая",
    description: "Всегда использовать светлое оформление.",
    icon: Sun,
  },
  {
    value: "dark" as const,
    label: "Тёмная",
    description: "Всегда использовать тёмное оформление.",
    icon: Moon,
  },
  {
    value: "system" as const,
    label: "Как в системе",
    description: "Автоматически следовать теме устройства.",
    icon: Monitor,
  },
]

export default function SettingsPage() {
  const { state, dispatch } = useAppState()
  const currentTheme = state.settings.theme ?? "light"

  return (
    <div className="mx-auto min-w-0 w-full max-w-5xl">
      <MobileSettingsWorkspace
        currentTheme={currentTheme}
        onThemeChange={(theme) =>
          dispatch({
            type: "UPDATE_SETTINGS",
            payload: { patch: { theme } },
          })
        }
      />

      <div className="hidden space-y-6 md:block lg:space-y-8">
        <div className="min-w-0">
        <h1 className="text-balance break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          Настройки
        </h1>
        <p className="mt-2 max-w-full text-pretty text-sm text-slate-600 sm:mt-3 sm:text-base">
          Внешний вид, уведомления и данные приложения.
        </p>
      </div>

      <section className="min-w-0 space-y-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-slate-950 dark:text-slate-100">
            Внешний вид
          </h2>
          <p className="mt-1 text-pretty text-sm text-slate-600 dark:text-slate-400">
            Выберите тему интерфейса. Настройка сохраняется в аккаунте.
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-4 shadow-sm sm:p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {THEME_OPTIONS.map(({ value, label, description, icon: Icon }) => {
              const selected = currentTheme === value
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() =>
                    dispatch({
                      type: "UPDATE_SETTINGS",
                      payload: { patch: { theme: value } },
                    })
                  }
                  className={`relative min-w-0 rounded-2xl border p-4 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${
                    selected
                      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-200"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      selected
                        ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      <Icon className="size-5" aria-hidden />
                    </div>
                    {selected ? (
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Check className="size-4" aria-hidden />
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-4 font-semibold text-slate-950 dark:text-slate-100">{label}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-400">
                    {description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="min-w-0 space-y-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-slate-950 dark:text-slate-100">
            Напоминания
          </h2>
          <p className="mt-1 text-pretty text-sm text-slate-600 dark:text-slate-400">
            Разрешите системные уведомления для задач с дедлайном и контролем.
          </p>
        </div>
        <NotificationSettingsCard />
      </section>

      <section className="min-w-0 space-y-3">
        <div className="min-w-0">
          <h2 className="break-words text-lg font-semibold text-slate-950 dark:text-slate-100">
            Данные приложения
          </h2>
          <p className="mt-1 text-pretty text-sm text-slate-600 dark:text-slate-400">
            Экспортируйте резервную копию, импортируйте seed JSON или очистите
            текущее состояние.
          </p>
        </div>
        <DataManagementCard />
      </section>
      </div>
    </div>
  )
}
