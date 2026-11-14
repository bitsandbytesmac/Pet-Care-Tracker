import type { PetColor } from '../types'

/** Full class strings per pet color (kept literal so Tailwind can see them). */
export const petTheme: Record<
  PetColor,
  { avatar: string; banner: string; pill: string; ink: string; dot: string }
> = {
  peach: {
    avatar: 'bg-pet-peach text-pet-peach-ink',
    banner: 'bg-pet-peach',
    pill: 'bg-pet-peach text-pet-peach-ink',
    ink: 'text-pet-peach-ink',
    dot: 'bg-warn-dot',
  },
  mint: {
    avatar: 'bg-pet-mint text-pet-mint-ink',
    banner: 'bg-pet-mint',
    pill: 'bg-pet-mint text-pet-mint-ink',
    ink: 'text-pet-mint-ink',
    dot: 'bg-primary',
  },
}
