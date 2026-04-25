import { useAppState } from "@/store/useAppState"
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react"

export type SaveStatusIndicatorProps = {
  collapsed?: boolean
}

function formatSavedAt(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso
  }
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
}

export function SaveStatusIndicator({ collapsed = false }: SaveStatusIndicatorProps) {
  const { cloudSaveState, clearCloudSaveError } = useAppState()
  const { status } = cloudSaveState

  if (collapsed) {
    if (status === "idle") {
      return null
    }

    if (status === "saving") {
      return (
        <div
          className="mx-auto flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-blue-600"
          title="Сохраняем..."
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
        </div>
      )
    }

    if (status === "saved") {
      const title = `Сохранено в ${formatSavedAt(cloudSaveState.savedAt)}`
      return (
        <div
          className="mx-auto flex size-9 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-600"
          title={title}
          role="status"
          aria-live="polite"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        </div>
      )
    }

    if (status === "error") {
      return (
        <button
          type="button"
          onClick={clearCloudSaveError}
          className="mx-auto flex size-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700"
          title={cloudSaveState.error}
          aria-label="Скрыть сообщение об ошибке"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        </button>
      )
    }

    return null
  }

  if (status === "idle") {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium">Готово</span>
        </div>
      </div>
    )
  }

  if (status === "saving") {
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600"
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-600" aria-hidden />
          <span className="font-medium">Сохраняем...</span>
        </div>
      </div>
    )
  }

  if (status === "saved") {
    const timeLabel = formatSavedAt(cloudSaveState.savedAt)
    return (
      <div
        className="rounded-xl border border-slate-200 bg-white/70 px-3 py-2 text-xs text-slate-600"
        title={`Сохранено в ${timeLabel}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden />
          <span className="font-medium">Сохранено</span>
        </div>
      </div>
    )
  }

  if (status === "error") {
    return (
      <div
        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
        role="alert"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <AlertTriangle
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-600"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="font-medium">Ошибка сохранения</p>
              <p className="mt-1 line-clamp-2 text-[11px] text-red-600">
                {cloudSaveState.error}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearCloudSaveError}
            className="shrink-0 rounded-md p-0.5 text-red-600 hover:bg-red-100/80"
            aria-label="Скрыть"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>
    )
  }

  return null
}
