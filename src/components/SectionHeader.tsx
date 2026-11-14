import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

interface SectionHeaderProps {
  title: string
  id?: string
  action?: ReactNode
  className?: string
}

export function SectionHeader({ title, id, action, className }: SectionHeaderProps) {
  return (
    <div className={cx('flex min-h-11 items-center justify-between gap-3', className)}>
      <h2 id={id} className="text-lg font-bold text-ink">
        {title}
      </h2>
      {action}
    </div>
  )
}
