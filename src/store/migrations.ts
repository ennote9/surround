import { isCharacterStatType } from "@/shared/lib/characterStats"
import { isProjectPhase } from "@/shared/lib/projectPhases"
import type { AppState, CharacterStatType, Project } from "./appState.types"
import { initialAppState } from "./initialState"

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function looksLikeAppState(raw: Record<string, unknown>): boolean {
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

function sanitizeAppStateProjects(state: AppState): AppState {
  return {
    ...state,
    projects: state.projects.map((p) =>
      sanitizeProjectPhase(
        sanitizeProjectStatType(
          sanitizeProjectDateField(sanitizeProjectStripLegacyVisual(p)),
        ),
      ),
    ),
  }
}

export function migrateAppState(raw: unknown): AppState {
  if (!isRecord(raw)) return initialAppState
  if (typeof raw.version !== "number") return initialAppState
  if (!looksLikeAppState(raw)) return initialAppState
  if (raw.version === 1) {
    return sanitizeAppStateProjects(raw as AppState)
  }
  return initialAppState
}

/** Returns parsed state only if the payload is a valid v1 backup; otherwise null. */
export function tryParseImportedAppState(raw: unknown): AppState | null {
  if (!isRecord(raw)) return null
  if (typeof raw.version !== "number") return null
  if (!looksLikeAppState(raw)) return null
  if (raw.version !== 1) return null
  return sanitizeAppStateProjects(raw as AppState)
}
