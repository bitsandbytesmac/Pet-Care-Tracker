import { Check, LogOut, PawPrint, Plus, Search } from 'lucide-react'
import { useId, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { ButtonLink, TextLink } from '../components/Button'
import { Card, SectionCard } from '../components/Card'
import { inputClass } from '../components/Field'
import { PageHeader } from '../components/PageHeader'
import { PetAvatar } from '../components/PetAvatar'
import { ProgressBar } from '../components/ProgressBar'
import { SectionHeader } from '../components/SectionHeader'
import { StatusPill, severityDot } from '../components/StatusPill'
import { SignOutButton } from '../components/SignOutButton'
import { UpcomingVisitCard } from '../components/UpcomingVisitCard'
import { cx } from '../lib/cx'
import { formatLongDate, formatShortDate, formatTime } from '../lib/format'
import { buildSchedule, daysOfSupplyLeft, needsRefill, type ScheduleRow } from '../lib/meds'
import { useIsDesktop } from '../lib/useMediaQuery'
import { scheduledVisits } from '../lib/visits'
import { useAppState } from '../state/AppStateContext'

export default function TodayPage() {
  const { pets, medications, doses, visits, symptoms, toggleDose, today, now } = useAppState()
  const isDesktop = useIsDesktop()
  const [query, setQuery] = useState('')
  const scheduleId = useId()

  const schedule = useMemo(() => buildSchedule(doses, medications, pets, now), [doses, medications, pets, now])
  const given = schedule.filter((r) => r.status === 'given').length
  const total = schedule.length
  const overdue = schedule.filter((r) => r.status === 'overdue')
  const next = schedule.find((r) => r.status !== 'given')

  const upcomingVisit = scheduledVisits(visits)[0]
  const upcomingPet = upcomingVisit && pets.find((p) => p.id === upcomingVisit.petId)
  const refill = medications.find(needsRefill)
  const refillPet = refill && pets.find((p) => p.id === refill.petId)

  const q = query.trim().toLowerCase()
  const visibleRows = q
    ? schedule.filter((r) => `${r.med.name} ${r.pet.name} ${r.med.dose}`.toLowerCase().includes(q))
    : schedule

  const summaryLine =
    total === given
      ? 'All done for today'
      : [`${total - given} left`, `${overdue.length} overdue`, next && `next at ${formatTime(next.dose.time)}`]
          .filter(Boolean)
          .join(' · ')

  return (
    <>
      <PageHeader
        title="Today"
        subtitle={formatLongDate(today)}
        actions={
          isDesktop ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <label className="relative">
                <span className="sr-only">Search today's schedule</span>
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search today's schedule"
                  className={cx(inputClass, 'w-60 pl-9')}
                />
              </label>
              <ButtonLink to="/log" variant="outline">
                Log symptom
              </ButtonLink>
              <ButtonLink to="/medications" variant="primary">
                <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
                Add medication
              </ButtonLink>
            </div>
          ) : (
            <SignOutButton
              aria-label="Sign out"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-soft hover:text-ink"
            >
              <LogOut className="size-5" strokeWidth={2} aria-hidden="true" />
            </SignOutButton>
          )
        }
      />

      {/* Phone: pet chips */}
      <nav aria-label="Your pets" className="mt-5 flex flex-wrap gap-2 md:hidden">
        {pets.map((pet) => (
          <Link
            key={pet.id}
            to={`/pets/${pet.id}`}
            className="flex h-12 items-center gap-2.5 rounded-full border border-line bg-surface pr-4 pl-1.5 text-sm font-semibold hover:bg-divider"
          >
            <PetAvatar pet={pet} size="md" />
            {pet.name}
          </Link>
        ))}
        <Link
          to="/pets/new"
          aria-label="Add a pet"
          className="flex size-12 items-center justify-center rounded-full border border-dashed border-ink-muted text-ink-soft hover:bg-divider"
        >
          <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
        </Link>
      </nav>

      {pets.length === 0 && (
        <Card as="section" aria-label="Get started" className="mt-6 flex flex-col items-start gap-4 p-6 md:flex-row md:items-center">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-tint text-primary">
            <PawPrint className="size-6" strokeWidth={2} aria-hidden="true" />
          </span>
          <div className="flex-1">
            <h2 className="text-lg font-bold">Add your first pet</h2>
            <p className="text-sm text-ink-muted">Then add their medicines and PetCare builds the daily schedule.</p>
          </div>
          <ButtonLink to="/pets/new">Add a pet</ButtonLink>
        </Card>
      )}

      {/* Summary */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <section aria-labelledby="doses-heading" className="rounded-2xl bg-primary p-5 text-white md:col-span-2 md:p-6 xl:col-span-1">
          <div className="flex items-baseline justify-between gap-3 xl:block">
            <h2 id="doses-heading" className="text-lg font-semibold xl:text-sm xl:font-medium">
              Doses given
            </h2>
            <p className="text-4xl font-extrabold tracking-tight xl:mt-1 xl:text-3xl">
              <span>{given}</span> <span className="text-xl font-bold text-white/80">/ {total}</span>
            </p>
          </div>
          <ProgressBar value={given} max={total} tone="inverse" label="Doses given today" className="mt-4" />
          <p className="mt-3 text-sm text-white/85">{summaryLine}</p>
        </section>

        <StatTile
          label="Overdue"
          value={String(overdue.length)}
          valueClassName={overdue.length ? 'text-warn' : 'text-ink'}
          detail={overdue[0] ? `${overdue[0].med.name} for ${overdue[0].pet.name}` : 'Nothing overdue'}
        />
        {refill && refillPet ? (
          <StatTile
            tone="warn"
            label="Refill soon"
            value={refill.name}
            detail={`About ${daysOfSupplyLeft(refill)} days left`}
          />
        ) : (
          <StatTile label="Refills" value="All stocked" detail="No medicine running low" />
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start">
        {/* Schedule */}
        <section aria-labelledby={scheduleId} className="md:rounded-2xl md:border md:border-line md:bg-surface md:p-6">
          <SectionHeader
            id={scheduleId}
            title="Medication schedule"
            action={
              <TextLink to="/medications" className="hidden md:inline-flex">
                All medications
              </TextLink>
            }
          />
          <ul aria-labelledby={scheduleId} className="mt-3 space-y-3 md:space-y-1">
            {visibleRows.map((row) => (
              <ScheduleItem key={row.dose.id} row={row} onToggle={() => toggleDose(row.dose.id)} />
            ))}
          </ul>
          {visibleRows.length === 0 && (
            <p className="py-6 text-center text-sm text-ink-muted">
              {q ? 'No doses match your search.' : 'No doses scheduled today.'}
            </p>
          )}
        </section>

        {/* Side column */}
        <div className="space-y-6">
          {upcomingVisit && upcomingPet && <UpcomingVisitCard visit={upcomingVisit} pet={upcomingPet} today={today} />}

          <SectionCard title="Recent symptoms" action={<TextLink to="/log">Log new</TextLink>}>
            {symptoms.length === 0 && <p className="mt-2 text-sm text-ink-muted">Nothing logged yet.</p>}
            <ul className="mt-2 space-y-4 empty:hidden">
              {symptoms.slice(0, 3).map((entry) => {
                const pet = pets.find((p) => p.id === entry.petId)
                return (
                  <li key={entry.id} className="flex gap-3">
                    <span
                      aria-hidden="true"
                      className={cx('mt-1.5 size-2.5 shrink-0 rounded-full', severityDot[entry.severity])}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">
                        {pet?.name} · {entry.title}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {entry.severity} · {formatShortDate(entry.date)}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ul>
          </SectionCard>
        </div>
      </div>
    </>
  )
}

function ScheduleItem({ row, onToggle }: { row: ScheduleRow; onToggle: () => void }) {
  const { dose, med, pet, status } = row
  const given = status === 'given'
  const nameId = useId()

  return (
    <li
      className={cx(
        'flex items-center gap-3 rounded-2xl border bg-surface p-4 md:gap-4 md:rounded-xl md:px-3 md:py-3',
        status === 'overdue' ? 'border-warn-line md:bg-warn-tint/40' : 'border-line md:border-transparent',
      )}
    >
      <div className="w-18 shrink-0 md:w-20">
        <p className="text-base leading-tight font-bold text-ink md:text-sm md:font-semibold">
          {formatTime(dose.time)}
        </p>
        <StatusPill status={status} variant="text" className="mt-0.5 md:hidden" />
      </div>
      <PetAvatar pet={pet} className="hidden md:inline-flex" />
      <div className="min-w-0 flex-1">
        <p
          id={nameId}
          className={cx('text-base font-semibold md:text-sm', given ? 'text-ink-muted line-through' : 'text-ink')}
        >
          {med.name}
        </p>
        <p className="truncate text-sm text-ink-muted md:text-xs">
          {pet.name} · {med.dose}
        </p>
      </div>
      <StatusPill status={status} className="hidden md:inline-flex" />
      <button
        type="button"
        onClick={onToggle}
        aria-describedby={nameId}
        className={cx(
          'flex size-12 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          'md:h-11 md:w-auto md:min-w-28 md:rounded-xl md:border md:px-4 md:text-sm md:font-semibold',
          given
            ? 'border-primary bg-primary text-white md:border-line md:bg-surface md:text-ink md:hover:bg-bg'
            : cx(
                status === 'overdue' ? 'border-warn-dot' : 'border-ink-muted',
                'bg-surface md:border-primary md:bg-primary md:text-white md:hover:bg-primary-dark',
              ),
        )}
      >
        {given && <Check className="size-5 md:hidden" strokeWidth={2.5} aria-hidden="true" />}
        <span className="sr-only md:not-sr-only">{given ? 'Undo' : 'Mark given'}</span>
      </button>
    </li>
  )
}

interface StatTileProps {
  label: string
  value: string
  detail: string
  tone?: 'default' | 'warn'
  valueClassName?: string
}

function StatTile({ label, value, detail, tone = 'default', valueClassName }: StatTileProps) {
  const warn = tone === 'warn'
  return (
    <Card className={cx('hidden p-5 md:block', warn && 'border-warn-line bg-warn-tint')}>
      <p className={cx('text-sm font-medium', warn ? 'text-warn-dark' : 'text-ink-muted')}>{label}</p>
      <p
        className={cx(
          'mt-1 text-2xl font-extrabold tracking-tight',
          warn ? 'text-warn-dark' : (valueClassName ?? 'text-ink'),
        )}
      >
        {value}
      </p>
      {detail && <p className={cx('mt-1 text-xs', warn ? 'text-warn-dark' : 'text-ink-muted')}>{detail}</p>}
    </Card>
  )
}
