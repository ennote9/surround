import type { ReactNode } from "react"
import AuthPage from "@/pages/AuthPage"
import { useAuth } from "./useAuth"

type ProtectedAppProps = {
  children: ReactNode
}

export function ProtectedApp({ children }: ProtectedAppProps) {
  const { loading, isAuthenticated, isConfigured } = useAuth()

  if (!isConfigured) {
    return <AuthPage />
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-900">Проверяем сессию...</p>
          <p className="mt-1 text-xs text-slate-500">Life Progress OS</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return <>{children}</>
}
