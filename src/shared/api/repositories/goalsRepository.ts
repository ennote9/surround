import { supabase } from "@/shared/lib/supabase"
import type { Goal } from "@/store/appState.types"
import {
  goalRowToGoal,
  goalToGoalInsert,
  goalToGoalUpdate,
} from "../database.mappers"
import type { GoalRow } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

type Supabase = NonNullable<typeof supabase>

export async function listGoals(
  userId: string,
): Promise<RepositoryResult<Goal[]>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data, error } = await supabase
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositorySuccess([])
  }

  return repositorySuccess(
    (data as GoalRow[]).map((row) => goalRowToGoal(row)),
  )
}

export async function createGoal(
  userId: string,
  goal: Goal,
): Promise<RepositoryResult<Goal>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const insert = goalToGoalInsert(goal, userId)
  const { data, error } = await supabase
    .from("goals")
    .insert(insert)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Цель не была создана.")
  }

  return repositorySuccess(goalRowToGoal(data as GoalRow))
}

export async function updateGoal(
  userId: string,
  goalId: string,
  patch: Partial<Goal>,
): Promise<RepositoryResult<Goal>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const body = goalToGoalUpdate(patch)
  if (Object.keys(body).length === 0) {
    return fetchGoalById(supabase, userId, goalId)
  }

  const { data, error } = await supabase
    .from("goals")
    .update(body)
    .eq("id", goalId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Цель не найдена.")
  }

  return repositorySuccess(goalRowToGoal(data as GoalRow))
}

export async function archiveGoal(
  userId: string,
  goalId: string,
): Promise<RepositoryResult<Goal>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data, error } = await supabase
    .from("goals")
    .update({ status: "archived", show_on_dashboard: false })
    .eq("id", goalId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Цель не найдена.")
  }

  return repositorySuccess(goalRowToGoal(data as GoalRow))
}

async function fetchGoalById(
  client: Supabase,
  userId: string,
  goalId: string,
): Promise<RepositoryResult<Goal>> {
  const { data, error } = await client
    .from("goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", userId)
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Цель не найдена.")
  }
  return repositorySuccess(goalRowToGoal(data as GoalRow))
}
