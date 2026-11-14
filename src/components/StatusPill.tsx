import { cx, display } from '../lib/cx'
import type { DoseStatus, Severity } from '../types'

const doseLabels: Record<DoseStatus, string> = { given: 'Given', due: 'Due', overdue: 'Overdue' }

const dosePill: Record<DoseStatus, string> = {
  given: 'bg-primary-tint text-primary-dark',
  due: 'bg-divider text-ink-soft',
  overdue: 'bg-warn-tint text-warn-dark',
}

const doseText: Record<DoseStatus, string> = {
  given: 'text-primary',
  due: 'text-ink-muted',
  overdue: 'text-warn',
}

interface StatusPillProps {
  status: DoseStatus
  /** "pill" = rounded chip; "text" = small uppercase label (phone schedule). */
  variant?: 'pill' | 'text'
  className?: string
}

export function StatusPill({ status, variant = 'pill', className }: StatusPillProps) {
  return (
    <span
      className={cx(
        variant === 'pill'
          ? cx(
              display('inline-flex', className),
              'h-7 items-center rounded-full px-3 text-xs font-semibold',
              dosePill[status],
            )
          : cx(display('block', className), 'text-xs font-bold tracking-wide uppercase', doseText[status]),
        className,
      )}
    >
      {doseLabels[status]}
    </span>
  )
}

const severityPill: Record<Severity, string> = {
  Mild: 'bg-primary-tint text-primary-dark',
  Moderate: 'bg-warn-tint text-warn-dark',
  Severe: 'bg-severe-tint text-severe',
}

export const severityDot: Record<Severity, string> = {
  Mild: 'bg-primary',
  Moderate: 'bg-warn-dot',
  Severe: 'bg-severe',
}

export function SeverityPill({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex h-7 shrink-0 items-center rounded-full px-3 text-xs font-semibold',
        severityPill[severity],
        className,
      )}
    >
      {severity}
    </span>
  )
}
