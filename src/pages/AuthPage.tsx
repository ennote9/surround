import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/useAuth"

type AuthMode = "signIn" | "signUp"

function goToHome() {
  window.location.assign("/")
}

const authInputClassName =
  "h-12 min-w-0 w-full rounded-lg border-0 bg-transparent px-3 text-[#252832] caret-[#4264a6] shadow-none placeholder:text-[#878b94] focus-visible:ring-0 dark:bg-transparent"

const authFieldClassName =
  "grid min-w-0 grid-cols-[88px_minmax(0,1fr)] items-center gap-2 rounded-xl border border-[#dfe2e5]/70 bg-white/75 pl-4 pr-1 transition-[border-color,box-shadow] focus-within:border-[#6d88b4] focus-within:ring-2 focus-within:ring-[#6d88b4]/20"

const authButtonClassName =
  "h-12 min-w-[128px] max-w-full rounded-xl bg-[#2858c9] px-6 font-medium text-[#ffffff] shadow-none transition-colors hover:bg-[#204ab0] [a]:hover:bg-[#204ab0] focus-visible:border-blue-500 focus-visible:ring-blue-500/25"

const authLabelClassName = "text-xs leading-4 font-normal text-[#646871]"

const authTextActionClassName =
  "inline-flex min-h-11 items-center rounded-md text-sm text-[#4264a6] underline-offset-4 transition-colors hover:text-[#25498b] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"

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
    <main className="flex min-h-dvh w-full min-w-0 items-center justify-center bg-[#e7eaee] md:px-6 md:py-6 lg:px-8 lg:py-8">
      <section
        className="mx-auto grid min-h-dvh w-full min-w-0 overflow-hidden bg-[#e7eaee] md:min-h-[680px] md:max-w-[1180px] md:grid-cols-[minmax(0,44fr)_minmax(0,56fr)] md:rounded-[32px] md:border md:border-black/5 md:shadow-[0_24px_70px_rgba(15,23,42,0.12)] lg:h-[calc(100dvh-64px)] lg:max-h-[740px]"
        aria-label="Авторизация"
      >
        <div className="flex min-w-0 flex-col bg-white/90 px-6 py-8 text-[#252832] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6),inset_0_1px_1px_rgba(255,255,255,0.8),inset_0_-12px_32px_rgba(30,41,59,0.025)] backdrop-blur-xl [color-scheme:light] md:bg-white/70 md:px-7 md:py-8 lg:px-8 lg:py-9">
          <header className="shrink-0">
            <p className="text-lg leading-7 font-semibold tracking-[-0.035em] text-[#212329]">
            Life Progress OS
            </p>
          </header>

          <div className="flex flex-1 items-center justify-center py-14 md:pb-20 md:pt-14">
            <div className="w-full max-w-[320px] min-w-0">
              <h1 className="mb-8 text-[34px] leading-10 font-semibold tracking-[-0.045em] text-[#17191e]">
                {user && isPasswordRecovery
                  ? "Новый пароль"
                  : user
                    ? "Вы уже вошли"
                    : mode === "signIn"
                      ? "Вход"
                      : "Создать аккаунт"}
              </h1>

              {!isConfigured ? (
                <div className="mb-6 rounded-xl border border-[#dedfe5] bg-[#eeedf2] p-4 text-sm text-[#656976]">
                  <p className="font-medium text-[#30333b]">
                    Supabase не настроен
                  </p>
                  <p className="mt-2 text-pretty break-words leading-6">
                    Заполните{" "}
                    <code className="break-all rounded bg-[#e3e3eb] px-1 py-0.5 text-xs text-[#434854]">
                      VITE_SUPABASE_URL
                    </code>{" "}
                    и{" "}
                    <code className="break-all rounded bg-[#e3e3eb] px-1 py-0.5 text-xs text-[#434854]">
                      VITE_SUPABASE_ANON_KEY
                    </code>{" "}
                    в{" "}
                    <code className="break-all rounded bg-[#e3e3eb] px-1 py-0.5 text-xs text-[#434854]">
                      .env.local
                    </code>
                    . Пример есть в{" "}
                    <code className="break-all rounded bg-[#e3e3eb] px-1 py-0.5 text-xs text-[#434854]">
                      .env.example
                    </code>
                    .
                  </p>
                </div>
              ) : null}

              {user && isPasswordRecovery ? (
                <div
                  className="flex min-w-0 flex-col gap-5"
                  role="region"
                  aria-label="Восстановление пароля"
                >
                  <div className="grid gap-1">
                    <div className={authFieldClassName}>
                      <Label
                        htmlFor="recovery-password"
                        className={authLabelClassName}
                      >
                        Новый пароль
                      </Label>
                      <Input
                        id="recovery-password"
                        type="password"
                        value={recoveryPassword}
                        onChange={(event) =>
                          setRecoveryPassword(event.target.value)
                        }
                        autoComplete="new-password"
                        className={authInputClassName}
                      />
                    </div>
                    <div className={authFieldClassName}>
                      <Label
                        htmlFor="recovery-password-confirm"
                        className={authLabelClassName}
                      >
                        Повторите пароль
                      </Label>
                      <Input
                        id="recovery-password-confirm"
                        type="password"
                        value={recoveryPasswordConfirm}
                        onChange={(event) =>
                          setRecoveryPasswordConfirm(event.target.value)
                        }
                        autoComplete="new-password"
                        className={authInputClassName}
                      />
                    </div>
                  </div>
                  {localError ? (
                    <p
                      role="alert"
                      className="text-pretty text-sm break-words text-[#b42338]"
                    >
                      {localError}
                    </p>
                  ) : null}
                  {info ? (
                    <p
                      role="status"
                      className="text-pretty text-sm break-words text-[#34537b]"
                    >
                      {info}
                    </p>
                  ) : null}
                  <Button
                    type="button"
                    className={`${authButtonClassName} self-end`}
                    onClick={() => {
                      void (async () => {
                        setLocalError(null)
                        setInfo(null)
                        if (recoveryPassword.length < 6) {
                          setLocalError(
                            "Пароль должен содержать не менее 6 символов.",
                          )
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
                    Сохранить пароль
                  </Button>
                </div>
              ) : user ? (
                <div
                  className="flex min-w-0 flex-col items-start gap-5"
                  role="region"
                  aria-label="Состояние входа"
                >
                  <p className="break-all text-sm text-[#656976]">
                    {user.email?.trim() ? user.email : "Не указан"}
                  </p>
                  <Button
                    type="button"
                    className={authButtonClassName}
                    asChild
                  >
                    <a href="/">Перейти в приложение</a>
                  </Button>
                  <div className="flex flex-wrap items-center gap-x-6">
                    <a href="/profile" className={authTextActionClassName}>
                      Перейти в профиль
                    </a>
                    <button
                      type="button"
                      className={authTextActionClassName}
                      onClick={() => void signOut()}
                    >
                      Выйти
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid min-w-0 gap-1">
                    <div className={authFieldClassName}>
                      <Label
                        htmlFor="auth-email"
                        className={authLabelClassName}
                      >
                        Email
                      </Label>
                      <Input
                        id="auth-email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={authInputClassName}
                        autoComplete="email"
                      />
                    </div>
                    <div className={authFieldClassName}>
                      <Label
                        htmlFor="auth-password"
                        className={authLabelClassName}
                      >
                        Пароль
                      </Label>
                      <Input
                        id="auth-password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={authInputClassName}
                        autoComplete={
                          mode === "signIn"
                            ? "current-password"
                            : "new-password"
                        }
                      />
                    </div>
                  </div>

                  {localError ? (
                    <p
                      role="alert"
                      className="text-pretty text-sm break-words text-[#b42338]"
                    >
                      {localError}
                    </p>
                  ) : null}
                  {error ? (
                    <p
                      role="alert"
                      className="text-pretty text-sm break-words text-[#b42338]"
                    >
                      {error}
                    </p>
                  ) : null}
                  {info ? (
                    <p
                      role="status"
                      className="text-pretty text-sm break-words text-[#34537b]"
                    >
                      {info}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 pt-3">
                    {mode === "signIn" ? (
                      <button
                        type="button"
                        className="mr-auto inline-flex min-h-11 items-center rounded-md text-xs text-[#5e7092] underline-offset-4 transition-colors hover:text-[#25498b] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                        onClick={() => {
                          void (async () => {
                            clearError()
                            setLocalError(null)
                            setInfo(null)
                            const result =
                              await sendPasswordResetEmail(email)
                            if (result.error) {
                              setLocalError(result.error)
                            } else {
                              setInfo(
                                "Письмо для сброса пароля отправлено. Проверьте почту.",
                              )
                            }
                          })()
                        }}
                      >
                        Забыли пароль?
                      </button>
                    ) : null}
                    <Button
                      type="button"
                      className={authButtonClassName}
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
                  <p className="flex flex-wrap items-center gap-x-1 text-xs leading-5 text-[#71757e]">
                    {mode === "signIn"
                      ? "Нет аккаунта?"
                      : "Уже есть аккаунт?"}
                    <button
                      type="button"
                      className="inline-flex min-h-11 items-center rounded-md px-1 font-medium text-[#4264a6] underline-offset-4 transition-colors hover:text-[#25498b] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                      onClick={() => {
                        setMode(mode === "signIn" ? "signUp" : "signIn")
                        setLocalError(null)
                        setInfo(null)
                        clearError()
                      }}
                    >
                      {mode === "signIn" ? "Создать аккаунт" : "Войти"}
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative hidden min-w-0 overflow-hidden bg-[#e8e5df] md:block">
          <iframe
            src="https://my.spline.design/draganddroplandingpage-stIugrL2lXgOnFMhr2XgIaSR/"
            title="Life Progress OS interactive visual"
            className="absolute inset-0 h-full w-full border-0 bg-[#e8e5df]"
            loading="lazy"
            scrolling="no"
          />
        </div>
      </section>
    </main>
  )
}
