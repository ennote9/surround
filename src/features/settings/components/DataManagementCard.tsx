import { useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DASHBOARD_STAT_VISIBILITY_STORAGE_KEY,
  DASHBOARD_WIDGETS_STORAGE_KEY,
  SELECTED_PROJECT_STORAGE_KEY,
} from "@/shared/lib/storageKeys"
import type { AppState } from "@/store/appState.types"
import { createInitialCanadaGoal } from "@/store/initialState"
import { tryParseImportedAppState } from "@/store/migrations"
import { useAppState } from "@/store/useAppState"

const BACKUP_FILENAME = "canada-progress-os-backup.json"

const DEFAULT_SETTINGS: AppState["settings"] = {
  theme: "light",
  accentColor: "#4a86e8",
}

export function DataManagementCard() {
  const { state, dispatch } = useAppState()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)

  const handleExportJson = () => {
    let url: string | undefined
    try {
      const json = JSON.stringify(state, null, 2)
      const blob = new Blob([json], { type: "application/json;charset=utf-8" })
      url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = BACKUP_FILENAME
      link.rel = "noopener"
      document.body.appendChild(link)
      link.click()
      link.remove()

      // Синхронный revoke сразу после click() часто обрывает загрузку в браузере
      const revokeUrl = url
      setTimeout(() => {
        URL.revokeObjectURL(revokeUrl)
      }, 250)

      toast.success("Резервная копия экспортирована", {
        description: `Файл ${BACKUP_FILENAME}`,
      })
    } catch (error) {
      if (url) URL.revokeObjectURL(url)
      console.error("Failed to export app state", error)
      toast.error("Не удалось экспортировать данные")
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const text = reader.result
        if (typeof text !== "string") {
          toast.error("Не удалось прочитать файл")
          return
        }
        const parsed: unknown = JSON.parse(text)
        const imported = tryParseImportedAppState(parsed)
        if (!imported) {
          toast.error("Неверный формат резервной копии", {
            description:
              "Убедитесь, что выбран JSON-файл, экспортированный из этого приложения.",
          })
          return
        }
        dispatch({ type: "IMPORT_STATE", payload: imported })
        toast.success("Данные импортированы")
      } catch {
        toast.error("Ошибка при разборе JSON", {
          description: "Файл повреждён или не является корректным JSON.",
        })
      }
    }
    reader.onerror = () => {
      toast.error("Не удалось прочитать файл")
    }
    reader.readAsText(file, "UTF-8")
  }

  const handleResetConfirm = () => {
    dispatch({ type: "RESET_STATE" })
    setResetOpen(false)
    toast.success("Данные сброшены", {
      description: "Приложение возвращено к начальному состоянию.",
    })
  }

  const handleClearCurrentConfirm = () => {
    const settings =
      state.settings &&
      typeof state.settings.theme === "string" &&
      typeof state.settings.accentColor === "string"
        ? state.settings
        : DEFAULT_SETTINGS

    const emptyState: AppState = {
      version: 2,
      settings,
      goals: [createInitialCanadaGoal()],
      projects: [],
      habits: [],
      milestones: [],
    }

    dispatch({ type: "IMPORT_STATE", payload: emptyState })

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
      window.localStorage.removeItem(DASHBOARD_WIDGETS_STORAGE_KEY)
      window.localStorage.removeItem(DASHBOARD_STAT_VISIBILITY_STORAGE_KEY)
    }

    setClearOpen(false)
    toast.success("Текущие данные очищены", {
      description: "Теперь можно импортировать seed JSON.",
    })
  }

  return (
    <>
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight text-slate-950">
          Данные приложения
        </h3>
        <p className="mt-2 text-sm text-slate-600">
          Экспортируйте резервную копию или импортируйте сохранённое состояние.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-500">
          Очистка удаляет текущие проекты и рутины без возврата к стартовым данным.
          Используйте перед импортом нового seed.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 bg-white text-slate-950 hover:bg-slate-50"
            onClick={handleExportJson}
          >
            Экспорт JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-slate-200 bg-white text-slate-950 hover:bg-slate-50"
            aria-label="Импортировать JSON из файла"
            onClick={handleImportClick}
          >
            Импорт JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => setClearOpen(true)}
          >
            Очистить текущие данные
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => setResetOpen(true)}
          >
            Сбросить данные
          </Button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="sr-only"
          tabIndex={-1}
          onChange={handleFileChange}
        />
      </div>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Очистить текущие данные?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Будут удалены текущие проекты, задачи, рутины и milestones. После этого
              можно импортировать подготовленный seed JSON. Перед очисткой убедитесь,
              что вы сделали экспорт резервной копии.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200">Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleClearCurrentConfirm}
            >
              Очистить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Сбросить все данные?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              Проекты, задачи, привычки и вехи будут заменены начальным состоянием
              приложения. Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-200">Отмена</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={handleResetConfirm}
            >
              Сбросить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
