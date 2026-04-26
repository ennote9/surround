import { useEffect, useRef, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { Link } from "react-router-dom"
import { AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/features/auth/useAuth"
import type { Profile } from "@/shared/api/database.types"
import {
  createDefaultProfileFromUser,
  getProfile,
  updateProfile,
} from "@/shared/api/repositories/profilesRepository"
import { useAppState } from "@/store/useAppState"

const MAX_DISPLAY_NAME_LENGTH = 60

function formatDateTime(value?: string | null): string {
  if (!value) return "—"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) {
    return value
  }
  return d.toLocaleString("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function formatSavedTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) {
    return iso
  }
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getProviderLabel(user: User): string {
  const meta = user.app_metadata as Record<string, unknown> | undefined
  if (!meta) {
    return "Email"
  }
  const single = meta.provider
  if (typeof single === "string" && single.length > 0) {
    return single === "email" ? "Email" : single
  }
  const providers = meta.providers
  if (Array.isArray(providers) && providers.length > 0) {
    const first = providers[0]
    if (typeof first === "string" && first.length > 0) {
      return first === "email" ? "Email" : first
    }
  }
  return "Email"
}

function getEmailConfirmedLabel(user: User): string {
  return user.email_confirmed_at ? "Да" : "Нет"
}

function InfoRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <span className="shrink-0 text-sm text-slate-500">{label}</span>
      <div className="min-w-0 break-words text-sm font-medium text-slate-950 sm:text-right">
        {children}
      </div>
    </div>
  )
}

function ProfileCard({
  title,
  description,
  children,
  headingId,
}: {
  title: string
  description?: string
  children: ReactNode
  headingId: string
}) {
  return (
    <section
      className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 lg:p-6"
      aria-labelledby={headingId}
    >
      <div className="min-w-0">
        <h2
          id={headingId}
          className="break-words text-lg font-semibold text-slate-950"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-pretty text-sm text-slate-600">{description}</p>
        ) : null}
      </div>
      <div className="mt-4 min-w-0 space-y-3">{children}</div>
    </section>
  )
}

export default function ProfilePage() {
  const { user, signOut, isConfigured, sendPasswordResetEmail } = useAuth()
  const { cloudSaveState, clearCloudSaveError } = useAppState()
  const [signingOut, setSigningOut] = useState(false)

  const [passwordResetSending, setPasswordResetSending] = useState(false)
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<string | null>(
    null,
  )
  const [passwordResetError, setPasswordResetError] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileRetryKey, setProfileRetryKey] = useState(0)

  const [displayNameDraft, setDisplayNameDraft] = useState("")
  const [displayNameFieldError, setDisplayNameFieldError] = useState<string | null>(
    null,
  )
  const [savingProfile, setSavingProfile] = useState(false)
  const [displayNameSaveError, setDisplayNameSaveError] = useState<string | null>(
    null,
  )
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null)
  const successClearRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearSuccessTimer = () => {
    if (successClearRef.current) {
      clearTimeout(successClearRef.current)
      successClearRef.current = null
    }
  }

  useEffect(() => {
    return () => {
      clearSuccessTimer()
    }
  }, [])

  const userId = user?.id
  const userEmail = user?.email

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => {
        setProfile(null)
        setProfileLoading(false)
        setProfileError(null)
        setDisplayNameDraft("")
      })
      return
    }

    const uid = userId
    let cancelled = false

    void (async () => {
      setProfileLoading(true)
      setProfileError(null)
      setDisplayNameSaveError(null)
      setProfileSaveSuccess(null)
      clearSuccessTimer()

      const existing = await getProfile(uid)
      if (cancelled) return

      if (existing.error) {
        setProfileError(existing.error)
        setProfile(null)
        setDisplayNameDraft("")
        setProfileLoading(false)
        return
      }

      if (existing.data === null) {
        const created = await createDefaultProfileFromUser({
          id: uid,
          email: userEmail,
        })
        if (cancelled) return
        if (created.error) {
          setProfileError(created.error)
          setProfile(null)
          setDisplayNameDraft("")
        } else if (created.data) {
          setProfile(created.data)
          setDisplayNameDraft(created.data.displayName ?? "")
        }
        setProfileLoading(false)
        return
      }

      setProfile(existing.data)
      setDisplayNameDraft(existing.data.displayName ?? "")
      setProfileLoading(false)
    })()

    return () => {
      cancelled = true
    }
  }, [userId, userEmail, profileRetryKey])

  const handleSignOut = async () => {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
      window.location.assign("/")
    } catch {
      setSigningOut(false)
    }
  }

  const accountEmailForReset = user?.email?.trim() ?? ""
  const canSendPasswordReset =
    isConfigured &&
    Boolean(accountEmailForReset) &&
    !passwordResetSending &&
    !signingOut

  const handlePasswordReset = async () => {
    if (!user?.email?.trim() || passwordResetSending) return
    setPasswordResetError(null)
    setPasswordResetSuccess(null)
    setPasswordResetSending(true)
    const { error } = await sendPasswordResetEmail(user.email)
    setPasswordResetSending(false)
    if (error) {
      setPasswordResetError(error)
      return
    }
    setPasswordResetSuccess("Письмо для сброса пароля отправлено на email.")
  }

  const normalizedDraftDisplayName =
    displayNameDraft.trim() === "" ? null : displayNameDraft.trim()

  const isDisplayNameUnchanged =
    profile !== null &&
    normalizedDraftDisplayName === (profile.displayName ?? null)

  const handleSaveDisplayName = async () => {
    if (!user?.id || !profile || savingProfile) return

    setDisplayNameFieldError(null)
    setDisplayNameSaveError(null)
    setProfileSaveSuccess(null)
    clearSuccessTimer()

    const trimmed = displayNameDraft.trim()
    const normalized = trimmed === "" ? null : trimmed

    if (normalized !== null && normalized.length > MAX_DISPLAY_NAME_LENGTH) {
      setDisplayNameFieldError(
        `Не более ${MAX_DISPLAY_NAME_LENGTH} символов после пробелов по краям.`,
      )
      return
    }

    if (normalized === (profile.displayName ?? null)) {
      return
    }

    setSavingProfile(true)
    const res = await updateProfile(user.id, {
      displayName: normalized,
      email: user.email ?? null,
    })
    setSavingProfile(false)

    if (res.error || !res.data) {
      setDisplayNameSaveError(res.error ?? "Не удалось сохранить профиль.")
      return
    }

    setProfile(res.data)
    setDisplayNameDraft(res.data.displayName ?? "")
    setProfileSaveSuccess("Профиль сохранён.")
    successClearRef.current = setTimeout(() => {
      setProfileSaveSuccess(null)
      successClearRef.current = null
    }, 3500)
  }

  if (!user) {
    return (
      <div className="mx-auto min-w-0 w-full max-w-5xl space-y-4 overflow-x-hidden sm:space-y-6 lg:space-y-8">
        <div className="min-w-0 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
          <p
            className="text-pretty text-sm font-medium text-amber-950"
            role="status"
            aria-live="polite"
          >
            Пользователь не найден. Перейдите на страницу входа.
          </p>
          <Button asChild variant="outline" className="mt-4 min-h-10 w-full sm:w-auto">
            <Link to="/auth">Страница входа</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { status } = cloudSaveState

  const saveDisabled =
    profileLoading ||
    profile === null ||
    savingProfile ||
    Boolean(displayNameFieldError) ||
    isDisplayNameUnchanged

  return (
    <div
      className="mx-auto min-w-0 w-full max-w-5xl space-y-4 overflow-x-hidden sm:space-y-6 lg:space-y-8"
      aria-labelledby="profile-page-title"
    >
      <header className="min-w-0">
        <h1
          id="profile-page-title"
          className="text-balance break-words text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl"
        >
          Профиль
        </h1>
        <p className="mt-2 max-w-full text-pretty text-sm text-slate-600 sm:mt-3 sm:text-base">
          Аккаунт, синхронизация и безопасность.
        </p>
      </header>

      <ProfileCard
        title="Аккаунт"
        description="Данные из Supabase Auth."
        headingId="profile-section-account"
      >
        <div className="space-y-3">
          <InfoRow label="Email">
            {user.email?.trim() ? (
              <span className="break-all">{user.email}</span>
            ) : (
              <span className="font-normal text-slate-500">Не указан</span>
            )}
          </InfoRow>
          <InfoRow label="User ID">
            <code className="block font-mono text-xs font-normal leading-relaxed break-all text-slate-800">
              {user.id}
            </code>
          </InfoRow>
          <InfoRow label="Дата создания">
            {formatDateTime(user.created_at)}
          </InfoRow>
          <InfoRow label="Последний вход">
            {user.last_sign_in_at
              ? formatDateTime(user.last_sign_in_at)
              : "—"}
          </InfoRow>
          <InfoRow label="Email подтверждён">
            {getEmailConfirmedLabel(user)}
          </InfoRow>
          <InfoRow label="Провайдер">{getProviderLabel(user)}</InfoRow>
        </div>
      </ProfileCard>

      <ProfileCard
        title="Профиль"
        description="Отображаемое имя в приложении (таблица public.profiles)."
        headingId="profile-section-profile"
      >
        {profileLoading ? (
          <div
            className="flex items-center gap-2 text-sm text-slate-600"
            role="status"
            aria-busy="true"
          >
            <Loader2 className="size-4 shrink-0 animate-spin text-blue-600" aria-hidden />
            Загрузка профиля…
          </div>
        ) : null}

        {!profileLoading && profileError ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 p-3 text-pretty text-sm text-red-800"
            role="alert"
          >
            <p className="break-words font-medium">{profileError}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 min-h-11 w-full border-red-200 sm:min-h-10 sm:w-auto"
              onClick={() => setProfileRetryKey((k) => k + 1)}
            >
              Повторить
            </Button>
          </div>
        ) : null}

        {!profileLoading && profile && !profileError ? (
          <div className="min-w-0 space-y-3">
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="profile-display-name">Отображаемое имя</Label>
              <Input
                id="profile-display-name"
                type="text"
                value={displayNameDraft}
                onChange={(e) => {
                  setDisplayNameDraft(e.target.value)
                  setDisplayNameFieldError(null)
                  setDisplayNameSaveError(null)
                }}
                placeholder="Например, ennote9"
                maxLength={MAX_DISPLAY_NAME_LENGTH}
                className="min-h-10 min-w-0 w-full max-w-full border-slate-300"
                autoComplete="nickname"
              />
              <p className="text-pretty text-xs text-slate-500">
                Используется внутри приложения. Email остаётся в Supabase Auth.
              </p>
              <p className="text-pretty text-xs text-slate-500">
                До {MAX_DISPLAY_NAME_LENGTH} символов; пустое значение допустимо.
              </p>
            </div>

            {displayNameFieldError ? (
              <p className="text-pretty text-sm break-words text-red-600" role="alert">
                {displayNameFieldError}
              </p>
            ) : null}
            {displayNameSaveError ? (
              <p className="text-pretty text-sm break-words text-red-600" role="alert">
                {displayNameSaveError}
              </p>
            ) : null}
            {profileSaveSuccess ? (
              <p className="text-pretty text-sm break-words text-emerald-700" role="status">
                {profileSaveSuccess}
              </p>
            ) : null}

            <Button
              type="button"
              className="min-h-11 w-full bg-blue-600 text-white hover:bg-blue-700 sm:min-h-10 sm:w-auto"
              disabled={saveDisabled}
              onClick={() => void handleSaveDisplayName()}
            >
              {savingProfile ? "Сохранение…" : "Сохранить"}
            </Button>
          </div>
        ) : null}
      </ProfileCard>

      <ProfileCard
        title="Синхронизация"
        description="Статус сохранения данных приложения в облако."
        headingId="profile-section-sync"
      >
        <div
          className="min-w-0 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-3 text-sm sm:px-4 sm:py-4"
          role="status"
          aria-live="polite"
        >
          {status === "idle" ? (
            <p className="font-medium text-slate-800">Готово</p>
          ) : null}
          {status === "saving" ? (
            <div className="flex items-center gap-2 text-slate-800">
              <Loader2 className="size-4 shrink-0 animate-spin text-blue-600" aria-hidden />
              <span className="font-medium">Сохраняем...</span>
            </div>
          ) : null}
          {status === "saved" ? (
            <div className="flex flex-wrap items-center gap-2 text-slate-800">
              <CheckCircle2
                className="size-4 shrink-0 text-emerald-600"
                aria-hidden
              />
              <span className="font-medium">Сохранено</span>
              <span className="text-slate-600">
                в {formatSavedTime(cloudSaveState.savedAt)}
              </span>
            </div>
          ) : null}
          {status === "error" ? (
            <div className="space-y-3" role="alert">
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className="mt-0.5 size-4 shrink-0 text-red-600"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="font-medium text-red-800">Ошибка сохранения</p>
                  <p className="mt-1 min-w-0 text-pretty break-words text-sm text-red-700">
                    {cloudSaveState.error}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="min-h-11 w-full border-red-200 text-red-800 hover:bg-red-50 sm:min-h-10 sm:w-auto"
                onClick={clearCloudSaveError}
              >
                Скрыть
              </Button>
            </div>
          ) : null}
        </div>
        <p className="text-pretty text-sm text-slate-600">
          Данные сохраняются в аккаунте Supabase.
        </p>
      </ProfileCard>

      <ProfileCard
        title="Данные"
        description="Экспорт и импорт JSON."
        headingId="profile-section-data"
      >
        <p className="text-pretty text-sm text-slate-600">
          Экспорт и импорт JSON находятся в настройках.
        </p>
        <Button
          asChild
          variant="default"
          className="min-h-11 w-full sm:min-h-10 sm:w-auto"
        >
          <Link to="/settings">Управление данными</Link>
        </Button>
      </ProfileCard>

      <ProfileCard
        title="Безопасность"
        description="Сброс пароля по email и выход из аккаунта."
        headingId="profile-section-security"
      >
        <div className="min-w-0 space-y-2 text-pretty text-sm text-slate-600">
          <p>
            Мы отправим письмо со ссылкой для восстановления доступа. После
            перехода по ссылке Supabase вернёт вас в приложение.
          </p>
          <p className="text-xs text-slate-500">
            Полноценная смена пароля внутри приложения будет добавлена позже.
          </p>
        </div>

        {!isConfigured ? (
          <p className="text-pretty text-xs break-words text-amber-800">
            Supabase не настроен — отправка письма недоступна.
          </p>
        ) : null}
        {!accountEmailForReset && isConfigured ? (
          <p className="text-pretty text-sm break-words text-slate-600">
            У аккаунта нет email — сброс пароля по почте недоступен.
          </p>
        ) : null}

        {passwordResetError ? (
          <p className="text-pretty text-sm break-words text-red-600" role="alert">
            {passwordResetError}
          </p>
        ) : null}
        {passwordResetSuccess ? (
          <p className="text-pretty text-sm break-words text-emerald-700" role="status">
            {passwordResetSuccess}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full border-slate-300 sm:min-h-10 sm:w-auto"
            disabled={!canSendPasswordReset}
            onClick={() => void handlePasswordReset()}
          >
            {passwordResetSending
              ? "Отправляем..."
              : "Отправить письмо для сброса пароля"}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full border-red-200 text-red-800 hover:bg-red-50 sm:min-h-10 sm:w-auto"
            disabled={signingOut || passwordResetSending}
            onClick={() => void handleSignOut()}
          >
            {signingOut ? "Выход..." : "Выйти из аккаунта"}
          </Button>
        </div>
      </ProfileCard>
    </div>
  )
}
