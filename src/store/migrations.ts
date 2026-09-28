import { isCharacterStatType } from "@/shared/lib/characterStats"
import { isProjectPhase } from "@/shared/lib/projectPhases"
import type {
  AppState,
  CharacterStatType,
  Goal,
  GoalStatus,
  Project,
} from "./appState.types"
import { initialAppState } from "./initialState"

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function sanitizeAppSettings(rawSettings: unknown): AppState["settings"] {
  const raw = isRecord(rawSettings) ? rawSettings : {}

  const theme =
    raw.theme === "dark" || raw.theme === "system" || raw.theme === "light"
      ? raw.theme
      : initialAppState.settings.theme
  const accentColor =
    typeof raw.accentColor === "string" && raw.accentColor.trim()
      ? raw.accentColor
      : initialAppState.settings.accentColor
  const workspaceMode =
    raw.workspaceMode === "work" || raw.workspaceMode === "personal"
      ? raw.workspaceMode
      : "all"

  const workInbox = Array.isArray(raw.workInbox)
    ? raw.workInbox.flatMap((item) => {
        if (!isRecord(item)) return []
        const id = typeof item.id === "string" ? item.id.trim() : ""
        const title = typeof item.title === "string" ? item.title.trim() : ""
        const createdAt =
          typeof item.createdAt === "string" && item.createdAt.trim()
            ? item.createdAt
            : new Date().toISOString()
        const context =
          item.context === "personal" || item.context === "work"
            ? item.context
            : undefined
        return id && title
          ? [{ id, title, createdAt, ...(context ? { context } : {}) }]
          : []
      })
    : []

  const dailyFocus: Record<string, string[]> = {}
  if (isRecord(raw.dailyFocus)) {
    for (const [date, ids] of Object.entries(raw.dailyFocus)) {
      if (!Array.isArray(ids)) continue
      dailyFocus[date] = [
        ...new Set(ids.filter((id): id is string => typeof id === "string" && id.trim() !== "")),
      ].slice(0, 3)
    }
  }

  const workWipLimit =
    typeof raw.workWipLimit === "number" && Number.isFinite(raw.workWipLimit)
      ? Math.max(1, Math.min(12, Math.round(raw.workWipLimit)))
      : 4

  const workWeeklyReviews: AppState["settings"]["workWeeklyReviews"] = {}
  if (isRecord(raw.workWeeklyReviews)) {
    for (const [week, value] of Object.entries(raw.workWeeklyReviews)) {
      if (!isRecord(value) || typeof value.reviewedAt !== "string") continue
      workWeeklyReviews[week] = {
        reviewedAt: value.reviewedAt,
        ...(typeof value.wins === "string" && value.wins.trim()
          ? { wins: value.wins.trim() }
          : {}),
        ...(typeof value.blockers === "string" && value.blockers.trim()
          ? { blockers: value.blockers.trim() }
          : {}),
        ...(typeof value.decisions === "string" && value.decisions.trim()
          ? { decisions: value.decisions.trim() }
          : {}),
        ...(typeof value.nextWeek === "string" && value.nextWeek.trim()
          ? { nextWeek: value.nextWeek.trim() }
          : {}),
      }
    }
  }

  const workDayClosures: AppState["settings"]["workDayClosures"] = {}
  if (isRecord(raw.workDayClosures)) {
    for (const [date, value] of Object.entries(raw.workDayClosures)) {
      if (!isRecord(value) || typeof value.closedAt !== "string") continue
      workDayClosures[date] = {
        closedAt: value.closedAt,
        ...(typeof value.note === "string" && value.note.trim()
          ? { note: value.note.trim() }
          : {}),
      }
    }
  }

  return {
    theme,
    accentColor,
    workspaceMode,
    workInbox,
    dailyFocus,
    workDayClosures,
    workWipLimit,
    workWeeklyReviews,
  }
}

function looksLikeBaseAppState(raw: Record<string, unknown>): boolean {
  return (
    Array.isArray(raw.projects) &&
    Array.isArray(raw.habits) &&
    Array.isArray(raw.milestones) &&
    isRecord(raw.settings) &&
    typeof (raw.settings as Record<string, unknown>).theme === "string"
  )
}

/** Старые значения statType до универсальной системы из 18 статов. */
function mapLegacyStatType(value: unknown): CharacterStatType | undefined {
  switch (value) {
    case "education":
      return "intelligence"
    case "immigration":
      return "adventure"
    case "networking":
      return "social"
    case "documents":
      return "lifestyle"
    case "research":
      return "intelligence"
    case "portfolio":
      return "skills"
    case "adaptation":
      return "adventure"
    case "career":
      return "skills"
    default:
      return undefined
  }
}

/**
 * Только для миграции старых данных: угадывает statType у известных стартовых
 * проектов по заголовку. Не использовать в UI или при создании проектов.
 */
function inferDefaultStatTypeForSeedProject(
  project: Project,
): CharacterStatType | undefined {
  const title = project.title.toLowerCase()
  if (title.includes("uopeople")) return "intelligence"
  if (title.includes("android")) return "skills"
  if (title.includes("языков")) return "language"
  if (title.includes("immigration") || title.includes("иммиграц")) {
    return "adventure"
  }
  return undefined
}

function sanitizeProjectStatType(project: Project): Project {
  const st = project.statType

  if (st !== undefined && isCharacterStatType(st)) {
    return project
  }

  const next: Project = { ...project }

  if (st !== undefined) {
    const mapped = mapLegacyStatType(st)
    if (mapped !== undefined) {
      return { ...next, statType: mapped }
    }
    delete next.statType
  }

  const inferred = inferDefaultStatTypeForSeedProject(next)
  if (inferred !== undefined) {
    return { ...next, statType: inferred }
  }

  return next
}

function sanitizeProjectPhase(project: Project): Project {
  const ph = project.phase
  if (ph === undefined) return project
  if (isProjectPhase(ph)) return project
  const next: Project = { ...project }
  delete next.phase
  return next
}

function sanitizeProjectTargetDate(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined
  }

  const trimmed = value.trim()

  if (!DATE_ONLY_PATTERN.test(trimmed)) {
    return undefined
  }

  const parsed = Date.parse(`${trimmed}T00:00:00.000Z`)
  if (Number.isNaN(parsed)) {
    return undefined
  }

  return trimmed
}

function sanitizeProjectDateField(project: Project): Project {
  const nextDate = sanitizeProjectTargetDate(project.targetDate)
  if (nextDate === project.targetDate) {
    return project
  }
  const next: Project = { ...project }
  if (nextDate === undefined) {
    delete next.targetDate
    return next
  }
  next.targetDate = nextDate
  return next
}

function sanitizeGoalStatus(value: unknown): GoalStatus {
  if (value === "active" || value === "later" || value === "archived") {
    return value
  }
  return "active"
}

const LEGACY_IMPORTED_GOAL_ID = "goal-legacy-import"

function createLegacyImportedGoal(timestamp?: string): Goal {
  const now = timestamp ?? new Date().toISOString()
  return {
    id: LEGACY_IMPORTED_GOAL_ID,
    title: "Импортированная цель",
    description:
      "Автоматически создана при импорте старой резервной копии без системы целей.",
    status: "active",
    showOnDashboard: true,
    createdAt: now,
    updatedAt: now,
  }
}

function sanitizeGoal(raw: unknown): Goal | null {
  if (!isRecord(raw)) return null

  const id = typeof raw.id === "string" ? raw.id.trim() : ""
  const title = typeof raw.title === "string" ? raw.title.trim() : ""
  if (!id || !title) return null

  const description =
    typeof raw.description === "string" && raw.description.trim()
      ? raw.description.trim()
      : undefined

  const targetDate = sanitizeProjectTargetDate(raw.targetDate)
  const status = sanitizeGoalStatus(raw.status)
  const showOnDashboard =
    typeof raw.showOnDashboard === "boolean" ? raw.showOnDashboard : true
  const createdAt =
    typeof raw.createdAt === "string" && raw.createdAt.trim()
      ? raw.createdAt
      : new Date().toISOString()
  const updatedAt =
    typeof raw.updatedAt === "string" && raw.updatedAt.trim()
      ? raw.updatedAt
      : createdAt

  return {
    id,
    title,
    ...(description ? { description } : {}),
    ...(targetDate ? { targetDate } : {}),
    status,
    showOnDashboard,
    createdAt,
    updatedAt,
  }
}

function sanitizeGoals(
  rawGoals: unknown,
  version: 1 | 2,
  fallbackTimestamp?: string,
): Goal[] {
  const goalsRaw = Array.isArray(rawGoals) ? rawGoals : []
  const deduped: Goal[] = []
  const seen = new Set<string>()

  for (const raw of goalsRaw) {
    const goal = sanitizeGoal(raw)
    if (!goal || seen.has(goal.id)) continue
    seen.add(goal.id)
    deduped.push(goal)
  }

  if (version === 1 && deduped.length === 0) {
    deduped.push(createLegacyImportedGoal(fallbackTimestamp))
  }

  return deduped
}

function sanitizeProjectGoalId(
  project: Project,
  validGoalIds: Set<string>,
  fallbackGoalId?: string,
): Project {
  const currentGoalId = project.goalId
  if (
    typeof currentGoalId === "string" &&
    currentGoalId.trim() &&
    validGoalIds.has(currentGoalId.trim())
  ) {
    return { ...project, goalId: currentGoalId.trim() }
  }

  return { ...project, goalId: fallbackGoalId }
}

/** Убирает устаревшие поля внешнего вида проекта из старых сохранений и импорта JSON. */
function sanitizeProjectStripLegacyVisual(project: Project): Project {
  const extended = project as Project & { icon?: unknown; color?: unknown }
  if (extended.icon === undefined && extended.color === undefined) {
    return project
  }
  const next = { ...extended } as Record<string, unknown>
  delete next.icon
  delete next.color
  return next as unknown as Project
}

function sanitizeProjects(
  projects: Project[],
  validGoalIds: Set<string>,
  fallbackGoalId?: string,
): Project[] {
  return projects.map((p) =>
    sanitizeProjectGoalId(
      sanitizeProjectPhase(
        sanitizeProjectStatType(
          sanitizeProjectDateField(sanitizeProjectStripLegacyVisual(p)),
        ),
      ),
      validGoalIds,
      fallbackGoalId,
    ),
  )
}

export function migrateAppState(raw: unknown): AppState {
  if (!isRecord(raw)) return initialAppState
  if (typeof raw.version !== "number") return initialAppState
  if (!looksLikeBaseAppState(raw)) return initialAppState
  if (raw.version !== 1 && raw.version !== 2) return initialAppState

  const base = raw as {
    projects: Project[]
    habits: AppState["habits"]
    milestones: AppState["milestones"]
    settings: AppState["settings"]
    goals?: unknown
  }
  const fallbackTimestamp =
    base.projects.find((p) => typeof p.createdAt === "string")?.createdAt
  const version = raw.version as 1 | 2
  const goals = sanitizeGoals(base.goals, version, fallbackTimestamp)
  const validGoalIds = new Set(goals.map((goal) => goal.id))
  const fallbackGoalId =
    version === 1 ? goals[0]?.id : undefined

  return {
    version: 2,
    settings: sanitizeAppSettings(base.settings),
    goals,
    projects: sanitizeProjects(base.projects, validGoalIds, fallbackGoalId),
    habits: base.habits,
    milestones: base.milestones,
  }
}

/** Returns parsed state only if the payload is a valid v1/v2 backup; otherwise null. */
export function tryParseImportedAppState(raw: unknown): AppState | null {
  if (!isRecord(raw)) return null
  if (typeof raw.version !== "number") return null
  if (!looksLikeBaseAppState(raw)) return null
  if (raw.version !== 1 && raw.version !== 2) return null
  return migrateAppState(raw)
}
