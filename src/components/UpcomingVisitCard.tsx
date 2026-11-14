import { useId } from 'react'
import { cx } from '../lib/cx'
import { daysBetween, formatRelativeDays, formatTime, formatWeekdayShortDate } from '../lib/format'
import type { Pet, Visit } from '../types'
import { ButtonLink } from './Button'

interface UpcomingVisitCardProps {
  visit: Visit
  pet: Pet
  today: string
  className?: string
}

/** Dark feature card used in Today's side column. */
export function UpcomingVisitCard({ visit, pet, today, className }: UpcomingVisitCardProps) {
  const id = useId()
  const days = daysBetween(today, visit.date)
  return (
    <section aria-labelledby={id} className={cx('rounded-3xl bg-feature p-6 text-white', className)}>
      <p className="text-xs font-bold tracking-wider text-feature-label uppercase">
        Upcoming visit · {formatRelativeDays(days)}
      </p>
      <h2 id={id} className="mt-2 text-xl font-extrabold tracking-tight">
        {visit.title}
      </h2>
      <p className="mt-2 text-sm text-white/80">
        {pet.name} · {formatWeekdayShortDate(visit.date)} · {formatTime(visit.time)}
        <br />
        {visit.clinic}
      </p>
      <ButtonLink to="/visits" variant="inverse" block className="mt-5">
        View details
      </ButtonLink>
    </section>
  )
}
