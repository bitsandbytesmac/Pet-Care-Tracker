import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

const controlBase =
  'w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted transition-colors hover:border-ink-muted/60 focus:border-primary'

export const inputClass = cx('h-11', controlBase)

export const textareaClass = cx('py-2.5', controlBase)

/** Label style shared by <label> and <legend>, so every form reads the same. */
const labelClass = 'mb-1.5 block text-sm font-semibold text-ink'

interface FieldProps {
  label: string
  htmlFor: string
  children: ReactNode
  /** Short helper text under the control. Pass `${htmlFor}-hint` as the control's aria-describedby. */
  hint?: string
  /** Adds a quiet "(optional)" after the label. */
  optional?: boolean
  className?: string
}

/** A <label> above a form control, with optional hint text. */
export function Field({ label, htmlFor, children, hint, optional, className }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
        {optional && <span className="font-normal text-ink-muted"> (optional)</span>}
      </label>
      {children}
      {hint && (
        <p id={`${htmlFor}-hint`} className="mt-1 text-xs text-ink-muted">
          {hint}
        </p>
      )}
    </div>
  )
}

/** A form section label used with fieldset groups. */
export function Legend({ children, className }: { children: ReactNode; className?: string }) {
  return <legend className={cx(labelClass, className)}>{children}</legend>
}

/** Inline form error. Renders nothing when there is no message. */
export function FormError({ children, className }: { children?: ReactNode; className?: string }) {
  if (!children) return null
  return (
    <p role="alert" className={cx('rounded-xl bg-severe-tint px-3 py-2 text-sm text-severe', className)}>
      {children}
    </p>
  )
}

/** Confirmation after a save. Always mounted so screen readers announce changes; hidden while empty. */
export function FormStatus({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <p
      role="status"
      className={cx(
        'rounded-xl bg-primary-tint px-3 py-2 text-sm font-semibold text-primary-dark empty:hidden',
        className,
      )}
    >
      {children}
    </p>
  )
}
