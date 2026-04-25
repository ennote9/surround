import { supabase } from "@/shared/lib/supabase"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

export async function getUserSettings(
  userId: string,
): Promise<RepositoryResult<Record<string, unknown> | null>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data, error } = await supabase
    .from("user_settings")
    .select("settings")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (data == null) {
    return repositorySuccess(null)
  }

  const s = (data as { settings: unknown }).settings
  if (s !== null && typeof s === "object" && !Array.isArray(s)) {
    return repositorySuccess(s as Record<string, unknown>)
  }
  return repositorySuccess({})
}

export async function upsertUserSettings(
  userId: string,
  settings: Record<string, unknown>,
): Promise<RepositoryResult<Record<string, unknown>>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data, error } = await supabase
    .from("user_settings")
    .upsert(
      { user_id: userId, settings },
      { onConflict: "user_id" },
    )
    .select("settings")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositorySuccess(settings)
  }

  const s = (data as { settings: unknown }).settings
  if (s !== null && typeof s === "object" && !Array.isArray(s)) {
    return repositorySuccess(s as Record<string, unknown>)
  }
  return repositorySuccess(settings)
}
