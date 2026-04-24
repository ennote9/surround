import type { CharacterStatType, Project } from "@/store/appState.types"
import { getProjectTaskStats } from "@/store/selectors"

export type CharacterStatConfig = {
  id: CharacterStatType
  title: string
  shortTitle: string
  description: string
}

export const CHARACTER_STATS: CharacterStatConfig[] = [
  {
    id: "intelligence",
    title: "Интеллект",
    shortTitle: "INT",
    description: "Обучение, мышление, знания и анализ.",
  },
  {
    id: "language",
    title: "Язык",
    shortTitle: "LANG",
    description: "Иностранные языки, коммуникация и практика речи.",
  },
  {
    id: "focus",
    title: "Фокус",
    shortTitle: "FOCUS",
    description: "Концентрация, глубокая работа и отсутствие распыления.",
  },
  {
    id: "discipline",
    title: "Дисциплина",
    shortTitle: "DISC",
    description: "Режим, регулярность и выполнение плана.",
  },
  {
    id: "career",
    title: "Карьера",
    shortTitle: "CAREER",
    description: "Работа, рост, резюме, собеседования и повышение.",
  },
  {
    id: "skills",
    title: "Навыки",
    shortTitle: "SKILL",
    description: "Практические умения, hard skills и инструменты.",
  },
  {
    id: "finance",
    title: "Финансы",
    shortTitle: "FIN",
    description: "Доход, бюджет, накопления и финансовая устойчивость.",
  },
  {
    id: "entrepreneurship",
    title: "Предпринимательство",
    shortTitle: "BIZ",
    description: "Бизнес, продукты, продажи, клиенты и проекты.",
  },
  {
    id: "health",
    title: "Здоровье",
    shortTitle: "HP",
    description: "Общее состояние, профилактика и самочувствие.",
  },
  {
    id: "strength",
    title: "Сила",
    shortTitle: "STR",
    description: "Спорт, тренировки и физическая форма.",
  },
  {
    id: "energy",
    title: "Энергия",
    shortTitle: "EN",
    description: "Сон, восстановление, выносливость и ресурс.",
  },
  {
    id: "social",
    title: "Социальность",
    shortTitle: "SOC",
    description: "Общение, нетворкинг, связи и комьюнити.",
  },
  {
    id: "relationships",
    title: "Отношения",
    shortTitle: "REL",
    description: "Семья, партнёрство и близкие отношения.",
  },
  {
    id: "charisma",
    title: "Харизма",
    shortTitle: "CHA",
    description: "Самопрезентация, уверенность, публичность и влияние.",
  },
  {
    id: "creativity",
    title: "Творчество",
    shortTitle: "CREA",
    description: "Контент, дизайн, искусство, музыка и письмо.",
  },
  {
    id: "mindfulness",
    title: "Осознанность",
    shortTitle: "MIND",
    description: "Рефлексия, эмоциональная устойчивость и ментальное здоровье.",
  },
  {
    id: "lifestyle",
    title: "Быт",
    shortTitle: "LIFE",
    description: "Дом, порядок, рутина и организация жизни.",
  },
  {
    id: "adventure",
    title: "Приключения",
    shortTitle: "ADV",
    description: "Путешествия, переезды, новые опыты и адаптация.",
  },
]

const VALID_STAT_IDS = new Set<CharacterStatType>(
  CHARACTER_STATS.map((c) => c.id),
)

export function isCharacterStatType(value: unknown): value is CharacterStatType {
  return (
    typeof value === "string" &&
    VALID_STAT_IDS.has(value as CharacterStatType)
  )
}

export function getCharacterStatTitle(statType: CharacterStatType): string {
  return CHARACTER_STATS.find((c) => c.id === statType)?.title ?? statType
}

export function getCharacterStatLevel(progress: number): number {
  if (progress >= 100) return 5
  if (progress >= 75) return 4
  if (progress >= 50) return 3
  if (progress >= 25) return 2
  return 1
}

export function formatLinkedProjectsCount(n: number): string {
  if (n === 0) return "Нет привязанных проектов"
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return `${n} проект`
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${n} проекта`
  }
  return `${n} проектов`
}

export function getCharacterStatProgress(
  projects: Project[],
  statType: CharacterStatType,
): {
  total: number
  completed: number
  progress: number
  linkedProjects: number
} {
  const linked = projects.filter((p) => p.statType === statType)
  let total = 0
  let completed = 0
  for (const p of linked) {
    const s = getProjectTaskStats(p)
    total += s.total
    completed += s.completed
  }
  const progress = total === 0 ? 0 : Math.round((completed / total) * 100)
  return {
    total,
    completed,
    progress,
    linkedProjects: linked.length,
  }
}
