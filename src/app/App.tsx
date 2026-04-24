import { AppStateProvider } from "@/store/AppStateProvider"
import { RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"
import { router } from "./router"

export default function App() {
  return (
    <AppStateProvider>
      <>
        <RouterProvider router={router} />
        <Toaster richColors position="top-right" />
      </>
    </AppStateProvider>
  )
}
