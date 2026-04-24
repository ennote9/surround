import type { ProjectPhase } from "@/store/appState.types"

export type ProjectPhaseConfig = {
  id: ProjectPhase
  title: string
  description: string
}

export const PROJECT_PHASES: ProjectPhaseConfig[] = [
  {
    id: "active",
    title: "Сейчас",
    description: "Проект в текущем фокусе.",
  },
  {
    id: "later",
    title: "Позже",
    description: "Проект запланирован, но не является текущим фокусом.",
  },
  {
    id: "strategic",
    title: "Стратегия",
    description: "Дальний стратегический этап или цель.",
  },
]

export function isProjectPhase(value: unknown): value is ProjectPhase {
  return value === "active" || value === "later" || value === "strategic"
}

export function getProjectPhaseTitle(phase: ProjectPhase | undefined): string {
  if (phase === "later") return "Позже"
  if (phase === "strategic") return "Стратегия"
  return "Сейчас"
}

export function getProjectPhaseDescription(
  phase: ProjectPhase | undefined,
): string {
  if (phase === "later") return "Запланировано на позже"
  if (phase === "strategic") return "Стратегическая цель"
  return "Текущий фокус"
}

export function getProjectPhaseBadgeClassName(
  phase: ProjectPhase | undefined,
): string {
  switch (phase) {
    case "later":
      return "rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200/80"
    case "strategic":
      return "rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-800 ring-1 ring-indigo-200/80"
    default:
      return "rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-800 ring-1 ring-blue-200/80"
  }
}
