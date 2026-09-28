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
    title: "Сводка дня",
    description: "Компактные показатели текущего контекста.",
    enabled: true,
  },
  {
    id: "todayRoutines",
    title: "Рутины",
    description: "Сегодняшние привычки и недельный ритм.",
    enabled: true,
  },
  {
    id: "projects",
    title: "Проекты",
    description: "Компактный список активных проектов и следующих действий.",
    enabled: true,
  },
  {
    id: "metrics",
    title: "Статы персонажа",
    description: "Компактные показатели личного развития на Главной.",
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
