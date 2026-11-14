import { Link, useLocation } from 'react-router'
import { cx } from '../lib/cx'
import { navItems } from './navItems'

export function BottomTabBar({ className }: { className?: string }) {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Tab bar"
      className={cx(
        'fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]',
        className,
      )}
    >
      <ul className="mx-auto flex h-21 max-w-xl">
        {navItems.map(({ to, shortLabel, icon: Icon, isActive }) => {
          const active = isActive(pathname)
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cx(
                  'flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors',
                  active ? 'text-primary' : 'text-ink-muted hover:text-ink',
                )}
              >
                <Icon className="size-6" strokeWidth={2} aria-hidden="true" />
                {shortLabel}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
