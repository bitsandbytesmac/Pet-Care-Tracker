import { cx, display } from '../lib/cx'
import { PREVENTIVE_TYPES, type VisitState } from '../lib/visits'
import type { VisitType } from '../types'

const pill = 'h-7 shrink-0 items-center rounded-full px-3 text-xs font-semibold whitespace-nowrap'

/** Visit type. Vaccinations and deworming stand out so they are easy to spot in a history. */
export function VisitTypePill({ type, className }: { type: VisitType; className?: string }) {
  return (
    <span
      className={cx(
        display('inline-flex', className),
        pill,
        PREVENTIVE_TYPES.includes(type) ? 'bg-primary-tint text-primary-dark' : 'bg-divider text-ink-soft',
        className,
      )}
    >
      {type}
    </span>
  )
}

const stateStyles: Record<VisitState, string> = {
  upcoming: 'bg-primary-tint text-primary-dark',
  overdue: 'bg-warn-tint text-warn-dark',
  completed: 'bg-divider text-ink-soft',
}

/** Upcoming / overdue / completed, with the text the caller passes (e.g. "In 4 days"). */
export function VisitStatePill({ state, label, className }: { state: VisitState; label: string; className?: string }) {
  return <span className={cx(display('inline-flex', className), pill, stateStyles[state], className)}>{label}</span>
}
