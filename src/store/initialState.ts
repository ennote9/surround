import { createId } from "@/shared/lib/ids"
import type {
  AppState,
  CharacterStatType,
  Habit,
  Project,
  Task,
  TaskGroup,
} from "./appState.types"

const now = new Date().toISOString()

function makeTask(
  groupId: string,
  projectId: string,
  title: string,
): Task {
  const id = createId("task")
  return {
    id,
    groupId,
    projectId,
    title,
    completed: false,
    createdAt: now,
    updatedAt: now,
  }
}

function makeGroup(
  projectId: string,
  title: string,
  order: number,
  taskTitles: string[],
): TaskGroup {
  const id = createId("group")
  const tasks = taskTitles.map((t) => makeTask(id, projectId, t))
  return {
    id,
    projectId,
    title,
    tasks,
    order,
    createdAt: now,
    updatedAt: now,
  }
}

function makeProject(
  title: string,
  groupTitle: string,
  taskTitles: string[],
  statType?: CharacterStatType,
): Project {
  const id = createId("project")
  const group = makeGroup(id, groupTitle, 0, taskTitles)
  return {
    id,
    title,
    showOnDashboard: true,
    ...(statType !== undefined ? { statType } : {}),
    groups: [group],
    createdAt: now,
    updatedAt: now,
  }
}

function makeHabit(name: string): Habit {
  return {
    id: createId("habit"),
    name,
    dailyStatus: {},
    createdAt: now,
    updatedAt: now,
  }
}

export const initialAppState: AppState = {
  version: 1,
  settings: {
    theme: "light",
    accentColor: "#4a86e8",
  },
  projects: [
    makeProject(
      "🎓 UoPeople",
      "Поступление",
      [
        "Пройти 8 модулей Duolingo",
        "Сдать DET на 105+",
        "Подготовить документы для поступления",
      ],
      "intelligence",
    ),
    makeProject(
      "⚔️ Android-разработка",
      "Портфолио",
      ["Собрать pet-проект на Kotlin", "Оформить GitHub README"],
      "skills",
    ),
    makeProject(
      "🛡️ Языковая подготовка",
      "English",
      [
        "Ежедневная практика listening",
        "Ежедневная практика speaking",
      ],
      "language",
    ),
    makeProject(
      "🇨🇦 Иммиграционные процедуры",
      "Документы",
      [
        "Собрать список документов",
        "Проверить требования по программе",
      ],
      "adventure",
    ),
  ],
  habits: [
    makeHabit("Duolingo / English practice"),
    makeHabit("Android coding"),
    makeHabit("Reading / Study"),
  ],
  milestones: [],
}
