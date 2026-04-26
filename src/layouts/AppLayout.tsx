import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import { SIDEBAR_COLLAPSED_STORAGE_KEY } from "@/shared/lib/storageKeys"
import { Outlet } from "react-router-dom"
import { MobileBottomNavigation } from "./MobileBottomNavigation"
import { MobileNav } from "./MobileNav"
import { Sidebar } from "./Sidebar"

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage<boolean>(
    SIDEBAR_COLLAPSED_STORAGE_KEY,
    false,
  )

  return (
    <div className="min-h-screen min-w-0 bg-slate-50 text-slate-950">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
      />
      <div
        className={cn(
          "min-h-screen min-w-0 w-full max-w-full overflow-x-hidden transition-[padding] duration-200 ease-out",
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72",
        )}
      >
        <MobileNav />
        <main
          className={cn(
            "min-w-0 w-full max-w-full px-4 pt-6 lg:px-8 lg:py-8",
            /* ~pb-24 + safe area: clears fixed bottom bar (4rem + inset) + breathing room */
            "pb-[calc(6rem+env(safe-area-inset-bottom,0px))] lg:pb-8",
          )}
        >
          <Outlet />
        </main>
        <MobileBottomNavigation />
      </div>
    </div>
  )
}
