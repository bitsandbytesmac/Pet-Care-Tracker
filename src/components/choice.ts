import { cx } from '../lib/cx'

/**
 * Rounded chip for filters, tabs and multi-select options. Selected chips are dark.
 * Pair with aria-pressed (toggles), aria-selected (tabs) or aria-current (links).
 */
export function chipClasses(selected: boolean, className?: string): string {
  return cx(
    'h-11 rounded-full border px-4 text-sm font-semibold transition-colors',
    selected ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:border-ink-muted/60 hover:bg-divider',
    className,
  )
}

/** Larger bordered option (e.g. picking a pet or a color). Selected options get a primary border. */
export function optionClasses(selected: boolean, className?: string): string {
  return cx(
    'flex items-center gap-3 rounded-xl border-2 bg-surface text-left font-semibold transition-colors',
    selected ? 'border-primary' : 'border-line hover:border-ink-muted/60',
    className,
  )
}
