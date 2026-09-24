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
  if (!userId.trim()) {
    return repositoryFailure("Не удалось очистить данные: отсутствует пользователь.")
  }

  try {
    const { error } = await supabase.rpc("clear_app_data_atomic")

    if (error) {
      return repositoryFailure(
        `Не удалось очистить данные: ${getRepositoryErrorMessage(error)}`,
      )
    }

    return repositorySuccess(null)
  } catch (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
}
