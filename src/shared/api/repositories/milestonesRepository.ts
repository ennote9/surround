import { supabase } from "@/shared/lib/supabase"
import type { Milestone } from "@/store/appState.types"
import {
  milestoneRowToMilestone,
  milestoneToMilestoneInsert,
  milestoneToMilestoneUpdate,
} from "../database.mappers"
import type { MilestoneRow } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

export async function listMilestones(
  userId: string,
): Promise<RepositoryResult<Milestone[]>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data, error } = await supabase
    .from("milestones")
    .select("*")
    .eq("user_id", userId)
    .order("target_date", { ascending: true, nullsFirst: false })

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositorySuccess([])
  }

  return repositorySuccess(
    (data as MilestoneRow[]).map((r) => milestoneRowToMilestone(r)),
  )
}

export async function createMilestone(
  userId: string,
  milestone: Milestone,
): Promise<RepositoryResult<Milestone>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  if (milestone.projectId === undefined) {
    return repositoryFailure(
      "Сейчас в облаке можно сохранить веху только с projectId (цель-уровень — в следующей итерации).",
    )
  }

  const { data, error } = await supabase
    .from("milestones")
    .insert(milestoneToMilestoneInsert(milestone, userId))
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Веха не была создана.")
  }

  return repositorySuccess(milestoneRowToMilestone(data as MilestoneRow))
}

export async function updateMilestone(
  userId: string,
  milestoneId: string,
  patch: Partial<Milestone>,
): Promise<RepositoryResult<Milestone>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const body = milestoneToMilestoneUpdate(patch)
  if (Object.keys(body).length === 0) {
    return fetchMilestoneById(supabase, userId, milestoneId)
  }

  const { data, error } = await supabase
    .from("milestones")
    .update(body)
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Веха не найдена.")
  }

  return repositorySuccess(milestoneRowToMilestone(data as MilestoneRow))
}

export async function deleteMilestone(
  userId: string,
  milestoneId: string,
): Promise<RepositoryResult<boolean>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { error } = await supabase
    .from("milestones")
    .delete()
    .eq("id", milestoneId)
    .eq("user_id", userId)

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  return repositorySuccess(true)
}

type Client = NonNullable<typeof supabase>

async function fetchMilestoneById(
  client: Client,
  userId: string,
  milestoneId: string,
): Promise<RepositoryResult<Milestone>> {
  const { data, error } = await client
    .from("milestones")
    .select("*")
    .eq("id", milestoneId)
    .eq("user_id", userId)
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Веха не найдена.")
  }
  return repositorySuccess(milestoneRowToMilestone(data as MilestoneRow))
}
