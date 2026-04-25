import { isCharacterStatType } from "@/shared/lib/characterStats"
import { isProjectPhase } from "@/shared/lib/projectPhases"
import type {
  AppState,
  CharacterStatType,
  Goal,
  GoalStatus,
  Project,
} from "./appState.types"
import { CANADA_GOAL_ID, initialAppState } from "./initialState"

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
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

function createCanadaGoal(timestamp?: string): Goal {
  const now = timestamp ?? new Date().toISOString()
  return {
    id: CANADA_GOAL_ID,
    title: "Канада",
    description:
      "Подготовка к иммиграции в Канаду через английский, Android-разработку, образование, документы, финансы и Express Entry / PNP.",
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

function sanitizeGoals(rawGoals: unknown, fallbackTimestamp?: string): Goal[] {
  const goalsRaw = Array.isArray(rawGoals) ? rawGoals : []
  const deduped: Goal[] = []
  const seen = new Set<string>()

  for (const raw of goalsRaw) {
    const goal = sanitizeGoal(raw)
    if (!goal || seen.has(goal.id)) continue
    seen.add(goal.id)
    deduped.push(goal)
  }

  if (!seen.has(CANADA_GOAL_ID)) {
    deduped.unshift(createCanadaGoal(fallbackTimestamp))
  }

  return deduped
}

function sanitizeProjectGoalId(
  project: Project,
  validGoalIds: Set<string>,
  fallbackGoalId: string,
): Project {
  const currentGoalId = project.goalId
  if (
    typeof currentGoalId === "string" &&
    currentGoalId.trim() &&
    validGoalIds.has(currentGoalId)
  ) {
    return project
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
  fallbackGoalId: string,
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
  const goals = sanitizeGoals(base.goals, fallbackTimestamp)
  const validGoalIds = new Set(goals.map((goal) => goal.id))
  const fallbackGoalId = validGoalIds.has(CANADA_GOAL_ID)
    ? CANADA_GOAL_ID
    : goals[0]?.id ?? CANADA_GOAL_ID

  return {
    version: 2,
    settings: base.settings,
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
