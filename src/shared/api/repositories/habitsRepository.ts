import { supabase } from "@/shared/lib/supabase"
import type { Habit } from "@/store/appState.types"
import {
  habitRowToHabit,
  habitToHabitInsert,
  habitToHabitUpdate,
} from "../database.mappers"
import type { HabitLogRow, HabitRow } from "../database.types"
import {
  getRepositoryErrorMessage,
  repositoryFailure,
  repositorySuccess,
  type RepositoryResult,
} from "../repositoryResult"

export async function listHabits(
  userId: string,
): Promise<RepositoryResult<Habit[]>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data: rows, error: he } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (he) {
    return repositoryFailure(getRepositoryErrorMessage(he))
  }
  if (!rows || rows.length === 0) {
    return repositorySuccess([])
  }

  const habitRows = rows as HabitRow[]
  const habitIds = habitRows.map((h) => h.id)

  const { data: logRows, error: le } = await supabase
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .in("habit_id", habitIds)
    .order("date", { ascending: true })

  if (le) {
    return repositoryFailure(getRepositoryErrorMessage(le))
  }

  const logsByHabit = new Map<string, HabitLogRow[]>()
  for (const log of (logRows ?? []) as HabitLogRow[]) {
    const list = logsByHabit.get(log.habit_id) ?? []
    list.push(log)
    logsByHabit.set(log.habit_id, list)
  }

  return repositorySuccess(
    habitRows.map((row) => {
      const logs = logsByHabit.get(row.id) ?? []
      return habitRowToHabit(row, logs)
    }),
  )
}

export async function createHabit(
  userId: string,
  habit: Habit,
): Promise<RepositoryResult<Habit>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { data, error } = await supabase
    .from("habits")
    .insert(habitToHabitInsert(habit, userId))
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Привычка не была создана.")
  }

  return repositorySuccess(
    habitRowToHabit(data as HabitRow, []),
  )
}

export async function updateHabit(
  userId: string,
  habitId: string,
  patch: Partial<Habit>,
): Promise<RepositoryResult<Habit>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const body = habitToHabitUpdate(patch)
  if (Object.keys(body).length === 0) {
    return fetchHabitWithLogs(supabase, userId, habitId)
  }

  const { data, error } = await supabase
    .from("habits")
    .update(body)
    .eq("id", habitId)
    .eq("user_id", userId)
    .select("*")
    .single()

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  if (!data) {
    return repositoryFailure("Привычка не найдена.")
  }

  return fetchHabitWithLogs(supabase, userId, habitId)
}

export async function deleteHabit(
  userId: string,
  habitId: string,
): Promise<RepositoryResult<boolean>> {
  if (!supabase) {
    return repositoryFailure("Supabase не настроен.")
  }

  const { error } = await supabase
    .from("habits")
    .delete()
    .eq("id", habitId)
    .eq("user_id", userId)

  if (error) {
    return repositoryFailure(getRepositoryErrorMessage(error))
  }
  return repositorySuccess(true)
}

type Client = NonNullable<typeof supabase>

async function fetchHabitWithLogs(
  client: Client,
  userId: string,
  habitId: string,
): Promise<RepositoryResult<Habit>> {
  const { data: h, error: e1 } = await client
    .from("habits")
    .select("*")
    .eq("id", habitId)
    .eq("user_id", userId)
    .single()

  if (e1) {
    return repositoryFailure(getRepositoryErrorMessage(e1))
  }
  if (!h) {
    return repositoryFailure("Привычка не найдена.")
  }

  const { data: logRows, error: e2 } = await client
    .from("habit_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("habit_id", habitId)
    .order("date", { ascending: true })

  if (e2) {
    return repositoryFailure(getRepositoryErrorMessage(e2))
  }

  return repositorySuccess(
    habitRowToHabit(
      h as HabitRow,
      (logRows ?? []) as HabitLogRow[],
    ),
  )
}
