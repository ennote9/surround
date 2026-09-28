import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Inbox,
  ListChecks,
  Plus,
  RotateCcw,
  Send,
  UserRound,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { getTodayISO } from "@/shared/lib/dates"
import { SELECTED_PROJECT_STORAGE_KEY } from "@/shared/lib/storageKeys"
import {
  getProjectContext,
  getTaskStatus,
  TASK_STATUS_OPTIONS,
} from "@/shared/lib/workManagement"
import type {
  Task,
  TaskStatus,
  WorkInboxItem,
} from "@/store/appState.types"
import { useAppState } from "@/store/useAppState"

type WorkTaskRef = {
  projectId: string
  projectTitle: string
  groupId: string
  groupTitle: string
  task: Task
}

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `work-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function TaskRow({
  item,
  focused,
  onStatusChange,
  onFollowUpChange,
  onAssigneeChange,
  onToggleFocus,
}: {
  item: WorkTaskRef
  focused: boolean
  onStatusChange: (status: TaskStatus) => void
  onFollowUpChange: (value?: string) => void
  onAssigneeChange: (value?: string) => void
  onToggleFocus: () => void
}) {
  const status = getTaskStatus(item.task)

  const openProject = () => {
    try {
      window.localStorage.setItem(
        SELECTED_PROJECT_STORAGE_KEY,
        JSON.stringify(item.projectId),
      )
    } catch {
      // local navigation hint is optional
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-semibold text-slate-950 dark:text-slate-100">
            {item.task.title}
          </p>
          <Link
            to="/projects"
            onClick={openProject}
            className="mt-1 inline-block truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            {item.projectTitle} · {item.groupTitle}
          </Link>
        </div>
        <button
          type="button"
          onClick={onToggleFocus}
          className={
            focused
              ? "shrink-0 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white"
              : "shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
          }
        >
          {focused ? "Фокус" : "+ Фокус"}
        </button>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <select
          value={status}
          onChange={(event) => onStatusChange(event.target.value as TaskStatus)}
          className="h-9 min-w-0 rounded-lg border border-slate-300 bg-white px-2.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          aria-label="Статус задачи"
        >
          {TASK_STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <Input
          type="date"
          value={item.task.followUpDate ?? ""}
          onChange={(event) => onFollowUpChange(event.target.value || undefined)}
          className="h-9 text-xs"
          aria-label="Дата контроля"
        />

        <Input
          defaultValue={item.task.assignee ?? ""}
          onBlur={(event) => onAssigneeChange(event.target.value.trim() || undefined)}
          className="h-9 text-xs"
          placeholder="Ответственный"
          aria-label="Ответственный"
        />
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        {item.task.deadline ? <span>Дедлайн: {item.task.deadline}</span> : null}
        {item.task.assignee ? <span>Ответственный: {item.task.assignee}</span> : null}
      </div>
    </div>
  )
}

export default function WorkPage() {
  const { state, dispatch } = useAppState()
  const todayISO = getTodayISO()
  const [inboxTitle, setInboxTitle] = useState("")
  const [focusCandidate, setFocusCandidate] = useState("")
  const [closureNote, setClosureNote] = useState(
    state.settings.workDayClosures?.[todayISO]?.note ?? "",
  )
  const [inboxTargets, setInboxTargets] = useState<Record<string, string>>({})

  const workProjects = useMemo(
    () => state.projects.filter((project) => getProjectContext(project) === "work"),
    [state.projects],
  )

  const workTasks = useMemo<WorkTaskRef[]>(
    () =>
      workProjects.flatMap((project) =>
        project.groups.flatMap((group) =>
          group.tasks.map((task) => ({
            projectId: project.id,
            projectTitle: project.title,
            groupId: group.id,
            groupTitle: group.title,
            task,
          })),
        ),
      ),
    [workProjects],
  )

  const activeTasks = workTasks.filter((item) => getTaskStatus(item.task) !== "done")
  const focusEligibleTasks = activeTasks.filter((item) => {
    const status = getTaskStatus(item.task)
    return status === "planned" || status === "in_progress" || status === "control"
  })
  const focusIds = state.settings.dailyFocus?.[todayISO] ?? []
  const focusTasks = focusIds
    .map((id) => focusEligibleTasks.find((item) => item.task.id === id))
    .filter((item): item is WorkTaskRef => Boolean(item))
    .slice(0, 3)

  const activeFocusIds = focusTasks.map((item) => item.task.id)
  const focusCandidates = focusEligibleTasks.filter(
    (item) => !activeFocusIds.includes(item.task.id),
  )
  const inboxItems = state.settings.workInbox ?? []
  const dayClosure = state.settings.workDayClosures?.[todayISO]

  const overdue = activeTasks.filter(
    (item) => item.task.deadline && item.task.deadline < todayISO,
  ).length
  const onControl = activeTasks.filter((item) => {
    const status = getTaskStatus(item.task)
    return (
      (status === "waiting" || status === "delegated" || status === "control") &&
      item.task.followUpDate !== undefined &&
      item.task.followUpDate <= todayISO
    )
  }).length

  const statusSections: Array<{ status: TaskStatus; title: string }> = [
    { status: "in_progress", title: "В работе" },
    { status: "waiting", title: "Жду ответ" },
    { status: "delegated", title: "Делегировано" },
    { status: "control", title: "На контроле" },
    { status: "planned", title: "Запланировано" },
  ]

  const updateSettings = (patch: Partial<typeof state.settings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { patch } })
  }

  const updateTask = (item: WorkTaskRef, patch: Partial<Task>) => {
    dispatch({
      type: "UPDATE_TASK",
      payload: {
        projectId: item.projectId,
        groupId: item.groupId,
        taskId: item.task.id,
        patch,
      },
    })
  }

  const addInboxItem = () => {
    const title = inboxTitle.trim()
    if (!title) return
    const item: WorkInboxItem = {
      id: makeId(),
      title,
      createdAt: new Date().toISOString(),
    }
    updateSettings({ workInbox: [item, ...inboxItems] })
    setInboxTitle("")
  }

  const removeInboxItem = (id: string) => {
    updateSettings({ workInbox: inboxItems.filter((item) => item.id !== id) })
  }

  const convertInboxItem = (item: WorkInboxItem) => {
    const target = inboxTargets[item.id]
    if (!target) return
    const [projectId, groupId] = target.split("::")
    if (!projectId || !groupId) return

    dispatch({
      type: "ADD_TASK",
      payload: {
        projectId,
        groupId,
        title: item.title,
        status: "planned",
      },
    })
    removeInboxItem(item.id)
  }

  const setFocus = (nextIds: string[]) => {
    updateSettings({
      dailyFocus: {
        ...(state.settings.dailyFocus ?? {}),
        [todayISO]: [...new Set(nextIds)].slice(0, 3),
      },
    })
  }

  const toggleFocus = (taskId: string) => {
    if (activeFocusIds.includes(taskId)) {
      setFocus(activeFocusIds.filter((id) => id !== taskId))
      return
    }
    if (activeFocusIds.length >= 3) return
    setFocus([...activeFocusIds, taskId])
  }

  const addSelectedFocus = () => {
    if (!focusCandidate || activeFocusIds.length >= 3) return
    toggleFocus(focusCandidate)
    setFocusCandidate("")
  }

  const closeDay = () => {
    updateSettings({
      workDayClosures: {
        ...(state.settings.workDayClosures ?? {}),
        [todayISO]: {
          closedAt: new Date().toISOString(),
          ...(closureNote.trim() ? { note: closureNote.trim() } : {}),
        },
      },
    })
  }

  const reopenDay = () => {
    const next = { ...(state.settings.workDayClosures ?? {}) }
    delete next[todayISO]
    updateSettings({ workDayClosures: next })
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <BriefcaseBusiness className="size-5" aria-hidden />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">
              Рабочий контур
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-3xl">
            Центр управления работой
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Что делать сейчас, что ждёт других и что нужно вернуть на контроль.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:w-auto">
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">{activeTasks.length}</p>
            <p className="text-[10px] text-slate-500">активных</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">{overdue}</p>
            <p className="text-[10px] text-slate-500">просрочено</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="text-lg font-semibold text-slate-950 dark:text-white">{onControl}</p>
            <p className="text-[10px] text-slate-500">контроль</p>
          </div>
        </div>
      </header>

      <section className="rounded-[24px] border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-500/20 dark:bg-blue-500/5 sm:p-5">
        <div className="flex items-center gap-2">
          <ListChecks className="size-5 text-blue-600 dark:text-blue-400" aria-hidden />
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">3 результата дня</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Не больше трёх задач, которые действительно должны сдвинуть день.
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {focusTasks.length === 0 ? (
            <p className="rounded-xl border border-dashed border-blue-200 p-3 text-sm text-slate-500 dark:border-blue-500/20 dark:text-slate-400">
              Фокус на сегодня ещё не выбран.
            </p>
          ) : (
            focusTasks.map((item, index) => (
              <div
                key={item.task.id}
                className="flex items-center gap-3 rounded-xl bg-white p-3 shadow-sm dark:bg-slate-900"
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-950 dark:text-white">
                    {item.task.title}
                  </p>
                  <p className="truncate text-xs text-slate-500">{item.projectTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFocus(item.task.id)}
                  className="text-xs font-medium text-slate-400 hover:text-red-500"
                >
                  убрать
                </button>
              </div>
            ))
          )}
        </div>

        {focusTasks.length < 3 && focusCandidates.length > 0 ? (
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <select
              value={focusCandidate}
              onChange={(event) => setFocusCandidate(event.target.value)}
              className="h-10 min-w-0 flex-1 rounded-xl border border-blue-200 bg-white px-3 text-sm text-slate-800 dark:border-blue-500/20 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="">Выбрать задачу…</option>
              {focusCandidates.map((item) => (
                <option key={item.task.id} value={item.task.id}>
                  {item.projectTitle} — {item.task.title}
                </option>
              ))}
            </select>
            <Button
              type="button"
              onClick={addSelectedFocus}
              disabled={!focusCandidate}
              className="bg-blue-600 text-white hover:bg-blue-700"
            >
              Добавить в фокус
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center gap-2">
          <Inbox className="size-5 text-slate-500" aria-hidden />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-slate-950 dark:text-white">Inbox</h2>
            <p className="text-xs text-slate-500">Сначала зафиксировать, потом разобрать.</p>
          </div>
          {inboxItems.length > 0 ? (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800">
              {inboxItems.length}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex gap-2">
          <Input
            value={inboxTitle}
            onChange={(event) => setInboxTitle(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") addInboxItem()
            }}
            placeholder="Например: проверить зависшие возвраты"
            className="min-w-0 flex-1"
          />
          <Button type="button" onClick={addInboxItem} disabled={!inboxTitle.trim()}>
            <Plus className="size-4" aria-hidden />
            <span className="hidden sm:inline">Добавить</span>
          </Button>
        </div>

        <div className="mt-4 space-y-2">
          {inboxItems.length === 0 ? (
            <p className="text-sm text-slate-400">Входящих нет.</p>
          ) : (
            inboxItems.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {item.title}
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <select
                    value={inboxTargets[item.id] ?? ""}
                    onChange={(event) =>
                      setInboxTargets((current) => ({
                        ...current,
                        [item.id]: event.target.value,
                      }))
                    }
                    className="h-9 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Выбрать проект и этап…</option>
                    {workProjects.flatMap((project) =>
                      project.groups.map((group) => (
                        <option
                          key={`${project.id}::${group.id}`}
                          value={`${project.id}::${group.id}`}
                        >
                          {project.title} — {group.title}
                        </option>
                      )),
                    )}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => convertInboxItem(item)}
                    disabled={!inboxTargets[item.id]}
                  >
                    <Send className="size-3.5" aria-hidden />
                    В задачу
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeInboxItem(item.id)}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950 dark:text-white">Рабочий поток</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Задачи в ожидании и делегировании не считаются текущей работой, пока не наступит контрольная дата.
          </p>
        </div>

        {workProjects.length === 0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 p-5 text-sm text-slate-500 dark:border-slate-700">
            Рабочих проектов пока нет. Создай проект и выбери для него контекст «Работа».
          </div>
        ) : (
          statusSections.map((section) => {
            const items = activeTasks.filter(
              (item) => getTaskStatus(item.task) === section.status,
            )
            if (items.length === 0) return null
            return (
              <div key={section.status} className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {section.title}
                  </h3>
                  <span className="text-xs text-slate-400">{items.length}</span>
                </div>
                <div className="grid gap-2.5 xl:grid-cols-2">
                  {items.map((item) => (
                    <TaskRow
                      key={item.task.id}
                      item={item}
                      focused={activeFocusIds.includes(item.task.id)}
                      onStatusChange={(status) => updateTask(item, { status })}
                      onFollowUpChange={(followUpDate) =>
                        updateTask(item, { followUpDate })
                      }
                      onAssigneeChange={(assignee) => updateTask(item, { assignee })}
                      onToggleFocus={() => toggleFocus(item.task.id)}
                    />
                  ))}
                </div>
              </div>
            )
          })
        )}
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
        <div className="flex items-center gap-2">
          {dayClosure ? (
            <CheckCircle2 className="size-5 text-emerald-600" aria-hidden />
          ) : (
            <Clock3 className="size-5 text-slate-500" aria-hidden />
          )}
          <div>
            <h2 className="font-semibold text-slate-950 dark:text-white">
              Закрытие рабочего дня
            </h2>
            <p className="text-xs text-slate-500">
              Зафиксируй хвосты и оставь работу внутри системы, а не в голове.
            </p>
          </div>
        </div>

        {dayClosure ? (
          <div className="mt-4 rounded-xl bg-emerald-50 p-4 dark:bg-emerald-500/10">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              Рабочий день закрыт
            </p>
            {dayClosure.note ? (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {dayClosure.note}
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={reopenDay}
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Открыть снова
            </Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <Textarea
              value={closureNote}
              onChange={(event) => setClosureNote(event.target.value)}
              placeholder="Например: жду ответ по поставщику; завтра первым делом проверить РЦ 780."
              rows={3}
            />
            <Button type="button" onClick={closeDay}>
              <CheckCircle2 className="size-4" aria-hidden />
              Закрыть рабочий день
            </Button>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1">
          <UserRound className="size-3.5" aria-hidden />
          Делегированные задачи остаются видимыми без попадания в текущую работу.
        </span>
      </div>
    </div>
  )
}
