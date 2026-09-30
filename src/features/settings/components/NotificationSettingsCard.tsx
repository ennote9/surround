import { useState } from "react"
import { Bell, BellOff, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  showBrowserNotification,
  type BrowserNotificationPermission,
} from "@/shared/lib/browserNotifications"

function permissionLabel(permission: BrowserNotificationPermission): string {
  if (permission === "granted") return "Разрешены"
  if (permission === "denied") return "Заблокированы браузером"
  if (permission === "unsupported") return "Не поддерживаются"
  return "Не включены"
}

export function NotificationSettingsCard({ compact = false }: { compact?: boolean }) {
  const [permission, setPermission] = useState<BrowserNotificationPermission>(
    getBrowserNotificationPermission(),
  )

  const requestPermission = async () => {
    const next = await requestBrowserNotificationPermission()
    setPermission(next)

    if (next === "granted") {
      toast.success("Системные уведомления включены")
    } else if (next === "denied") {
      toast.error("Уведомления заблокированы в настройках браузера")
    }
  }

  const sendTest = async () => {
    const shown = await showBrowserNotification({
      title: "Life Progress OS",
      body: "Тестовое уведомление работает.",
      tag: "life-progress-test-notification",
      url: "/settings",
    })
    if (!shown) {
      toast.info("Системное уведомление недоступно. Внутренние напоминания продолжат работать.")
    }
  }

  return (
    <div
      className={
        compact
          ? "rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          : "min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6"
      }
    >
      <div className="flex items-start gap-3">
        <span
          className={
            permission === "granted"
              ? "flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
              : "flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
          }
        >
          {permission === "denied" || permission === "unsupported" ? (
            <BellOff className="size-5" aria-hidden />
          ) : permission === "granted" ? (
            <CheckCircle2 className="size-5" aria-hidden />
          ) : (
            <Bell className="size-5" aria-hidden />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-slate-950 dark:text-slate-100">
            Системные уведомления
          </h3>
          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
            Статус: {permissionLabel(permission)}. Внутренние напоминания работают в приложении всегда; системные помогают, когда вкладка открыта в фоне.
          </p>
          {permission === "denied" ? (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Разрешение нужно вернуть в настройках сайта/браузера.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {permission === "default" ? (
          <Button type="button" onClick={() => void requestPermission()}>
            <Bell className="size-4" aria-hidden />
            Разрешить уведомления
          </Button>
        ) : null}
        {permission === "granted" ? (
          <Button type="button" variant="outline" onClick={() => void sendTest()}>
            Проверить уведомление
          </Button>
        ) : null}
      </div>

      <p className="mt-3 text-[11px] leading-4 text-slate-400">
        Полностью закрытое приложение пока не может само разбудить браузер. Фоновую доставку через push добавим отдельным этапом.
      </p>
    </div>
  )
}
