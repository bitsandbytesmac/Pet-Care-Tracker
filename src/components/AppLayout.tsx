import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { Link, Outlet, useLocation } from 'react-router'
import { BottomTabBar } from './BottomTabBar'
import { Sidebar } from './Sidebar'

/**
 * md+ : sidebar on the left, content on the right.
 * Below md: content with a fixed bottom tab bar and a floating "+" (log a symptom) button.
 */
export function AppLayout() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="min-h-dvh bg-bg text-ink md:flex">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-xl focus:bg-surface focus:px-4 focus:py-3 focus:text-sm focus:font-semibold"
      >
        Skip to content
      </a>

      <Sidebar className="hidden md:flex" />

      <main id="main" className="min-w-0 flex-1 px-5 pt-6 pb-40 md:px-10 md:py-8">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      {!pathname.startsWith('/log') && (
        <Link
          to="/log"
          aria-label="Log a symptom"
          className="fixed right-5 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-30 flex size-16 items-center justify-center rounded-full bg-ink text-white shadow-lg shadow-ink/20 md:hidden"
        >
          <Plus className="size-7" strokeWidth={2} aria-hidden="true" />
        </Link>
      )}

      <BottomTabBar className="md:hidden" />
    </div>
  )
}
