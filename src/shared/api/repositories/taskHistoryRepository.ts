import { supabase } from "@/shared/lib/supabase"
import type { TaskHistoryRow } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

export type TaskHistoryEntry = {
  id: string
  taskId: string
  batchId: string
  eventType: string
  oldValue: unknown | null
  newValue: unknown | null
  reason?: string
  changedAt: string
}

function rowToEntry(row: TaskHistoryRow): TaskHistoryEntry {
  return {
    id: row.id,
    taskId: row.task_id,
    batchId: row.batch_id,
    eventType: row.event_type,
    oldValue: row.old_value,
    newValue: row.new_value,
    reason: row.reason ?? undefined,
    changedAt: row.changed_at,
  }
}

export async function listTaskHistory(
  taskId: string,
  limit = 100,
): Promise<RepositoryResult<TaskHistoryEntry[]>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data, error } = await supabase
    .from("task_history")
    .select(
      "id, user_id, task_id, batch_id, event_type, old_value, new_value, reason, changed_at",
    )
    .eq("task_id", taskId)
    .order("changed_at", { ascending: false })
    .limit(limit)

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }

  return repositorySuccess(
    ((data ?? []) as TaskHistoryRow[]).map(rowToEntry),
  )
}
