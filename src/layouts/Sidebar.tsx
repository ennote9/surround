import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarGoalSwitcher } from "@/layouts/SidebarGoalSwitcher"
import {
  BarChart3,
  CalendarCheck,
  FolderKanban,
  Home,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react"
import { NavLink, Link } from "react-router-dom"
import { useAuth } from "@/features/auth/useAuth"
import { SaveStatusIndicator } from "@/shared/components/SaveStatusIndicator"

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const items: NavItem[] = [
  { to: "/", label: "Главная", icon: Home, end: true },
  { to: "/goals", label: "Цели", icon: Target },
  { to: "/projects", label: "Проекты", icon: FolderKanban },
  { to: "/routine", label: "Рутина", icon: CalendarCheck },
  { to: "/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/settings", label: "Настройки", icon: Settings },
]

export type SidebarProps = {
  collapsed: boolean
  onToggleCollapsed: () => void
}

function navLinkClassName({
  isActive,
  collapsed,
}: {
  isActive: boolean
  collapsed: boolean
}) {
  return cn(
    "flex items-center rounded-xl py-2.5 text-sm font-medium transition-colors",
    collapsed
      ? "w-full justify-center px-2"
      : "justify-start gap-3 px-3",
    isActive
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
  )
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { isAuthenticated, user } = useAuth()

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col overflow-x-hidden overflow-y-auto border-r border-slate-200 bg-white transition-[width] duration-200 ease-out lg:flex",
        collapsed ? "w-20" : "w-72",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col gap-6",
          collapsed ? "p-3" : "p-5",
        )}
      >
        <div
          className={cn(
            "flex items-start gap-2",
            collapsed && "flex-col items-center justify-center",
          )}
        >
          {collapsed ? (
            <>
              <span className="sr-only">Life Progress OS</span>
              <div
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold tracking-tight text-blue-700 ring-1 ring-blue-200"
                aria-hidden
              >
                LP
              </div>
            </>
          ) : (
            <div className="min-w-0 flex-1">
              <p className="text-lg font-semibold tracking-tight text-slate-950">
                Life Progress OS
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Система целей и прогресса
              </p>
            </div>
          )}
        </div>

        <SidebarGoalSwitcher collapsed={collapsed} />

        <Separator className="shrink-0 bg-slate-200" />

        <nav className="flex min-w-0 flex-1 flex-col gap-1">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={label}
              className={({ isActive }) =>
                navLinkClassName({ isActive, collapsed })
              }
            >
              <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
              {!collapsed ? (
                <span className="truncate">{label}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <Separator className="shrink-0 bg-slate-200" />

        <div className="mt-auto flex shrink-0 flex-col gap-3">
          <div className="space-y-2">
            <SaveStatusIndicator collapsed={collapsed} />
            <Button
              asChild
              type="button"
              variant="outline"
              size={collapsed ? "icon" : "default"}
              className={cn(
                "shrink-0 border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
                collapsed ? "mx-auto" : "w-full justify-center gap-2",
              )}
              title={isAuthenticated ? user?.email ?? "Аккаунт" : "Войти"}
            >
              <Link to="/auth">
                <LogIn className="size-4 shrink-0" aria-hidden />
                {!collapsed ? (
                  <span className="truncate">
                    {isAuthenticated ? "Аккаунт" : "Войти"}
                  </span>
                ) : null}
              </Link>
            </Button>
          </div>

          {!collapsed ? (
            <p className="text-xs leading-relaxed text-slate-500">
              Сохранение в аккаунте
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size={collapsed ? "icon" : "default"}
            className={cn(
              "shrink-0 border-slate-200 bg-white text-slate-950 hover:bg-slate-50",
              collapsed ? "mx-auto" : "w-full justify-center gap-2",
            )}
            aria-label={
              collapsed ? "Развернуть сайдбар" : "Свернуть сайдбар"
            }
            onClick={onToggleCollapsed}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-5" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-5 shrink-0" aria-hidden />
                <span>Свернуть</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  )
}
