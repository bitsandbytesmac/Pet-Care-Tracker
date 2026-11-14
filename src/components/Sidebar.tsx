import { PawPrint, Plus } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { cx } from '../lib/cx'
import { useAppState } from '../state/AppStateContext'
import { navItems } from './navItems'
import { PetAvatar } from './PetAvatar'

const linkBase = 'flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] font-medium transition-colors'
const linkActive = 'bg-primary-tint font-semibold text-primary-dark'
const linkIdle = 'text-ink-soft hover:bg-divider hover:text-ink'

export function Sidebar({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const { pets } = useAppState()

  return (
    <aside
      className={cx(
        'sticky top-0 h-dvh w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-surface px-4 py-5',
        className,
      )}
    >
      <Link to="/" className="mb-6 flex h-11 items-center gap-3 rounded-xl px-1">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white">
          <PawPrint className="size-5" strokeWidth={2} aria-hidden="true" />
        </span>
        <span className="text-lg font-extrabold tracking-tight text-ink">PetCare</span>
      </Link>

      <nav aria-label="Sidebar">
        <ul className="space-y-1">
          {navItems.map(({ to, label, icon: Icon, isActive }) => {
            const active = isActive(pathname)
            return (
              <li key={to}>
                <Link
                  to={to}
                  aria-current={active ? 'page' : undefined}
                  className={cx(linkBase, active ? linkActive : linkIdle)}
                >
                  <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <nav aria-labelledby="sidebar-pets" className="mt-8">
        <h2 id="sidebar-pets" className="px-3 text-xs font-semibold tracking-wider text-ink-muted uppercase">
          Your pets
        </h2>
        <ul className="mt-2 space-y-1">
          {pets.map((pet) => {
            const active = pathname === `/pets/${pet.id}`
            return (
              <li key={pet.id}>
                <Link
                  to={`/pets/${pet.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={cx(linkBase, active ? 'bg-divider font-semibold text-ink' : linkIdle)}
                >
                  <PetAvatar pet={pet} size="sm" />
                  {pet.name}
                </Link>
              </li>
            )
          })}
        </ul>
        <button
          type="button"
          className="mt-3 flex h-11 w-full items-center gap-2 rounded-xl border border-dashed border-ink-muted px-3 text-sm font-medium text-ink-soft hover:bg-bg"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          Add a pet
        </button>
      </nav>
    </aside>
  )
}
