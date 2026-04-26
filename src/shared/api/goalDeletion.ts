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

/**
 * Клиентские удаления в несколько запросов не атомарны.
 * Укрепление в будущем: RPC/транзакция в Supabase.
 */
export async function deleteGoalOnly(
  userId: string,
  goalId: string,
): Promise<RepositoryResult<DeleteGoalResult>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  try {
    const { data: projectRows, error: listErr } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", userId)
      .eq("goal_id", goalId)

    if (listErr) {
      return repositoryFailure(
        `Не удалось получить проекты цели: ${getRepositoryErrorMessage(listErr)}`,
      )
    }

    const affectedProjectIds = (projectRows ?? []).map((r) => r.id as string)

    const { error: unlinkErr } = await supabase
      .from("projects")
      .update({ goal_id: null })
      .eq("user_id", userId)
      .eq("goal_id", goalId)

    if (unlinkErr) {
      return repositoryFailure(
        `Не удалось отвязать проекты от цели: ${getRepositoryErrorMessage(unlinkErr)}`,
      )
    }

    const { error: msErr } = await supabase
      .from("milestones")
      .delete()
      .eq("user_id", userId)
      .eq("goal_id", goalId)

    if (msErr) {
      return repositoryFailure(
        `Не удалось удалить вехи цели: ${getRepositoryErrorMessage(msErr)}`,
      )
    }

    const { error: goalErr } = await supabase
      .from("goals")
      .delete()
      .eq("user_id", userId)
      .eq("id", goalId)

    if (goalErr) {
      return repositoryFailure(
        `Не удалось удалить цель: ${getRepositoryErrorMessage(goalErr)}`,
      )
    }

    return repositorySuccess({
      mode: "goal-only",
      deletedGoalId: goalId,
      affectedProjectIds,
      deletedProjectCount: 0,
    })
  } catch (e) {
    return repositoryFailure(getRepositoryErrorMessage(e))
  }
}

export async function deleteGoalWithProjects(
  userId: string,
  goalId: string,
): Promise<RepositoryResult<DeleteGoalResult>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  try {
    const { data: projectRows, error: listErr } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", userId)
      .eq("goal_id", goalId)

    if (listErr) {
      return repositoryFailure(
        `Не удалось получить проекты цели: ${getRepositoryErrorMessage(listErr)}`,
      )
    }

    const projectIds = (projectRows ?? []).map((r) => r.id as string)

    if (projectIds.length > 0) {
      const { error: tasksErr } = await supabase
        .from("tasks")
        .delete()
        .eq("user_id", userId)
        .in("project_id", projectIds)

      if (tasksErr) {
        return repositoryFailure(
          `Не удалось удалить задачи: ${getRepositoryErrorMessage(tasksErr)}`,
        )
      }

      const { error: groupsErr } = await supabase
        .from("project_groups")
        .delete()
        .eq("user_id", userId)
        .in("project_id", projectIds)

      if (groupsErr) {
        return repositoryFailure(
          `Не удалось удалить группы задач: ${getRepositoryErrorMessage(groupsErr)}`,
        )
      }

      const { error: msProjErr } = await supabase
        .from("milestones")
        .delete()
        .eq("user_id", userId)
        .in("project_id", projectIds)

      if (msProjErr) {
        return repositoryFailure(
          `Не удалось удалить вехи проектов: ${getRepositoryErrorMessage(msProjErr)}`,
        )
      }

      const { error: projErr } = await supabase
        .from("projects")
        .delete()
        .eq("user_id", userId)
        .in("id", projectIds)

      if (projErr) {
        return repositoryFailure(
          `Не удалось удалить проекты: ${getRepositoryErrorMessage(projErr)}`,
        )
      }
    }

    const { error: msGoalErr } = await supabase
      .from("milestones")
      .delete()
      .eq("user_id", userId)
      .eq("goal_id", goalId)

    if (msGoalErr) {
      return repositoryFailure(
        `Не удалось удалить вехи уровня цели: ${getRepositoryErrorMessage(msGoalErr)}`,
      )
    }

    const { error: goalErr } = await supabase
      .from("goals")
      .delete()
      .eq("user_id", userId)
      .eq("id", goalId)

    if (goalErr) {
      return repositoryFailure(
        `Не удалось удалить цель: ${getRepositoryErrorMessage(goalErr)}`,
      )
    }

    return repositorySuccess({
      mode: "with-projects",
      deletedGoalId: goalId,
      affectedProjectIds: projectIds,
      deletedProjectCount: projectIds.length,
    })
  } catch (e) {
    return repositoryFailure(getRepositoryErrorMessage(e))
  }
}
