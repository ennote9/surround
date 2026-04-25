import { useEffect, useMemo, useState, type ReactNode } from "react"
import type { Session, User } from "@supabase/supabase-js"
import { isSupabaseConfigured, supabase } from "@/shared/lib/supabase"
import { AuthContext } from "./auth.context"

const NOT_CONFIGURED_MESSAGE =
  "Supabase не настроен. Заполните VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY."

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [error, setError] = useState<string | null>(null)

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
        setError(sessionError.message)
      } else {
        setSession(data.session)
        setUser(data.session?.user ?? null)
      }

      setLoading(false)
    }

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (cancelled) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
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
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (signInError) {
      setError(signInError.message)
    }
  }

  const signUp = async (email: string, password: string) => {
    setError(null)
    if (!supabase) {
      setError(NOT_CONFIGURED_MESSAGE)
      return
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError) {
      setError(signUpError.message)
    }
  }

  const signOut = async () => {
    setError(null)
    if (!supabase) {
      setError(NOT_CONFIGURED_MESSAGE)
      return
    }

    const { error: signOutError } = await supabase.auth.signOut()
    if (signOutError) {
      setError(signOutError.message)
    }
  }

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      error,
      isAuthenticated: Boolean(session?.user),
      isConfigured: isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      clearError,
    }),
    [session, user, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
