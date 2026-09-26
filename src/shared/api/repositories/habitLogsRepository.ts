import { supabase } from "@/shared/lib/supabase"
import type { HabitEntry } from "@/store/appState.types"
import type { HabitLogRow, HabitLogInsert } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

export async function upsertHabitLog(
  userId: string,
  habitId: string,
  date: string,
  entry: HabitEntry,
): Promise<RepositoryResult<boolean>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const row: HabitLogInsert = {
    user_id: userId,
    habit_id: habitId,
    date,
    completed: entry.completed,
    value: entry.value ?? null,
    note: entry.note ?? null,
    skipped: entry.skipped ?? entry.status === "skipped",
    status:
      entry.status ??
      (entry.skipped
        ? "skipped"
        : entry.completed
          ? "completed"
          : entry.value != null && entry.value > 0
            ? "partial"
            : "planned"),
    reason: entry.reason ?? null,
    helped: entry.helped ?? null,
    rescheduled_to: entry.rescheduledTo ?? null,
    recorded_at: entry.recordedAt ?? new Date().toISOString(),
    energy: entry.energy ?? null,
    load: entry.load ?? null,
  }

  const { error } = await supabase.from("habit_logs").upsert(row, {
    onConflict: "habit_id,date",
  })

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  return repositorySuccess(true)
}

export async function listHabitLogs(
  userId: string,
  startDate?: string,
  endDate?: string,
): Promise<RepositoryResult<HabitLogRow[]>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  let q = supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true })

  if (startDate !== undefined) {
    q = q.gte("date", startDate)
  }
  if (endDate !== undefined) {
    q = q.lte("date", endDate)
  }

  const { data, error } = await q

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  return repositorySuccess((data ?? []) as HabitLogRow[])
}
