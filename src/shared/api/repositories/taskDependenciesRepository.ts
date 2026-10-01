import { supabase } from "@/shared/lib/supabase"
import type { TaskDependencyRow } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

export type TaskDependency = {
  id: string
  userId: string
  projectId: string
  predecessorTaskId: string
  successorTaskId: string
  blocksSuccessor: boolean
  completionAction: "unblock" | "set_next_action"
  createdAt: string
  updatedAt: string
}

function rowToDependency(row: TaskDependencyRow): TaskDependency {
  return {
    id: row.id,
    userId: row.user_id,
    projectId: row.project_id,
    predecessorTaskId: row.predecessor_task_id,
    successorTaskId: row.successor_task_id,
    blocksSuccessor: row.blocks_successor,
    completionAction:
      row.completion_action === "set_next_action"
        ? "set_next_action"
        : "unblock",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listTaskDependencies(
  userId: string,
  projectIds?: string[],
): Promise<RepositoryResult<TaskDependency[]>> {
  if (!supabase) return repositoryFailure("Supabase не настроен.")

  let query = supabase
    .from("task_dependencies")
    .select("*")
    .eq("user_id", userId)

  if (projectIds && projectIds.length > 0) {
    query = query.in("project_id", projectIds)
  }

  const { data, error } = await query
  if (error) return repositoryFailure(getRepositoryErrorMessage(error))

  return repositorySuccess(
    ((data ?? []) as TaskDependencyRow[]).map(rowToDependency),
  )
}

export async function syncTaskRelations(params: {
  userId: string
  projectId: string
  taskId: string
  blockedByTaskIds: string[]
  completionNextTaskId?: string
}): Promise<RepositoryResult<null>> {
  if (!supabase) return repositoryFailure("Supabase не настроен.")

  const { userId, projectId, taskId } = params
  const desiredBlockers = new Set(
    params.blockedByTaskIds.filter((id) => id && id !== taskId),
  )
  const desiredNext =
    params.completionNextTaskId && params.completionNextTaskId !== taskId
      ? params.completionNextTaskId
      : undefined

  const { data, error } = await supabase
    .from("task_dependencies")
    .select("*")
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .or(
      `predecessor_task_id.eq.${taskId},successor_task_id.eq.${taskId}`,
    )

  if (error) return repositoryFailure(getRepositoryErrorMessage(error))

  const rows = (data ?? []) as TaskDependencyRow[]
  const incoming = rows.filter((row) => row.successor_task_id === taskId)
  const outgoing = rows.filter((row) => row.predecessor_task_id === taskId)

  for (const row of incoming) {
    const shouldBlock = desiredBlockers.has(row.predecessor_task_id)
    if (row.blocks_successor !== shouldBlock) {
      if (!shouldBlock && row.completion_action === "unblock") {
        const { error: deleteError } = await supabase
          .from("task_dependencies")
          .delete()
          .eq("id", row.id)
          .eq("user_id", userId)
        if (deleteError) {
          return repositoryFailure(getRepositoryErrorMessage(deleteError))
        }
      } else {
        const { error: updateError } = await supabase
          .from("task_dependencies")
          .update({ blocks_successor: shouldBlock })
          .eq("id", row.id)
          .eq("user_id", userId)
        if (updateError) {
          return repositoryFailure(getRepositoryErrorMessage(updateError))
        }
      }
    }
    desiredBlockers.delete(row.predecessor_task_id)
  }

  for (const predecessorTaskId of desiredBlockers) {
    const { error: insertError } = await supabase
      .from("task_dependencies")
      .insert({
        user_id: userId,
        project_id: projectId,
        predecessor_task_id: predecessorTaskId,
        successor_task_id: taskId,
        blocks_successor: true,
        completion_action: "unblock",
      })
    if (insertError) {
      return repositoryFailure(getRepositoryErrorMessage(insertError))
    }
  }

  const currentNext = outgoing.find(
    (row) => row.completion_action === "set_next_action",
  )

  if (currentNext && currentNext.successor_task_id !== desiredNext) {
    const shouldKeepBlocking = currentNext.blocks_successor
    if (shouldKeepBlocking) {
      const { error: downgradeError } = await supabase
        .from("task_dependencies")
        .update({ completion_action: "unblock" })
        .eq("id", currentNext.id)
        .eq("user_id", userId)
      if (downgradeError) {
        return repositoryFailure(getRepositoryErrorMessage(downgradeError))
      }
    } else {
      const { error: deleteError } = await supabase
        .from("task_dependencies")
        .delete()
        .eq("id", currentNext.id)
        .eq("user_id", userId)
      if (deleteError) {
        return repositoryFailure(getRepositoryErrorMessage(deleteError))
      }
    }
  }

  if (desiredNext && currentNext?.successor_task_id !== desiredNext) {
    const existingPair = outgoing.find(
      (row) => row.successor_task_id === desiredNext,
    )

    if (existingPair) {
      const { error: updateError } = await supabase
        .from("task_dependencies")
        .update({ completion_action: "set_next_action" })
        .eq("id", existingPair.id)
        .eq("user_id", userId)
      if (updateError) {
        return repositoryFailure(getRepositoryErrorMessage(updateError))
      }
    } else {
      const { error: insertError } = await supabase
        .from("task_dependencies")
        .insert({
          user_id: userId,
          project_id: projectId,
          predecessor_task_id: taskId,
          successor_task_id: desiredNext,
          blocks_successor: false,
          completion_action: "set_next_action",
        })
      if (insertError) {
        return repositoryFailure(getRepositoryErrorMessage(insertError))
      }
    }
  }

  return repositorySuccess(null)
}
