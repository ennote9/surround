export type ProjectGroupsCollapseMode =
  | "expanded"
  | "collapsed"
  | "smart"
  | "remember-per-project"

export const DEFAULT_PROJECT_GROUPS_COLLAPSE_MODE: ProjectGroupsCollapseMode =
  "smart"

export const PROJECT_GROUPS_COLLAPSE_MODE_OPTIONS: Array<{
  value: ProjectGroupsCollapseMode
  label: string
  description: string
}> = [
  {
    value: "expanded",
    label: "Всегда раскрывать",
    description: "При открытии проекта все группы задач будут раскрыты.",
  },
  {
    value: "collapsed",
    label: "Всегда сворачивать",
    description: "При открытии проекта все группы задач будут свернуты.",
  },
  {
    value: "smart",
    label: "Умно: сворачивать большие проекты",
    description:
      "Если в проекте больше 3 групп, они будут свернуты. Маленькие проекты будут раскрыты.",
  },
  {
    value: "remember-per-project",
    label: "Запоминать отдельно для каждого проекта",
    description:
      "Приложение будет запоминать раскрытые и свернутые группы отдельно для каждого проекта.",
  },
]

export function isProjectGroupsCollapseMode(
  value: unknown,
): value is ProjectGroupsCollapseMode {
  return (
    value === "expanded" ||
    value === "collapsed" ||
    value === "smart" ||
    value === "remember-per-project"
  )
}

export function normalizeProjectGroupsCollapseMode(
  value: unknown,
): ProjectGroupsCollapseMode {
  return isProjectGroupsCollapseMode(value)
    ? value
    : DEFAULT_PROJECT_GROUPS_COLLAPSE_MODE
}
