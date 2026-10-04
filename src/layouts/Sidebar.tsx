import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { WorkspaceContextSwitcher } from "@/shared/components/WorkspaceContextSwitcher"
import {
  CalendarCheck,
  CalendarDays,
  CircleUserRound,
  FolderKanban,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react"
import { NavLink } from "react-router-dom"
import { useAuth } from "@/features/auth/useAuth"

type NavItem = {
  to: string
  label: string
  icon: LucideIcon
}

const items: NavItem[] = [
  { to: "/goals", label: "Цели", icon: Target },
  { to: "/projects", label: "Проекты", icon: FolderKanban },
  { to: "/calendar", label: "Календарь", icon: CalendarDays },
  { to: "/routine", label: "Рутина", icon: CalendarCheck },
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
    "group relative flex min-h-10 items-center rounded-xl text-sm font-medium transition-all duration-150",
    collapsed
      ? "w-full justify-center px-2"
      : "justify-start gap-3 px-3",
    isActive
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
  )
}

export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const { isAuthenticated, user } = useAuth()
  const accountTitle = isAuthenticated ? "Аккаунт" : "Войти"
  const toggleLabel = collapsed ? "Развернуть боковую панель" : "Свернуть боковую панель"

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 hidden flex-col overflow-x-hidden overflow-y-auto border-r border-slate-200/80 bg-white transition-[width] duration-200 ease-out dark:border-slate-800 dark:bg-slate-900 lg:flex",
        collapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          collapsed ? "gap-4 p-3" : "gap-3 px-4 py-5",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 items-center gap-3",
            collapsed && "justify-center",
          )}
        >
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={toggleLabel}
            title={toggleLabel}
            aria-expanded={!collapsed}
            className={cn(
              "flex shrink-0 cursor-pointer items-center justify-center rounded-xl bg-slate-950 font-bold tracking-[0.08em] text-white shadow-sm transition-opacity hover:opacity-85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:bg-white dark:text-slate-950 dark:focus-visible:ring-offset-slate-900",
              collapsed ? "size-10 text-xs" : "size-9 text-[11px]",
            )}
          >
            LP
          </button>
          {collapsed ? (
            <span className="sr-only">Life Progress OS</span>
          ) : (
            <p className="min-w-0 truncate text-[15px] font-semibold tracking-tight text-slate-950 dark:text-white">
              Life Progress OS
            </p>
          )}
        </div>

        {!collapsed ? <WorkspaceContextSwitcher compact /> : null}

        <Separator className="shrink-0 bg-slate-200 dark:bg-slate-800" />

        <nav aria-label="Навигация" className="flex min-w-0 flex-1 flex-col gap-1">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
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

        <Separator className="shrink-0 bg-slate-200 dark:bg-slate-800" />

        <div className="mt-auto flex shrink-0 flex-col border-t border-slate-200 pt-4 dark:border-slate-800">
          <NavLink
            to={isAuthenticated ? "/profile" : "/auth"}
            end={!isAuthenticated}
            title={isAuthenticated ? user?.email ?? "Аккаунт" : "Аккаунт и профиль"}
            aria-label="Аккаунт и профиль"
            className={({ isActive }) =>
              cn(
                "rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                isActive
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-100 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100",
                collapsed
                  ? "mx-auto inline-flex size-10 items-center justify-center"
                  : "flex w-full items-center gap-3 px-3 py-2.5",
              )
            }
          >
            <CircleUserRound className="size-5 shrink-0 opacity-90" aria-hidden />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{accountTitle}</p>
                {!isAuthenticated ? (
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">Авторизация</p>
                ) : null}
              </div>
            ) : null}
          </NavLink>
        </div>
      </div>
    </aside>
  )
}
