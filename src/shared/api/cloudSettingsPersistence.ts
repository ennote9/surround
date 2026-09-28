import type { AppSettings } from "@/store/appState.types"
import { upsertUserSettings } from "./repositories/userSettingsRepository"
import {
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

/**
 * Сохраняет облачные настройки приложения, включая рабочий Inbox,
 * фокус дня и отметки закрытия рабочего дня.
 * Локальные UI keys (selectedGoal, sidebar, dashboard widgets и т.д.) сюда не попадают.
 */
export async function persistUserSettings(
  userId: string,
  settings: AppSettings,
): Promise<RepositoryResult<null>> {
  const result = await upsertUserSettings(
    userId,
    { ...settings } as Record<string, unknown>,
  )
  if (result.error) {
    return repositoryFailure(result.error)
  }
  return repositorySuccess(null)
}
