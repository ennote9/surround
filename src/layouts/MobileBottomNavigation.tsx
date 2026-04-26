import { useCallback, useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  BarChart3,
  CalendarCheck,
  FolderKanban,
  Home,
  Menu,
  Settings,
  Target,
  User,
} from "lucide-react"
import { cn } from "@/lib/utils"

const MORE_MENU_ID = "mobile-more-menu"

type MainItem = {
  to: string
  title: string
  icon: typeof Home
  end?: boolean
}

const mainItems: MainItem[] = [
  { to: "/", title: "Главная", icon: Home, end: true },
  { to: "/goals", title: "Цели", icon: Target },
  { to: "/projects", title: "Проекты", icon: FolderKanban },
  { to: "/routine", title: "Рутина", icon: CalendarCheck },
]

function isMoreRouteActive(pathname: string): boolean {
  return (
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/auth")
  )
}

function mainItemClassName(isActive: boolean) {
  return cn(
    "flex min-h-12 min-w-0 flex-1 basis-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
    isActive
      ? "bg-blue-50 text-blue-700"
      : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
  )
}

export function MobileBottomNavigation() {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const closeMore = useCallback(() => {
    setMoreOpen(false)
  }, [])

  const toggleMore = useCallback(() => {
    setMoreOpen((o) => !o)
  }, [])

  useEffect(() => {
    if (!moreOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeMore()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [moreOpen, closeMore])

  const moreActive = isMoreRouteActive(pathname)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 isolate lg:hidden">
      {moreOpen ? (
        <>
          <button
            type="button"
            className="pointer-events-auto fixed inset-0 z-[10] bg-slate-900/30"
            aria-hidden
            tabIndex={-1}
            onClick={closeMore}
          />
          <nav
            id={MORE_MENU_ID}
            role="menu"
            aria-label="Дополнительные разделы"
            className="pointer-events-auto absolute bottom-full left-2 right-2 z-[20] mb-2 max-h-[50vh] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200 bg-white p-2 shadow-lg"
          >
            <ul className="flex flex-col gap-0.5">
              <li role="none">
                <NavLink
                  role="menuitem"
                  to="/analytics"
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-800 hover:bg-slate-100",
                    )
                  }
                  onClick={closeMore}
                >
                  <BarChart3
                    className={cn(
                      "size-5 shrink-0",
                      pathname.startsWith("/analytics")
                        ? "text-blue-600"
                        : "text-slate-600",
                    )}
                    aria-hidden
                  />
                  Аналитика
                </NavLink>
              </li>
              <li role="none">
                <NavLink
                  role="menuitem"
                  to="/settings"
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-800 hover:bg-slate-100",
                    )
                  }
                  onClick={closeMore}
                >
                  <Settings
                    className={cn(
                      "size-5 shrink-0",
                      pathname.startsWith("/settings")
                        ? "text-blue-600"
                        : "text-slate-600",
                    )}
                    aria-hidden
                  />
                  Настройки
                </NavLink>
              </li>
              <li role="none">
                <NavLink
                  role="menuitem"
                  to="/profile"
                  end
                  className={({ isActive }) =>
                    cn(
                      "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium",
                      isActive
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-800 hover:bg-slate-100",
                    )
                  }
                  onClick={closeMore}
                >
                  <User
                    className={cn(
                      "size-5 shrink-0",
                      pathname.startsWith("/profile")
                        ? "text-blue-600"
                        : "text-slate-600",
                    )}
                    aria-hidden
                  />
                  Аккаунт
                </NavLink>
              </li>
            </ul>
          </nav>
        </>
      ) : null}

      <nav
        aria-label="Основная навигация"
        className="pointer-events-auto relative z-[30] flex h-[calc(4rem+env(safe-area-inset-bottom,0px))] min-h-16 items-center gap-0.5 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom,0px)] pt-1 backdrop-blur supports-backdrop-filter:backdrop-blur-sm"
      >
        {mainItems.map(({ to, title, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={title}
            aria-label={title}
            className={({ isActive }) => mainItemClassName(isActive)}
          >
            <Icon className="size-6 shrink-0" aria-hidden />
            <span className="sr-only">{title}</span>
          </NavLink>
        ))}

        <button
          type="button"
          title="Ещё"
          aria-label="Ещё"
          aria-expanded={moreOpen}
          aria-controls={moreOpen ? MORE_MENU_ID : undefined}
          onClick={toggleMore}
          className={cn(
            "flex min-h-12 min-w-0 flex-1 basis-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
            moreActive || moreOpen
              ? "bg-blue-50 text-blue-700"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
          )}
        >
          <Menu className="size-6 shrink-0" aria-hidden />
          <span className="sr-only">Ещё</span>
        </button>
      </nav>
    </div>
  )
}
