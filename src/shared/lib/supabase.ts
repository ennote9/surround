import { createClient } from "@supabase/supabase-js"
import type { SupabaseClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    String(supabaseUrl).trim() !== "" &&
    String(supabaseAnonKey).trim() !== "",
)

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(String(supabaseUrl).trim(), String(supabaseAnonKey).trim())
  : null

if (!isSupabaseConfigured && import.meta.env.DEV) {
  console.warn(
    "Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local (see .env.example).",
  )
}
