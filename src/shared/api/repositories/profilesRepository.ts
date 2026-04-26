import type { User } from "@supabase/supabase-js"
import { supabase } from "@/shared/lib/supabase"
import {
  profilePatchToProfileUpdate,
  profileRowToProfile,
  profileToProfileUpsert,
} from "../database.mappers"
import type { Profile, ProfileRow } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

export async function getProfile(
  userId: string,
): Promise<RepositoryResult<Profile | null>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (data == null) {
    return repositorySuccess(null)
  }

  return repositorySuccess(profileRowToProfile(data as ProfileRow))
}

export async function upsertProfile(
  profile: Profile,
): Promise<RepositoryResult<Profile>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const row = profileToProfileUpsert(profile)
  const { data, error } = await supabase
    .from("profiles")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Профиль не был сохранён.")
  }

  return repositorySuccess(profileRowToProfile(data as ProfileRow))
}

export async function updateProfile(
  userId: string,
  patch: { displayName?: string | null; email?: string | null },
): Promise<RepositoryResult<Profile>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const body = profilePatchToProfileUpdate(patch)
  if (Object.keys(body).length === 0) {
    const loaded = await getProfile(userId)
    if (!loaded.error && loaded.data) {
      return repositorySuccess(loaded.data)
    }
    return repositoryFailure("Нет полей для обновления профиля.")
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(body)
    .eq("id", userId)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Профиль не найден.")
  }

  return repositorySuccess(profileRowToProfile(data as ProfileRow))
}

export async function createDefaultProfileFromUser(
  user: Pick<User, "id" | "email">,
): Promise<RepositoryResult<Profile>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const insert = {
    id: user.id,
    email: user.email ?? null,
    display_name: null as string | null,
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(insert, { onConflict: "id" })
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Профиль не был создан.")
  }

  return repositorySuccess(profileRowToProfile(data as ProfileRow))
}
