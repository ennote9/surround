import { useState } from "react"
import { NavLink } from "react-router-dom"
import {
  BarChart3,
  CalendarCheck,
  FolderKanban,
  Home,
  Menu,
  Settings,
  type LucideIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const items: {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}[] = [
  { to: "/", label: "Главная", icon: Home, end: true },
  { to: "/projects", label: "Проекты", icon: FolderKanban },
  { to: "/routine", label: "Рутина", icon: CalendarCheck },
  { to: "/analytics", label: "Аналитика", icon: BarChart3 },
  { to: "/settings", label: "Настройки", icon: Settings },
]

function linkClassName({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
    isActive
      ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
      : "text-slate-700 hover:bg-slate-100 hover:text-slate-950",
  )
}

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur supports-backdrop-filter:backdrop-blur-sm lg:hidden">
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="shrink-0 border-slate-300 bg-white text-slate-800 hover:bg-slate-100"
          onClick={() => setOpen(true)}
          aria-label="Открыть меню"
        >
          <Menu className="size-5" />
        </Button>
        <span className="truncate text-base font-semibold tracking-tight text-slate-950">
          Canada Progress OS
        </span>
      </header>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="w-[min(100%,20rem)] border-slate-200 bg-white p-0 text-slate-950 sm:max-w-sm"
        >
          <SheetHeader className="border-b border-slate-200 p-4 text-left">
            <SheetTitle className="text-slate-950">
              Canada Progress OS
            </SheetTitle>
            <p className="text-sm font-normal text-slate-500">
              Трекер подготовки
            </p>
          </SheetHeader>

          <nav className="flex flex-col gap-1 p-4">
            {items.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={linkClassName}
                onClick={() => setOpen(false)}
              >
                <Icon className="size-5 shrink-0 opacity-90" aria-hidden />
                {label}
              </NavLink>
            ))}
          </nav>

          <Separator className="bg-slate-200" />

          <p className="p-4 text-xs text-slate-500">
            Локальное хранение данных
          </p>
        </SheetContent>
      </Sheet>
    </>
  )
}
