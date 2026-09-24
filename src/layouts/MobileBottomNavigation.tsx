import { useCallback, useEffect, useState } from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  BarChart3,
  BookOpen,
  CalendarCheck,
  FolderKanban,
  Home,
  Menu,
  Settings,
  Target,
  User,
  X,
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

const moreItems = [
  {
    to: "/analytics",
    label: "Аналитика",
    caption: "Прогресс и состояние",
    icon: BarChart3,
  },
  {
    to: "/guide",
    label: "Справочник",
    caption: "Как всё устроено",
    icon: BookOpen,
  },
  {
    to: "/settings",
    label: "Настройки",
    caption: "Интерфейс и данные",
    icon: Settings,
  },
  {
    to: "/profile",
    label: "Профиль",
    caption: "Аккаунт и безопасность",
    icon: User,
  },
] as const

function isMoreRouteActive(pathname: string): boolean {
  return (
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/guide") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/auth")
  )
}

function mainItemClassName(isActive: boolean) {
  return cn(
    "flex min-h-12 min-w-0 flex-1 basis-0 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
    isActive
      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
      : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200",
  )
}

function MoreMenuTile({
  to,
  label,
  caption,
  icon: Icon,
  onClick,
}: {
  to: string
  label: string
  caption: string
  icon: typeof Home
  onClick: () => void
}) {
  return (
    <li role="none" className="min-w-0">
      <NavLink
        role="menuitem"
        to={to}
        onClick={onClick}
        className={({ isActive }) =>
          cn(
            "group flex min-h-[104px] min-w-0 flex-col justify-between rounded-[20px] border p-3.5 text-left transition-all duration-200",
            isActive
              ? "border-blue-500/40 bg-blue-50 text-blue-800 ring-1 ring-blue-500/15 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200"
              : "border-slate-200 bg-slate-50/80 text-slate-800 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-950/55 dark:text-slate-200 dark:hover:border-slate-700 dark:hover:bg-slate-800/70",
          )
        }
      >
        {({ isActive }) => (
          <>
            <span
              className={cn(
                "flex size-9 items-center justify-center rounded-xl transition-colors",
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                  : "bg-white text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-400",
              )}
            >
              <Icon className="size-[18px]" aria-hidden />
            </span>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{label}</p>
              <p
                className={cn(
                  "mt-0.5 truncate text-[10px]",
                  isActive
                    ? "text-blue-600/80 dark:text-blue-300/75"
                    : "text-slate-400",
                )}
              >
                {caption}
              </p>
            </div>
          </>
        )}
      </NavLink>
    </li>
  )
}

export function MobileBottomNavigation() {
  const { pathname } = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)

  const closeMore = useCallback(() => {
    setMoreOpen(false)
  }, [])

  const toggleMore = useCallback(() => {
    setMoreOpen((open) => !open)
  }, [])

  useEffect(() => {
    if (!moreOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMore()
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [moreOpen, closeMore])

  useEffect(() => {
    closeMore()
  }, [pathname, closeMore])

  const moreActive = isMoreRouteActive(pathname)

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 isolate lg:hidden">
      {moreOpen ? (
        <>
          <button
            type="button"
            className="pointer-events-auto fixed inset-0 z-[10] bg-slate-950/25 backdrop-blur-[1px] data-open:animate-in data-open:fade-in-0 dark:bg-black/55"
            aria-label="Закрыть дополнительное меню"
            onClick={closeMore}
          />

          <nav
            id={MORE_MENU_ID}
            role="menu"
            aria-label="Дополнительные разделы"
            className="pointer-events-auto absolute bottom-full left-3 right-3 z-[20] mb-3 overflow-hidden rounded-[28px] border border-slate-200 bg-white/96 p-3 shadow-2xl shadow-slate-950/10 backdrop-blur-xl animate-in fade-in-0 slide-in-from-bottom-3 duration-200 dark:border-slate-700 dark:bg-slate-900/96 dark:shadow-black/35"
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-slate-400">
                  Навигация
                </p>
                <p className="mt-0.5 text-sm font-semibold text-slate-950 dark:text-slate-100">
                  Ещё
                </p>
              </div>

              <button
                type="button"
                onClick={closeMore}
                className="flex size-8 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                aria-label="Закрыть меню"
              >
                <X className="size-4" aria-hidden />
              </button>
            </div>

            <ul className="grid grid-cols-2 gap-2">
              {moreItems.map((item) => (
                <MoreMenuTile
                  key={item.to}
                  {...item}
                  onClick={closeMore}
                />
              ))}
            </ul>
          </nav>
        </>
      ) : null}

      <nav
        aria-label="Основная навигация"
        className="pointer-events-auto relative z-[30] flex h-[calc(4rem+env(safe-area-inset-bottom,0px))] min-h-16 items-center gap-0.5 border-t border-slate-200 bg-white/95 px-1 pb-[env(safe-area-inset-bottom,0px)] pt-1 backdrop-blur supports-backdrop-filter:backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/95"
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
          title={moreOpen ? "Закрыть" : "Ещё"}
          aria-label={moreOpen ? "Закрыть меню" : "Ещё"}
          aria-expanded={moreOpen}
          aria-controls={moreOpen ? MORE_MENU_ID : undefined}
          onClick={toggleMore}
          className={cn(
            "flex min-h-12 min-w-0 flex-1 basis-0 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
            moreActive || moreOpen
              ? "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300"
              : "text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200",
          )}
        >
          <span
            className={cn(
              "flex items-center justify-center transition-transform duration-200",
              moreOpen && "rotate-90",
            )}
          >
            {moreOpen ? (
              <X className="size-6 shrink-0" aria-hidden />
            ) : (
              <Menu className="size-6 shrink-0" aria-hidden />
            )}
          </span>
          <span className="sr-only">{moreOpen ? "Закрыть меню" : "Ещё"}</span>
        </button>
      </nav>
    </div>
  )
}
