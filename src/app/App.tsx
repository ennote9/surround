import { AuthProvider } from "@/features/auth/AuthProvider"
import { ProtectedApp } from "@/features/auth/ProtectedApp"
import { CloudStateGate } from "@/shared/api/CloudStateGate"
import { AppStateProvider } from "@/store/AppStateProvider"
import { RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"
import { router } from "./router"

export default function App() {
  return (
    <AuthProvider>
      <>
        <ProtectedApp>
          <CloudStateGate>
            {(initialState, userId) => (
              <AppStateProvider
                initialState={initialState}
                persistenceMode="memory"
                cloudSaveMode="goals-projects-tasks-habits-milestones-settings"
                userId={userId}
              >
                <RouterProvider router={router} />
              </AppStateProvider>
            )}
          </CloudStateGate>
        </ProtectedApp>
        <Toaster richColors position="top-right" />
      </>
    </AuthProvider>
  )
}
