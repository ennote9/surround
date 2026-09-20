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
    isPasswordRecovery,
    isConfigured,
    signIn,
    signUp,
    signOut,
    sendPasswordResetEmail,
    updatePassword,
    clearError,
  } = useAuth()

  const [mode, setMode] = useState<AuthMode>("signIn")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [recoveryPassword, setRecoveryPassword] = useState("")
  const [recoveryPasswordConfirm, setRecoveryPasswordConfirm] = useState("")
  const [localError, setLocalError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const handleSubmit = async () => {
    clearError()
    setLocalError(null)
    setInfo(null)

    const cleanEmail = email.trim()
    const cleanPassword = password

    if (!cleanEmail || !cleanPassword) {
      setLocalError("Введите email и пароль.")
      return
    }

    if (mode === "signIn") {
      const result = await signIn(cleanEmail, cleanPassword)
      if (!result.error) {
        goToHome()
      }
      return
    }

    const result = await signUp(cleanEmail, cleanPassword)
    if (!result.error) {
      setInfo(
        "Если включено подтверждение email, проверьте почту для завершения регистрации.",
      )
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full min-w-0 max-w-xl items-center overflow-x-hidden px-4 py-6 sm:px-0 sm:py-8">
      <div className="min-w-0 w-full max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h1 className="text-balance break-words text-xl font-semibold tracking-tight text-slate-950 sm:text-2xl">
          Life Progress OS
        </h1>
        {user ? (
          <p className="mt-2 text-pretty text-sm text-slate-600">
            Это страница входа и регистрации (шлюз). Вы уже авторизованы — ниже
            быстрые переходы в приложение или в профиль.
          </p>
        ) : (
          <>
            <p className="mt-2 text-pretty text-sm text-slate-600">
              Войдите в аккаунт, чтобы синхронизировать цели, проекты и задачи между
              устройствами.
            </p>
            <p className="mt-1 text-pretty text-xs text-slate-500">
              Данные синхронизируются через защищённое облачное хранилище Supabase.
            </p>
          </>
        )}

        {!isConfigured ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-medium">Supabase не настроен</p>
            <p className="mt-1 text-pretty break-words">
              Заполните{" "}
              <code className="break-all rounded bg-amber-100/80 px-1 py-0.5 text-xs">
                VITE_SUPABASE_URL
              </code>{" "}
              и{" "}
              <code className="break-all rounded bg-amber-100/80 px-1 py-0.5 text-xs">
                VITE_SUPABASE_ANON_KEY
              </code>{" "}
              в{" "}
              <code className="break-all rounded bg-amber-100/80 px-1 py-0.5 text-xs">
                .env.local
              </code>
              . Пример есть в{" "}
              <code className="break-all rounded bg-amber-100/80 px-1 py-0.5 text-xs">
                .env.example
              </code>
              .
            </p>
          </div>
        ) : null}

        {user && isPasswordRecovery ? (
          <div
            className="mt-5 min-w-0 space-y-4 rounded-xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5"
            role="region"
            aria-label="Восстановление пароля"
          >
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-950 sm:text-lg">
                Задайте новый пароль
              </h2>
              <p className="text-pretty text-sm text-slate-600">
                Ссылка восстановления подтверждена. Введите новый пароль для аккаунта.
              </p>
            </div>
            <div className="grid gap-3">
              <div className="grid gap-2">
                <Label htmlFor="recovery-password">Новый пароль</Label>
                <Input
                  id="recovery-password"
                  type="password"
                  value={recoveryPassword}
                  onChange={(event) => setRecoveryPassword(event.target.value)}
                  autoComplete="new-password"
                  className="min-h-10 border-slate-300 bg-white"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="recovery-password-confirm">Повторите пароль</Label>
                <Input
                  id="recovery-password-confirm"
                  type="password"
                  value={recoveryPasswordConfirm}
                  onChange={(event) =>
                    setRecoveryPasswordConfirm(event.target.value)
                  }
                  autoComplete="new-password"
                  className="min-h-10 border-slate-300 bg-white"
                />
              </div>
            </div>
            {localError ? (
              <p className="text-pretty text-sm break-words text-red-600">
                {localError}
              </p>
            ) : null}
            {info ? (
              <p className="text-pretty text-sm break-words text-slate-600">{info}</p>
            ) : null}
            <Button
              type="button"
              className="min-h-11 w-full bg-blue-600 text-white hover:bg-blue-700 sm:min-h-10"
              onClick={() => {
                void (async () => {
                  setLocalError(null)
                  setInfo(null)
                  if (recoveryPassword.length < 6) {
                    setLocalError("Пароль должен содержать не менее 6 символов.")
                    return
                  }
                  if (recoveryPassword !== recoveryPasswordConfirm) {
                    setLocalError("Пароли не совпадают.")
                    return
                  }
                  const result = await updatePassword(recoveryPassword)
                  if (result.error) {
                    setLocalError(result.error)
                    return
                  }
                  setInfo("Пароль изменён. Теперь можно продолжить работу.")
                  setRecoveryPassword("")
                  setRecoveryPasswordConfirm("")
                })()
              }}
            >
              Сохранить новый пароль
            </Button>
          </div>
        ) : user ? (
          <div
            className="mt-5 min-w-0 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5"
            role="region"
            aria-label="Состояние входа"
          >
            <div className="min-w-0 space-y-2">
              <h2 className="text-base font-semibold tracking-tight text-slate-950 sm:text-lg">
                Вы уже вошли в аккаунт
              </h2>
              <p className="break-all text-sm text-slate-700">
                {user.email?.trim() ? user.email : "Не указан"}
              </p>
              <p className="text-pretty text-sm text-slate-600">
                Управлять профилем и безопасностью можно в разделе профиля.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full border-slate-300 sm:w-auto sm:min-h-10"
                asChild
              >
                <a href="/profile">Перейти в профиль</a>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full border-slate-300 sm:w-auto sm:min-h-10"
                asChild
              >
                <a href="/">Перейти в приложение</a>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-11 w-full border-red-200 text-red-800 hover:bg-red-50 sm:w-auto sm:min-h-10"
                onClick={() => void signOut()}
              >
                Выйти
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div className="grid w-full grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "signIn" ? "default" : "outline"}
                className={
                  mode === "signIn"
                    ? "min-h-10 bg-blue-600 text-white hover:bg-blue-700"
                    : "min-h-10 border-slate-300"
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
                    ? "min-h-10 bg-blue-600 text-white hover:bg-blue-700"
                    : "min-h-10 border-slate-300"
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

            <div className="min-w-0 space-y-3">
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="min-h-10 min-w-0 w-full max-w-full border-slate-300"
                  autoComplete="email"
                />
              </div>
              <div className="grid min-w-0 gap-2">
                <Label htmlFor="auth-password">Пароль</Label>
                <Input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="min-h-10 min-w-0 w-full max-w-full border-slate-300"
                  autoComplete={
                    mode === "signIn" ? "current-password" : "new-password"
                  }
                />
              </div>
            </div>

            {localError ? (
              <p className="text-pretty text-sm break-words text-red-600">
                {localError}
              </p>
            ) : null}
            {error ? (
              <p className="text-pretty text-sm break-words text-red-600">{error}</p>
            ) : null}
            {info ? (
              <p className="text-pretty text-sm break-words text-slate-600">{info}</p>
            ) : null}

            {mode === "signIn" ? (
              <button
                type="button"
                className="w-full text-center text-sm text-blue-600 underline-offset-2 hover:underline"
                onClick={() => {
                  void (async () => {
                    clearError()
                    setLocalError(null)
                    setInfo(null)
                    const result = await sendPasswordResetEmail(email)
                    if (result.error) {
                      setLocalError(result.error)
                    } else {
                      setInfo("Письмо для сброса пароля отправлено. Проверьте почту.")
                    }
                  })()
                }}
              >
                Забыли пароль?
              </button>
            ) : null}

            <Button
              type="button"
              className="min-h-11 w-full bg-blue-600 text-white hover:bg-blue-700 sm:min-h-10"
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

        <p className="mt-4 text-pretty text-xs text-slate-500">
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
