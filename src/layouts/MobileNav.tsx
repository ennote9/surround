import { WorkspaceContextSwitcher } from "@/shared/components/WorkspaceContextSwitcher"

export function MobileNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 pb-2.5 backdrop-blur supports-backdrop-filter:backdrop-blur-sm lg:hidden pt-[max(0.625rem,env(safe-area-inset-top,0px))] dark:border-slate-800 dark:bg-slate-950/95">
      <span className="block min-w-0 truncate text-base font-semibold tracking-tight text-slate-950 dark:text-slate-100">
        Life Progress OS
      </span>
      <div className="mt-2">
        <WorkspaceContextSwitcher compact />
      </div>
    </header>
  )
}
