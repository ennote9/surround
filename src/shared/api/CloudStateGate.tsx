import { useCallback, useEffect, useState, type ReactNode } from "react"
import { useAuth } from "@/features/auth/useAuth"
import type { AppState } from "@/store/appState.types"
import { loadCloudAppState } from "./cloudStateAssembler"

type CloudStateGateProps = {
  children: (initialState: AppState, userId: string) => ReactNode
}

export function CloudStateGate({ children }: CloudStateGateProps) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [loading, setLoading] = useState(!!userId)
  const [error, setError] = useState<string | null>(null)
  const [appState, setAppState] = useState<AppState | null>(null)

  const loadStateForUser = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)

    const result = await loadCloudAppState(id)
    if (result.error) {
      setError(result.error)
      setAppState(null)
    } else {
      setAppState(result.data)
    }
    setLoading(false)
  }, [])

  // Зависит только от user.id (строка). Новый объект user от onAuthStateChange/фокуса вкладки
  // не трогает userId, эффект не перезапускается, полноэкранный cloud loader не всплывает.
  useEffect(() => {
    if (!userId) {
      return
    }
    const id = userId
    // Не вызывать setState внутри эффекта синхронно (react-hooks/set-state-in-effect).
    globalThis.queueMicrotask(() => {
      void loadStateForUser(id)
    })
  }, [userId, loadStateForUser])

  const handleRetry = useCallback(() => {
    if (!userId) {
      return
    }
    void loadStateForUser(userId)
  }, [loadStateForUser, userId])

  if (!userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Пользователь не авторизован</p>
          <p className="mt-2 text-xs text-slate-600">Нет id пользователя в сессии.</p>
        </div>
      </div>
    )
  }

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
            onClick={handleRetry}
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-700"
          >
            Повторить
          </button>
        </div>
      </div>
    )
  }

  if (!appState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">
            Не удалось инициализировать приложение
          </p>
          <p className="mt-2 text-xs text-slate-600">Нет данных состояния после загрузки.</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Сессия не найдена</p>
          <p className="mt-2 text-xs text-slate-600">Обновите страницу или войдите снова.</p>
        </div>
      </div>
    )
  }

  return <>{children(appState, user.id)}</>
}
