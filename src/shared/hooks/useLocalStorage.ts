import { useCallback, useState } from "react"

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
  } catch {
    // ignore quota / private mode
  }
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() =>
    readStorage(key, initialValue),
  )

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = typeof value === "function" ? (value as (p: T) => T)(prev) : value
        writeStorage(key, next)
        return next
      })
    },
    [key],
  )

  return [stored, setValue]
}
