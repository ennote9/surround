import type { CharacterStatType } from "@/store/appState.types"
import { CHARACTER_STATS } from "./characterStats"

export type DashboardStatVisibilityConfig = {
  id: CharacterStatType
  enabled: boolean
}

const DEFAULT_VISIBLE_IDS = new Set<CharacterStatType>([
  "intelligence",
  "language",
  "focus",
  "discipline",
  "career",
  "skills",
  "finance",
  "health",
])

export const DEFAULT_DASHBOARD_STAT_VISIBILITY: DashboardStatVisibilityConfig[] =
  CHARACTER_STATS.map((s) => ({
    id: s.id,
    enabled: DEFAULT_VISIBLE_IDS.has(s.id),
  }))

const KNOWN_STAT_IDS = new Set<CharacterStatType>(
  CHARACTER_STATS.map((s) => s.id),
)

function isKnownStatId(id: string): id is CharacterStatType {
  return KNOWN_STAT_IDS.has(id as CharacterStatType)
}

export function normalizeDashboardStatVisibility(
  raw: unknown,
): DashboardStatVisibilityConfig[] {
  const enabledById = new Map<CharacterStatType, boolean>()
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== "object" || item === null) continue
      const rec = item as Record<string, unknown>
      const id = rec.id
      if (typeof id !== "string" || !isKnownStatId(id)) continue
      if (typeof rec.enabled === "boolean") {
        enabledById.set(id, rec.enabled)
      }
    }
  }

  return CHARACTER_STATS.map((s) => {
    const def = DEFAULT_DASHBOARD_STAT_VISIBILITY.find((d) => d.id === s.id)
    const fromRaw = enabledById.get(s.id)
    return {
      id: s.id,
      enabled: typeof fromRaw === "boolean" ? fromRaw : (def?.enabled ?? false),
    }
  })
}
