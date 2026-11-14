import type { ReactNode } from 'react'
import { cx } from '../lib/cx'

export const inputClass =
  'h-11 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink placeholder:text-ink-muted'

export const textareaClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted'

interface FieldProps {
  label: string
  htmlFor: string
  children: ReactNode
  className?: string
}

/** A <label> above a form control. */
export function Field({ label, htmlFor, children, className }: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-semibold text-ink">
        {label}
      </label>
      {children}
    </div>
  )
}

/** A form section label used with fieldset groups. */
export function Legend({ children, className }: { children: ReactNode; className?: string }) {
  return <legend className={cx('mb-2 text-sm font-bold text-ink md:text-base', className)}>{children}</legend>
}
