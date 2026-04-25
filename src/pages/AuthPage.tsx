import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/useAuth"

type AuthMode = "signIn" | "signUp"

function goToHome() {
  window.location.assign("/")
}

export default function AuthPage() {
  const {
    user,
    loading,
    error,
    isConfigured,
    signIn,
    signUp,
    signOut,
    clearError,
  } = useAuth()

  const [mode, setMode] = useState<AuthMode>("signIn")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async () => {
    clearError()
    setLocalError(null)
    setInfo(null)

    const cleanEmail = email.trim()
    const cleanPassword = password.trim()

    if (!cleanEmail || !cleanPassword) {
      setLocalError("Введите email и пароль.")
      return
    }

    if (mode === "signIn") {
      await signIn(cleanEmail, cleanPassword)
      goToHome()
      return
    }

    await signUp(cleanEmail, cleanPassword)
    setInfo(
      "Если включено подтверждение email, проверьте почту для завершения регистрации.",
    )
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
          Life Progress OS
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Войдите в аккаунт, чтобы синхронизировать цели, проекты и задачи между
          устройствами.
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Синхронизация данных будет подключена на следующих этапах. Сейчас
          проверяется вход в аккаунт.
        </p>

        {!isConfigured ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Supabase не настроен</p>
            <p className="mt-1">
              Заполните `VITE_SUPABASE_URL` и `VITE_SUPABASE_ANON_KEY` в
              `.env.local`. Пример есть в `.env.example`.
            </p>
          </div>
        ) : null}

        {user ? (
          <div className="mt-5 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-950">
              Вы уже вошли в аккаунт
            </p>
            <p className="text-xs text-slate-600">{user.email}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-slate-300"
                onClick={() => goToHome()}
              >
                Перейти в приложение
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-slate-300"
                onClick={() => void signOut()}
              >
                Выйти
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={mode === "signIn" ? "default" : "outline"}
                className={
                  mode === "signIn"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-300"
                }
                onClick={() => {
                  setMode("signIn")
                  setLocalError(null)
                  setInfo(null)
                  clearError()
                }}
              >
                Вход
              </Button>
              <Button
                type="button"
                variant={mode === "signUp" ? "default" : "outline"}
                className={
                  mode === "signUp"
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "border-slate-300"
                }
                onClick={() => {
                  setMode("signUp")
                  setLocalError(null)
                  setInfo(null)
                  clearError()
                }}
              >
                Регистрация
              </Button>
            </div>

            <div className="space-y-3">
              <div className="grid gap-2">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="border-slate-300"
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="auth-password">Пароль</Label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="border-slate-300"
                  autoComplete={
                    mode === "signIn" ? "current-password" : "new-password"
                  }
                />
              </div>
            </div>

            {localError ? (
              <p className="text-sm text-red-600">{localError}</p>
            ) : null}
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {info ? <p className="text-sm text-slate-600">{info}</p> : null}

            <Button
              type="button"
              className="w-full bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => void handleSubmit()}
              disabled={loading || !isConfigured}
            >
              {loading
                ? "Загрузка..."
                : mode === "signIn"
                  ? "Войти"
                  : "Создать аккаунт"}
            </Button>
          </div>
        )}

        <p className="mt-4 text-xs text-slate-500">
          Для возврата используйте{" "}
          <a
            href="/"
            className="underline underline-offset-2 hover:text-blue-600"
          >
            главную страницу
          </a>
          .
        </p>
      </div>
    </div>
  )
}
