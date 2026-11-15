import { useId } from 'react'
import { cx } from '../lib/cx'
import { formatVisitDate, reminderActive, visitState, visitWhen } from '../lib/visits'
import type { Pet, Visit } from '../types'
import { ButtonLink } from './Button'

interface UpcomingVisitCardProps {
  visit: Visit
  pet: Pet
  today: string
  className?: string
}

/** Dark feature card in Today's side column for the next scheduled appointment. */
export function UpcomingVisitCard({ visit, pet, today, className }: UpcomingVisitCardProps) {
  const id = useId()
  const overdue = visitState(visit, today) === 'overdue'
  const when = visitWhen(visit, today)
  const eyebrow = overdue
    ? `Appointment overdue · ${when}`
    : reminderActive(visit, today)
      ? `Reminder · ${when}`
      : `Upcoming visit · ${when}`

  return (
    <section aria-labelledby={id} className={cx('rounded-2xl bg-feature p-6 text-white', className)}>
      <p className={cx('text-xs font-bold tracking-wider uppercase', overdue ? 'text-warn-tint' : 'text-feature-label')}>
        {eyebrow}
      </p>
      <h2 id={id} className="mt-2 text-xl font-extrabold tracking-tight">
        {visit.title}
      </h2>
      <p className="mt-2 text-sm text-white/80">
        {pet.name} · {visit.type} · {formatVisitDate(visit)}
        {visit.clinic && (
          <>
            <br />
            {visit.clinic}
          </>
        )}
      </p>
      <ButtonLink to="/visits" variant="inverse" block className="mt-5">
        {overdue ? 'Update visit' : 'View details'}
      </ButtonLink>
    </section>
  )
}
