import { supabase } from "@/shared/lib/supabase"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

export async function clearCloudAppData(
  userId: string,
): Promise<RepositoryResult<null>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  try {
    const tablesInOrder = [
      "habit_logs",
      "tasks",
      "project_groups",
      "milestones",
      "projects",
      "habits",
      "goals",
      "user_settings",
    ] as const

    for (const table of tablesInOrder) {
      const { error } = await supabase.from(table).delete().eq("user_id", userId)
      if (error) {
        return repositoryFailure(
          `Не удалось очистить ${table}: ${getRepositoryErrorMessage(error)}`,
        )
      }
    }

    return repositorySuccess(null)
  } catch (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
}
