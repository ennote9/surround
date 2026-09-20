import { useCallback, useEffect, useState } from "react"

const LOCAL_STORAGE_SYNC_EVENT = "life-progress-os:local-storage-sync"

function readStorage<T>(key: string, initialValue: T): T {
  try {
    if (typeof window === "undefined" || !window.localStorage) {
      return initialValue
    }
    const item = window.localStorage.getItem(key)
    if (item === null) return initialValue
    return JSON.parse(item) as T
  } catch {
    return initialValue
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    if (typeof window === "undefined" || !window.localStorage) return
    window.localStorage.setItem(key, JSON.stringify(value))
    window.dispatchEvent(
      new CustomEvent(LOCAL_STORAGE_SYNC_EVENT, { detail: { key } }),
    )
  } catch {
    // ignore quota / private mode
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => readStorage(key, initialValue))

  useEffect(() => {
    const syncFromStorage = () => {
      setStored(readStorage(key, initialValue))
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.storageArea === window.localStorage && event.key === key) {
        syncFromStorage()
      }
    }

    const handleSameTabSync = (event: Event) => {
      const detail = (event as CustomEvent<{ key?: string }>).detail
      if (detail?.key === key) {
        syncFromStorage()
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(LOCAL_STORAGE_SYNC_EVENT, handleSameTabSync)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(LOCAL_STORAGE_SYNC_EVENT, handleSameTabSync)
    }
  }, [key, initialValue])

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next =
          typeof value === "function" ? (value as (p: T) => T)(prev) : value
        writeStorage(key, next)
        return next
      })
    },
    [key],
  )

  return [stored, setValue]
}
