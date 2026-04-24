import { useContext } from "react"
import { AppStateContext } from "./appStateContext"

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (ctx === null) {
    throw new Error("useAppState must be used within an AppStateProvider")
  }
  return ctx
}
