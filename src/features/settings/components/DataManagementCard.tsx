import { useRef, useState, type ChangeEvent } from "react"
import { toast } from "sonner"
import { clearCloudAppData } from "@/shared/api/cloudClearAppData"
import { importAppStateIntoCloud } from "@/shared/api/cloudImportAppState"
import { useAuth } from "@/features/auth/useAuth"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  SELECTED_GOAL_STORAGE_KEY,
  SELECTED_PROJECT_STORAGE_KEY,
} from "@/shared/lib/storageKeys"
import { ALL_GOALS_SCOPE } from "@/shared/lib/selectedGoal"
import type { AppState } from "@/store/appState.types"
import { initialAppState } from "@/store/initialState"
import { tryParseImportedAppState } from "@/store/migrations"
import { useAppState } from "@/store/useAppState"

const BACKUP_FILENAME = "canada-progress-os-backup.json"

const CLOUD_IMPORT_CONFIRM =
  "Импорт заменит текущие облачные данные аккаунта. Это действие нельзя отменить. Рекомендуется заранее экспортировать backup. Продолжить?"

const CLOUD_CLEAR_CONFIRM =
  "Это удалит все текущие облачные данные аккаунта: цели, проекты, задачи, привычки, вехи и настройки приложения. Рекомендуется сначала экспортировать backup. Продолжить?"

const CLOUD_RESET_CONFIRM =
  "Это заменит текущие облачные данные стартовым набором. Рекомендуется сначала экспортировать backup. Продолжить?"

function createEmptyCloudAppState(): AppState {
  return {
    version: 2,
    goals: [],
    projects: [],
    habits: [],
    milestones: [],
    settings: structuredClone(initialAppState.settings),
  }
}

export function DataManagementCard() {
  const { state, dispatch } = useAppState()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [clearOpen, setClearOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [clearing, setClearing] = useState(false)
  const [resetting, setResetting] = useState(false)

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
      void (async () => {
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
          if (!user?.id) {
            toast.error("Нужно войти в аккаунт для импорта в облако.")
            return
          }
          if (!window.confirm(CLOUD_IMPORT_CONFIRM)) {
            return
          }

          setImporting(true)
          try {
            const result = await importAppStateIntoCloud(user.id, imported)
            if (result.error) {
              toast.error("Не удалось импортировать в облако", {
                description: result.error,
              })
              return
            }
            const nextState = result.data
            if (nextState === null) {
              toast.error("Не удалось импортировать в облако", {
                description: "Пустой ответ сервера.",
              })
              return
            }
            dispatch({ type: "IMPORT_STATE", payload: nextState })
            toast.success("Данные импортированы в облако и применены")
          } finally {
            setImporting(false)
          }
        } catch {
          toast.error("Ошибка при разборе JSON", {
            description: "Файл повреждён или не является корректным JSON.",
          })
        }
      })()
    }
    reader.onerror = () => {
      toast.error("Не удалось прочитать файл")
    }
    reader.readAsText(file, "UTF-8")
  }

  const resetSelectionStorage = () => {
    try {
      if (typeof window === "undefined" || !window.localStorage) return
      window.localStorage.setItem(
        SELECTED_GOAL_STORAGE_KEY,
        JSON.stringify(ALL_GOALS_SCOPE),
      )
      window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, JSON.stringify(""))
    } catch {
      // ignore quota / private mode
    }
  }

  const handleClearCurrentConfirm = async () => {
    if (!user?.id) {
      toast.error("Нужно войти в аккаунт, чтобы очистить облачные данные.")
      return
    }

    setClearing(true)
    try {
      const result = await clearCloudAppData(user.id)
      if (result.error) {
        toast.error("Не удалось очистить облачные данные", {
          description: result.error,
        })
        return
      }
      dispatch({ type: "IMPORT_STATE", payload: createEmptyCloudAppState() })
      resetSelectionStorage()
      setClearOpen(false)
      toast.success("Данные очищены.")
    } finally {
      setClearing(false)
    }
  }

  const handleResetConfirm = async () => {
    if (!user?.id) {
      toast.error("Нужно войти в аккаунт, чтобы сбросить облачные данные.")
      return
    }

    setResetting(true)
    try {
      const resetState = structuredClone(initialAppState)
      const result = await importAppStateIntoCloud(user.id, resetState)
      if (result.error) {
        toast.error("Не удалось сбросить данные", {
          description: result.error,
        })
        return
      }
      if (!result.data) {
        toast.error("Не удалось сбросить данные", {
          description: "Пустой ответ сервера.",
        })
        return
      }
      dispatch({ type: "IMPORT_STATE", payload: result.data })
      resetSelectionStorage()
      setResetOpen(false)
      toast.success("Данные сброшены.")
    } finally {
      setResetting(false)
    }
  }

  return (
    <>
      <div className="min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <h3 className="break-words text-lg font-semibold tracking-tight text-slate-950">
          Данные приложения
        </h3>
        <p className="mt-2 text-pretty text-sm text-slate-600">
          Экспортируйте резервную копию или импортируйте сохранённое состояние.
        </p>
        <p className="mt-2 text-pretty text-xs leading-relaxed break-words text-slate-500">
          Очистка и сброс работают в облаке Supabase: удаляются/заменяются данные
          аккаунта. Локальные UI-предпочтения в localStorage не очищаются.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-2 sm:flex sm:flex-row sm:flex-wrap sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="min-h-10 w-full border-slate-200 bg-white text-slate-950 hover:bg-slate-50 sm:w-auto sm:min-h-9"
            onClick={handleExportJson}
          >
            Экспорт JSON
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-10 w-full border-slate-200 bg-white text-slate-950 hover:bg-slate-50 sm:w-auto sm:min-h-9"
            aria-label="Импортировать JSON из файла"
            disabled={importing || clearing || resetting}
            onClick={handleImportClick}
          >
            {importing ? "Импортируем..." : "Импорт JSON"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-10 w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto sm:min-h-9"
            disabled={importing || clearing || resetting}
            onClick={() => setClearOpen(true)}
          >
            {clearing ? "Очищаем..." : "Очистить текущие данные"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-10 w-full border-red-200 text-red-700 hover:bg-red-50 sm:w-auto sm:min-h-9"
            disabled={importing || clearing || resetting}
            onClick={() => setResetOpen(true)}
          >
            {resetting ? "Сбрасываем..." : "Сбросить данные"}
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
        <AlertDialogContent className="max-w-[calc(100vw-1.5rem)] border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words text-slate-950">
              Очистить текущие данные?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-pretty break-words text-slate-600">
              Это удалит в облаке цели, проекты, группы, задачи, привычки, вехи и
              настройки приложения. Профиль и аккаунт не удаляются.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="[&_button]:min-h-10 sm:[&_button]:min-h-9">
            <AlertDialogCancel className="border-slate-200" disabled={clearing}>
              Отмена
            </AlertDialogCancel>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={clearing}
              onClick={() => {
                if (!window.confirm(CLOUD_CLEAR_CONFIRM)) return
                void handleClearCurrentConfirm()
              }}
            >
              {clearing ? "Очищаем..." : "Очистить"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent className="max-w-[calc(100vw-1.5rem)] border-slate-200 bg-white text-slate-950 sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="break-words text-slate-950">
              Сбросить все данные?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-pretty break-words text-slate-600">
              Текущие облачные данные будут заменены стартовым набором приложения.
              Это действие нельзя отменить.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="[&_button]:min-h-10 sm:[&_button]:min-h-9">
            <AlertDialogCancel className="border-slate-200" disabled={resetting}>
              Отмена
            </AlertDialogCancel>
            <Button
              type="button"
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={resetting}
              onClick={() => {
                if (!window.confirm(CLOUD_RESET_CONFIRM)) return
                void handleResetConfirm()
              }}
            >
              {resetting ? "Сбрасываем..." : "Сбросить"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
