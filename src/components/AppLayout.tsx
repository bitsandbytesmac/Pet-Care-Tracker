import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import { BottomTabBar } from './BottomTabBar'
import { Sidebar } from './Sidebar'

/**
 * md+ : sidebar on the left, content on the right.
 * Below md: content with a fixed bottom tab bar.
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

      <main
        id="main"
        className="min-w-0 flex-1 px-5 pt-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:px-10 md:py-8"
      >
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>

      <BottomTabBar className="md:hidden" />
    </div>
  )
}
