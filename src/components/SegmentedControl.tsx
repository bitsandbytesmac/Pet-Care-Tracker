import { cx } from '../lib/cx'

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

interface SegmentedControlProps<T extends string> {
  /** Accessible name for the group, e.g. "Medication status". */
  label: string
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  /** Color of the selected label. */
  activeTone?: 'ink' | 'primary'
  className?: string
}

/** A row of mutually exclusive toggle buttons on a grey track. */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  activeTone = 'ink',
  className,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className={cx('flex rounded-2xl bg-line p-1', className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              'h-11 flex-1 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-colors',
              selected
                ? cx('bg-surface shadow-sm', activeTone === 'primary' ? 'text-primary-dark' : 'text-ink')
                : 'text-ink-muted hover:text-ink',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
