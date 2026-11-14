import { cx } from '../lib/cx'

const tones = {
  primary:
    '[&::-webkit-progress-bar]:bg-divider [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary bg-divider',
  warn: '[&::-webkit-progress-bar]:bg-divider [&::-webkit-progress-value]:bg-warn-dot [&::-moz-progress-bar]:bg-warn-dot bg-divider',
  inverse:
    '[&::-webkit-progress-bar]:bg-white/25 [&::-webkit-progress-value]:bg-white [&::-moz-progress-bar]:bg-white bg-white/25',
} as const

interface ProgressBarProps {
  value: number
  max: number
  /** Accessible name, e.g. "Antibiotic course progress". */
  label: string
  tone?: keyof typeof tones
  className?: string
}

/** Native <progress> styled as a rounded bar. */
export function ProgressBar({ value, max, label, tone = 'primary', className }: ProgressBarProps) {
  return (
    <progress
      aria-label={label}
      value={Math.min(value, max)}
      max={max}
      className={cx(
        'block h-2 w-full appearance-none overflow-hidden rounded-full border-0',
        '[&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-value]:rounded-full [&::-moz-progress-bar]:rounded-full',
        tones[tone],
        className,
      )}
    />
  )
}
