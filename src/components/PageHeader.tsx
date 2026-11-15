import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

interface PageHeaderProps {
  title: ReactNode
  /** One short line of context above the title (a date, "All pets", …). */
  subtitle?: ReactNode
  /** Buttons or controls aligned to the right. */
  actions?: ReactNode
  className?: string
}

/** The one page title pattern used by every screen. */
export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cx('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        {subtitle && <p className="text-sm text-ink-muted md:text-base">{subtitle}</p>}
        <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h1>
      </div>
      {actions}
    </header>
  )
}
