import { supabase } from "@/shared/lib/supabase"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "./repositoryResult"

export type DeleteGoalMode = "goal-only" | "with-projects"

export type DeleteGoalResult = {
  mode: DeleteGoalMode
  deletedGoalId: string
  affectedProjectIds: string[]
  deletedProjectCount: number
}

type GoalDeletionRpcPayload = {
  mode?: unknown
  deletedGoalId?: unknown
  affectedProjectIds?: unknown
  deletedProjectCount?: unknown
}

function parseGoalDeletionResult(
  value: unknown,
  expectedMode: DeleteGoalMode,
  expectedGoalId: string,
): DeleteGoalResult | null {
  if (!value || typeof value !== "object") return null
  const raw = value as GoalDeletionRpcPayload
  if (raw.mode !== expectedMode || raw.deletedGoalId !== expectedGoalId) {
    return null
  }

  const affectedProjectIds = Array.isArray(raw.affectedProjectIds)
    ? raw.affectedProjectIds.filter(
        (id): id is string => typeof id === "string" && id.length > 0,
      )
    : []

  const deletedProjectCount =
    typeof raw.deletedProjectCount === "number" &&
    Number.isFinite(raw.deletedProjectCount)
      ? Math.max(0, Math.round(raw.deletedProjectCount))
      : expectedMode === "with-projects"
        ? affectedProjectIds.length
        : 0

  return {
    mode: expectedMode,
    deletedGoalId: expectedGoalId,
    affectedProjectIds,
    deletedProjectCount,
  }
}

async function deleteGoalAtomic(
  userId: string,
  goalId: string,
  mode: DeleteGoalMode,
): Promise<RepositoryResult<DeleteGoalResult>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }
  if (!userId.trim() || !goalId.trim()) {
    return repositoryFailure("Не удалось удалить цель: отсутствует идентификатор.")
  }

  try {
    const { data, error } = await supabase.rpc("delete_goal_atomic", {
      p_goal_id: goalId,
      p_mode: mode,
    })

    if (error) {
      return repositoryFailure(
        `Не удалось удалить цель: ${getRepositoryErrorMessage(error)}`,
      )
    }

    const parsed = parseGoalDeletionResult(data, mode, goalId)
    if (!parsed) {
      return repositoryFailure(
        "Цель удалена некорректно: сервер вернул неожиданный ответ.",
      )
    }

    return repositorySuccess(parsed)
  } catch (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
}

export function deleteGoalOnly(
  userId: string,
  goalId: string,
): Promise<RepositoryResult<DeleteGoalResult>> {
  return deleteGoalAtomic(userId, goalId, "goal-only")
}

export function deleteGoalWithProjects(
  userId: string,
  goalId: string,
): Promise<RepositoryResult<DeleteGoalResult>> {
  return deleteGoalAtomic(userId, goalId, "with-projects")
}
