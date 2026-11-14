import { cx } from '../lib/cx'
import type { SegmentOption } from './SegmentedControl'

interface FilterPillsProps<T extends string> {
  label: string
  options: readonly SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/** Rounded pill filters; the selected pill is dark. */
export function FilterPills<T extends string>({ label, options, value, onChange, className }: FilterPillsProps<T>) {
  return (
    <div role="group" aria-label={label} className={cx('flex flex-wrap gap-2', className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cx(
              'h-11 rounded-full border px-5 text-sm font-semibold transition-colors',
              selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:bg-divider',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
