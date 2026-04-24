export type DashboardWidgetId =
  | "overallProgress"
  | "todayRoutines"
  | "projects"
  | "metrics"

export type DashboardWidgetConfig = {
  id: DashboardWidgetId
  title: string
  description: string
  enabled: boolean
}

export const DEFAULT_DASHBOARD_WIDGETS: DashboardWidgetConfig[] = [
  {
    id: "overallProgress",
    title: "Общий прогресс",
    description: "Сводный процент выполнения задач.",
    enabled: true,
  },
  {
    id: "todayRoutines",
    title: "Сегодняшние рутины",
    description: "Привычки, которые нужно отметить сегодня.",
    enabled: true,
  },
  {
    id: "projects",
    title: "Проекты",
    description: "Карточки направлений подготовки.",
    enabled: true,
  },
  {
    id: "metrics",
    title: "Статы персонажа",
    description: "Универсальные RPG-статы, которые прокачиваются через проекты.",
    enabled: true,
  },
]

const KNOWN_IDS: DashboardWidgetId[] = [
  "overallProgress",
  "todayRoutines",
  "projects",
  "metrics",
]

function isDashboardWidgetId(id: string): id is DashboardWidgetId {
  return KNOWN_IDS.includes(id as DashboardWidgetId)
}

export function normalizeDashboardWidgets(
  raw: unknown,
): DashboardWidgetConfig[] {
  const enabledById = new Map<DashboardWidgetId, boolean | undefined>()
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item !== "object" || item === null) continue
      const rec = item as Record<string, unknown>
      const id = rec.id
      if (typeof id !== "string" || !isDashboardWidgetId(id)) continue
      enabledById.set(
        id,
        typeof rec.enabled === "boolean" ? rec.enabled : undefined,
      )
    }
  }

  return DEFAULT_DASHBOARD_WIDGETS.map((def) => ({
    ...def,
    enabled: enabledById.get(def.id) ?? def.enabled,
  }))
}
