import { cx, display } from '../lib/cx'
import { petTheme } from '../lib/petTheme'
import type { Pet } from '../types'

const sizes = {
  sm: 'size-7 text-xs',
  md: 'size-9 text-sm',
  lg: 'size-11 text-base',
  xl: 'size-20 text-3xl md:size-24 md:text-4xl',
} as const

interface PetAvatarProps {
  pet: Pick<Pet, 'name' | 'color'>
  size?: keyof typeof sizes
  /** White circle with pet-colored initial, for use on the pet's colored banner. */
  onBanner?: boolean
  className?: string
}

/** Round avatar with the pet's initial. Decorative — put the pet's name in text nearby. */
export function PetAvatar({ pet, size = 'md', onBanner, className }: PetAvatarProps) {
  const theme = petTheme[pet.color]
  return (
    <span
      aria-hidden="true"
      className={cx(
        display('inline-flex', className),
        'shrink-0 items-center justify-center rounded-full font-bold',
        sizes[size],
        onBanner ? cx('bg-surface', theme.ink) : theme.avatar,
        className,
      )}
    >
      {pet.name.charAt(0).toUpperCase()}
    </span>
  )
}

/** Small rounded pill with the pet's name in its color. */
export function PetPill({ pet, className }: { pet: Pick<Pet, 'name' | 'color'>; className?: string }) {
  return (
    <span
      className={cx(
        display('inline-flex', className),
        'h-7 items-center rounded-full px-3 text-xs font-semibold',
        petTheme[pet.color].pill,
        className,
      )}
    >
      {pet.name}
    </span>
  )
}
