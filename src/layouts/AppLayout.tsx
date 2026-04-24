import { cn } from "@/lib/utils"
import { useLocalStorage } from "@/shared/hooks/useLocalStorage"
import { Outlet } from "react-router-dom"
import { MobileNav } from "./MobileNav"
import { Sidebar } from "./Sidebar"

const SIDEBAR_COLLAPSED_KEY = "canada-progress-os-sidebar-collapsed"

export function AppLayout() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage<boolean>(
    SIDEBAR_COLLAPSED_KEY,
    false,
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <Sidebar
        collapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((value) => !value)}
      />
      <div
        className={cn(
          "min-h-screen transition-[padding] duration-200 ease-out",
          isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72",
        )}
      >
        <MobileNav />
        <main className="px-4 py-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
