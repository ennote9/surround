import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarGoalSwitcher } from "@/layouts/SidebarGoalSwitcher"
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  CircleUserRound,
  FolderKanban,
  Home,
  PanelLeftClose,
  PanelLeftOpen,
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
  end?: boolean
}

const items: NavItem[] = [
  { to: "/", label: "Главная", icon: Home, end: true },
  { to: "/goals", label: "Цели", icon: Target },
  { to: "/projects", label: "Проекты", icon: FolderKanban },
  { to: "/routine", label: "Рутина", icon: CalendarCheck },
  { to: "/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/guide", label: "Справочник", icon: BookOpen },
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
  const accountSubtitle = isAuthenticated ? "Профиль и безопасность" : "Авторизация"

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
          collapsed ? "gap-4 p-3" : "gap-5 px-4 py-5",
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
                className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-xs font-bold tracking-[0.08em] text-white shadow-sm dark:bg-white dark:text-slate-950"
                aria-hidden
              >
                LP
              </div>
            </>
          ) : (
            <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[11px] font-bold tracking-[0.08em] text-white shadow-sm dark:bg-white dark:text-slate-950">
                  LP
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold tracking-tight text-slate-950 dark:text-white">
                    Life Progress OS
                  </p>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    Система целей и прогресса
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                aria-label="Свернуть сайдбар"
                title="Свернуть сайдбар"
                onClick={onToggleCollapsed}
              >
                <PanelLeftClose className="size-4" aria-hidden />
              </Button>
            </div>
          )}
        </div>

        <SidebarGoalSwitcher collapsed={collapsed} />

        <Separator className="shrink-0 bg-slate-200 dark:bg-slate-800" />

        <nav className="flex min-w-0 flex-1 flex-col gap-1">
          {!collapsed ? (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-slate-500">
              Навигация
            </p>
          ) : null}
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

        <Separator className="shrink-0 bg-slate-200 dark:bg-slate-800" />

        <div className="mt-auto flex shrink-0 flex-col gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
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
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{accountSubtitle}</p>
              </div>
            ) : null}
          </NavLink>

          {collapsed ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="mx-auto text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              aria-label="Развернуть сайдбар"
              title="Развернуть сайдбар"
              onClick={onToggleCollapsed}
            >
              <PanelLeftOpen className="size-4" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
    </aside>
  )
}
