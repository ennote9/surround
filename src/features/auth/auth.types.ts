import type { Session, User } from "@supabase/supabase-js"

export type AuthContextValue = {
  session: Session | null
  user: User | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  isConfigured: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** Сброс пароля по email; не пишет в общий `error` контекста — смотрите возврат. */
  sendPasswordResetEmail: (
    email: string,
  ) => Promise<{ error: string | null }>
  clearError: () => void
}
