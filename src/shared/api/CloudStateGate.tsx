import { useCallback, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "@/features/auth/useAuth"
import type { AppState } from "@/store/appState.types"
import { loadCloudAppState } from "./cloudStateAssembler"

type CloudStateGateProps = {
  children: (initialState: AppState, userId: string) => ReactNode
}

export function CloudStateGate({ children }: CloudStateGateProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appState, setAppState] = useState<AppState | null>(null)

  const loadState = useCallback(async () => {
    if (!user) {
      setError("Пользователь не авторизован.")
      setLoading(false)
      setAppState(null)
      return
    }

    setLoading(true)
    setError(null)

    const result = await loadCloudAppState(user.id)
    if (result.error) {
      setError(result.error)
      setAppState(null)
    } else {
      setAppState(result.data)
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadState()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [loadState])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-900">Загружаем данные...</p>
          <p className="mt-1 text-xs text-slate-500">Life Progress OS</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Не удалось загрузить данные
          </p>
          <p className="mt-2 text-xs text-slate-600">{error}</p>
          <button
            type="button"
            onClick={() => {
              void loadState()
            }}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700"
          >
            Повторить
          </button>
        </div>
      </div>
    )
  }

  if (!appState) {
    return null
  }

  if (!user) {
    return null
  }

  return <>{children(appState, user.id)}</>
}
