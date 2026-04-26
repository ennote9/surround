import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { Goal } from "@/store/appState.types"

export type DeleteGoalDialogProps = {
  open: boolean
  goal: Goal | null
  projectCount: number
  onOpenChange: (open: boolean) => void
  onDeleteGoalOnly: () => Promise<void>
  onDeleteWithProjects: () => Promise<void>
  loading?: boolean
  error?: string | null
}

export function DeleteGoalDialog({
  open,
  goal,
  projectCount,
  onOpenChange,
  onDeleteGoalOnly,
  onDeleteWithProjects,
  loading = false,
  error = null,
}: DeleteGoalDialogProps) {
  const busy = Boolean(loading)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && busy) return
        onOpenChange(next)
      }}
    >
      <DialogContent
        showCloseButton={!busy}
        className={cn(
          "flex max-h-[90vh] w-full max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden border-slate-200 bg-white p-0 text-slate-950 sm:max-w-lg",
        )}
      >
        {goal ? (
          <>
            <DialogHeader className="shrink-0 space-y-2 border-b border-slate-100 px-5 py-4 text-left">
              <DialogTitle className="text-lg text-slate-950">
                Удалить цель «{goal.title}»?
              </DialogTitle>
              <DialogDescription className="text-left text-slate-600">
                Выберите, что сделать с проектами внутри этой цели.
              </DialogDescription>
              <p className="text-sm font-medium text-slate-800">
                {projectCount > 0 ? (
                  <>Проектов внутри цели: {projectCount}</>
                ) : (
                  <>В этой цели нет проектов.</>
                )}
              </p>
            </DialogHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
              {error ? (
                <p
                  role="alert"
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                >
                  {error}
                </p>
              ) : null}

              <div className="flex flex-col gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                  <h3 className="text-base font-semibold text-slate-950">
                    Удалить только цель
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Проекты, группы и задачи останутся, но будут отвязаны от этой
                    цели. Вехи, привязанные только к цели, будут удалены.
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={busy}
                    className="mt-4 h-10 w-full border-0 bg-red-600 text-white hover:bg-red-700 sm:w-auto"
                    onClick={() => void onDeleteGoalOnly()}
                  >
                    {busy ? "Удаляем..." : "Удалить только цель"}
                  </Button>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
                  <h3 className="text-base font-semibold text-slate-950">
                    Удалить вместе с проектами и задачами
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    {projectCount === 0 ? (
                      <>
                        В этой цели нет проектов. Будут удалены цель и связанные
                        с ней вехи уровня цели. Это действие нельзя отменить.
                      </>
                    ) : (
                      <>
                        Будут удалены цель, все проекты внутри неё, группы задач,
                        задачи и связанные вехи. Это действие нельзя отменить.
                      </>
                    )}
                  </p>
                  <Button
                    type="button"
                    disabled={busy}
                    className="mt-4 h-10 w-full border-0 bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-600 sm:w-auto"
                    onClick={() => void onDeleteWithProjects()}
                  >
                    {busy ? "Удаляем..." : "Удалить всё"}
                  </Button>
                </div>
              </div>
            </div>

            <DialogFooter className="shrink-0 flex-col gap-2 border-t border-slate-200 bg-slate-50/90 px-5 py-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 min-h-10 w-full border-slate-300 sm:w-auto"
                disabled={busy}
                onClick={() => onOpenChange(false)}
              >
                Отмена
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
