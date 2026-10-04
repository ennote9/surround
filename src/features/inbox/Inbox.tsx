import { useState } from "react"
import { addDays, format } from "date-fns"
import { Inbox as InboxIcon, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getProjectContext } from "@/shared/lib/workManagement"
import type {
  LifeContext,
  Task,
  WorkInboxItem,
  WorkspaceMode,
} from "@/store/appState.types"
import { useAppState } from "@/store/useAppState"

function makeId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID()
  }
  return `inbox-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function getInboxContext(item: WorkInboxItem): LifeContext {
  return item.context === "personal" ? "personal" : "work"
}

type InboxProps = {
  /** Fixed context overrides workspaceMode; omitted on the home page. */
  context?: LifeContext
}

export function Inbox({ context: fixedContext }: InboxProps) {
  const { state, dispatch } = useAppState()
  const mode: WorkspaceMode = fixedContext ?? state.settings.workspaceMode ?? "all"
  const allInboxItems = state.settings.workInbox ?? []
  const visibleInboxItems = allInboxItems.filter((item) => {
    if (mode === "all") return true
    return getInboxContext(item) === mode
  })

  const [inboxTitle, setInboxTitle] = useState("")
  const [captureContext, setCaptureContext] = useState<LifeContext>("work")
  const [inboxTargets, setInboxTargets] = useState<Record<string, string>>({})
  const [inboxPriorities, setInboxPriorities] = useState<
    Record<string, Task["priority"]>
  >({})
  const [inboxDeadlines, setInboxDeadlines] = useState<Record<string, string>>({})

  const effectiveCaptureContext: LifeContext =
    mode === "personal" ? "personal" : mode === "work" ? "work" : captureContext

  const updateSettings = (patch: Partial<typeof state.settings>) => {
    dispatch({ type: "UPDATE_SETTINGS", payload: { patch } })
  }

  const addInboxItem = () => {
    const title = inboxTitle.trim()
    if (!title) return
    const item: WorkInboxItem = {
      id: makeId(),
      title,
      createdAt: new Date().toISOString(),
      context: effectiveCaptureContext,
    }
    updateSettings({ workInbox: [item, ...allInboxItems] })
    setInboxTitle("")
    toast.success("Добавлено во входящие")
  }

  const removeInboxItem = (id: string) => {
    updateSettings({
      workInbox: allInboxItems.filter((item) => item.id !== id),
    })
    setInboxTargets((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    setInboxPriorities((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
    setInboxDeadlines((current) => {
      const next = { ...current }
      delete next[id]
      return next
    })
  }

  const convertInboxItem = (item: WorkInboxItem, deadlineOverride?: string) => {
    const target = inboxTargets[item.id]
    if (!target) {
      toast.info("Выбери проект и этап")
      return
    }
    const [projectId, groupId] = target.split("::")
    const project = state.projects.find((candidate) => candidate.id === projectId)
    if (!project || getProjectContext(project) !== getInboxContext(item)) {
      toast.error("Проект не соответствует контексту входящего")
      return
    }
    const group = project.groups.find((candidate) => candidate.id === groupId)
    if (!group) return

    dispatch({
      type: "ADD_TASK",
      payload: {
        projectId,
        groupId,
        title: item.title,
        status: "planned",
        priority: inboxPriorities[item.id] ?? "medium",
        deadline: (deadlineOverride ?? inboxDeadlines[item.id]) || undefined,
      },
    })
    removeInboxItem(item.id)
    toast.success("Входящее превращено в задачу")
  }

  return (
    <section
      id={fixedContext === "work" ? "work-inbox" : undefined}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex items-center gap-2">
        <InboxIcon className="size-4 shrink-0 text-slate-500" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            Быстрый Inbox
          </p>
          <p className="truncate text-[10px] text-slate-400">
            Зафиксировать сейчас, разобрать позже.
          </p>
        </div>
        {visibleInboxItems.length > 0 ? (
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            {visibleInboxItems.length}
          </span>
        ) : null}
      </div>

      {mode === "all" ? (
        <div className="mt-2 flex gap-1" role="group" aria-label="Контекст входящего">
          {([
            ["work", "Работа"],
            ["personal", "Личное"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              aria-pressed={captureContext === value}
              onClick={() => setCaptureContext(value)}
              className={
                captureContext === value
                  ? "rounded-lg bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white dark:bg-white dark:text-slate-950"
                  : "rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400"
              }
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex gap-2">
        <Input
          aria-label="Новое входящее"
          value={inboxTitle}
          onChange={(event) => setInboxTitle(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") addInboxItem()
          }}
          placeholder={
            effectiveCaptureContext === "work"
              ? "Новая рабочая задача или запрос…"
              : "Мысль, задача или идея…"
          }
          className="h-9 min-w-0 flex-1 text-sm"
        />
        <Button
          type="button"
          aria-label="Добавить во входящие"
          size="sm"
          onClick={addInboxItem}
          disabled={!inboxTitle.trim()}
          className="h-9 px-3"
        >
          <Plus className="size-4" aria-hidden />
          <span className="hidden sm:inline">Добавить</span>
        </Button>
      </div>

      {visibleInboxItems.length > 0 ? (
        <details className="mt-2 rounded-xl border border-slate-100 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-950/40">
          <summary className="cursor-pointer px-3 py-2 text-[11px] font-medium text-slate-500">
            Разобрать входящие · {visibleInboxItems.length}
          </summary>
          <div className="space-y-2 border-t border-slate-100 p-2 dark:border-slate-800">
            {visibleInboxItems.map((item) => {
              const context = getInboxContext(item)
              const projectOptions = state.projects.filter(
                (project) => getProjectContext(project) === context,
              )
              return (
                <div
                  key={item.id}
                  className="rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className={
                        context === "work"
                          ? "rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-semibold text-blue-700 dark:bg-blue-500/10 dark:text-blue-300"
                          : "rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-semibold text-violet-700 dark:bg-violet-500/10 dark:text-violet-300"
                      }
                    >
                      {context === "work" ? "Работа" : "Личное"}
                    </span>
                    <p className="min-w-0 flex-1 truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                      {item.title}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeInboxItem(item.id)}
                      className="shrink-0 text-[10px] text-slate-400 hover:text-red-500"
                    >
                      удалить
                    </button>
                  </div>
                  <div className="mt-2 grid gap-1.5 sm:grid-cols-[minmax(180px,1fr)_110px_140px_auto]">
                    <select
                      aria-label={`Проект и этап для: ${item.title}`}
                      value={inboxTargets[item.id] ?? ""}
                      onChange={(event) =>
                        setInboxTargets((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      className="h-8 min-w-0 rounded-lg border border-slate-300 bg-white px-2 text-[11px] dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="">Проект и этап…</option>
                      {projectOptions.flatMap((project) =>
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
                    <select
                      aria-label={`Приоритет для: ${item.title}`}
                      value={inboxPriorities[item.id] ?? "medium"}
                      onChange={(event) =>
                        setInboxPriorities((current) => ({
                          ...current,
                          [item.id]: event.target.value as Task["priority"],
                        }))
                      }
                      className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-[11px] dark:border-slate-700 dark:bg-slate-950"
                    >
                      <option value="low">Низкий</option>
                      <option value="medium">Средний</option>
                      <option value="high">Высокий</option>
                    </select>
                    <Input
                      type="date"
                      aria-label={`Дедлайн для: ${item.title}`}
                      value={inboxDeadlines[item.id] ?? ""}
                      onChange={(event) =>
                        setInboxDeadlines((current) => ({
                          ...current,
                          [item.id]: event.target.value,
                        }))
                      }
                      className="h-8 text-[11px]"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => convertInboxItem(item)}
                        disabled={!inboxTargets[item.id]}
                        className="h-8"
                      >
                        В задачу
                      </Button>
                      {fixedContext === "work" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            convertInboxItem(item, format(addDays(new Date(), 1), "yyyy-MM-dd"))
                          }
                          disabled={!inboxTargets[item.id]}
                          className="h-8"
                        >
                          Завтра
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </details>
      ) : null}
    </section>
  )
}
