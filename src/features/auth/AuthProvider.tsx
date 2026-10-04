import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { isSupabaseConfigured, supabase } from "@/shared/lib/supabase"
import { AuthContext } from "./auth.context"
import { getAuthErrorMessage } from "./authErrorMessages"

const NOT_CONFIGURED_MESSAGE =
  "Supabase не настроен. Заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY."

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false)

  useEffect(() => {
    let cancelled = false

    const client = supabase
    if (!client) {
      return
    }

    const initializeSession = async () => {
      setLoading(true)
      const { data, error: sessionError } = await client.auth.getSession()
      if (cancelled) return

      if (sessionError) {
        setError(getAuthErrorMessage(sessionError, "session"))
      } else {
        setSession(data.session)
        setUser(data.session?.user ?? null)
      }

      setLoading(false)
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, nextSession) => {
      if (cancelled) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      if (event === "PASSWORD_RECOVERY") {
        setIsPasswordRecovery(true)
      } else if (event === "SIGNED_OUT") {
        setIsPasswordRecovery(false)
      }
    })

    void initializeSession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  const clearError = () => setError(null)

  const signIn = async (email: string, password: string) => {
    setError(null)
    if (!supabase) {
      setError(NOT_CONFIGURED_MESSAGE)
      return { error: NOT_CONFIGURED_MESSAGE }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      const message = getAuthErrorMessage(signInError, "signIn")
      setError(message)
      return { error: message }
    }
    return { error: null }
  }

  const signUp = async (email: string, password: string) => {
    setError(null)
    if (!supabase) {
      setError(NOT_CONFIGURED_MESSAGE)
      return { error: NOT_CONFIGURED_MESSAGE }
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      const message = getAuthErrorMessage(signUpError, "signUp")
      setError(message)
      return { error: message }
    }
    return { error: null }
  }

  const signOut = async () => {
    setError(null)
    if (!supabase) {
      setError(NOT_CONFIGURED_MESSAGE)
      return
    }

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(getAuthErrorMessage(signOutError, "signOut"))
    }
  }

  const sendPasswordResetEmail = useCallback(
    async (email: string): Promise<{ error: string | null }> => {
      const trimmed = email.trim()
      if (!trimmed) {
        return { error: "Укажите email для сброса пароля." }
      }
      if (!supabase) {
        return { error: NOT_CONFIGURED_MESSAGE }
      }

      const redirectTo = `${window.location.origin}/auth`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmed,
        { redirectTo },
      )

      if (resetError) {
        return {
          error: getAuthErrorMessage(resetError, "passwordReset"),
        }
      }

      return { error: null }
    },
    [],
  )

  const updatePassword = useCallback(
    async (password: string): Promise<{ error: string | null }> => {
      if (!password) {
        return { error: "Введите новый пароль." }
      }
      if (!supabase) {
        return { error: NOT_CONFIGURED_MESSAGE }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        return { error: getAuthErrorMessage(updateError, "passwordUpdate") }
      }

      setIsPasswordRecovery(false)
      return { error: null }
    },
    [],
  )

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      error,
      isAuthenticated: Boolean(session?.user),
      isPasswordRecovery,
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      sendPasswordResetEmail,
      updatePassword,
      clearError,
    }),
    [
      session,
      user,
      loading,
      error,
      isPasswordRecovery,
      sendPasswordResetEmail,
      updatePassword,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
