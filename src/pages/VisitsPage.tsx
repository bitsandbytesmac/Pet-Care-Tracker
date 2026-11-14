import { Pill, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { Link } from 'react-router'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { FilterPills } from '../components/FilterPills'
import { PetPill } from '../components/PetAvatar'
import { AttachmentTile } from '../components/AttachmentTile'
import { errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import {
  daysBetween,
  formatDayOfMonth,
  formatMonthAbbr,
  formatRelativeDays,
  formatShortDate,
  formatTime,
  formatWeekdayLongDate,
  formatWeekdayShortDate,
} from '../lib/format'
import { prescriptionLabel } from '../lib/meds'
import { petTheme } from '../lib/petTheme'
import { useIsDesktop } from '../lib/useMediaQuery'
import { useAppState } from '../state/AppStateContext'
import type { Pet, Visit } from '../types'

const ALL = 'all'

/** "1 prescription · 2 photos" / "Weight logged" */
function visitMeta(visit: Visit): string[] {
  const photos = visit.attachments.filter((a) => a.kind === 'photo').length
  const parts: string[] = []
  if (visit.prescriptionIds.length) {
    parts.push(`${visit.prescriptionIds.length} prescription${visit.prescriptionIds.length > 1 ? 's' : ''}`)
  }
  if (photos) parts.push(`${photos} photo${photos > 1 ? 's' : ''}`)
  if (visit.weightLogged) parts.push('Weight logged')
  return parts
}

export default function VisitsPage() {
  const { visits, pets, today } = useAppState()
  const isDesktop = useIsDesktop()
  const [filter, setFilter] = useState<string>(ALL)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const upcoming = visits.filter((v) => v.upcoming).sort((a, b) => a.date.localeCompare(b.date))[0]
  const history = visits
    .filter((v) => !v.upcoming && (filter === ALL || v.petId === filter))
    .sort((a, b) => b.date.localeCompare(a.date))
  const selected = history.find((v) => v.id === selectedId) ?? history[0]
  const petFor = (visit: Visit) => pets.find((p) => p.id === visit.petId)
  const upcomingPet = upcoming && petFor(upcoming)

  return (
    <>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="hidden text-base text-ink-muted md:block">Appointments and history</p>
          <h1 className="text-4xl font-extrabold tracking-tight">Vet visits</h1>
        </div>
        <Button className="hidden md:inline-flex">
          <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
          Add visit
        </Button>
        <button
          type="button"
          aria-label="Add visit"
          className="flex size-14 items-center justify-center rounded-full bg-primary text-white md:hidden"
        >
          <Plus className="size-6" strokeWidth={2} aria-hidden="true" />
        </button>
      </header>

      {upcoming && upcomingPet && <UpcomingCard visit={upcoming} pet={upcomingPet} today={today} />}

      <FilterPills
        label="Filter visits by pet"
        className="mt-6"
        value={filter}
        onChange={setFilter}
        options={[{ value: ALL, label: 'All' }, ...pets.map((p) => ({ value: p.id, label: p.name }))]}
      />

      {isDesktop ? (
        <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
          <ul aria-label="Visit history" className="space-y-3">
            {history.map((visit) => {
              const pet = petFor(visit)
              const isSelected = visit.id === selected?.id
              return (
                <li key={visit.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setSelectedId(visit.id)}
                    className={cx(
                      'flex w-full items-center gap-4 rounded-2xl border bg-surface px-4 py-3.5 text-left transition-colors',
                      isSelected ? 'border-primary ring-1 ring-primary' : 'border-line hover:border-ink-muted',
                    )}
                  >
                    <span className="w-14 shrink-0 text-sm text-ink-muted">{formatShortDate(visit.date)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-ink">{visit.title}</span>
                      <span className="block text-xs text-ink-muted">{visitMeta(visit).join(' · ')}</span>
                    </span>
                    {pet && <PetPill pet={pet} />}
                  </button>
                </li>
              )
            })}
          </ul>
          {selected && <VisitDetails visit={selected} />}
        </div>
      ) : (
        <>
          <h2 className="mt-6 text-lg font-bold">History</h2>
          <ol aria-label="Visit history" className="mt-3">
            {history.map((visit, index) => {
              const pet = petFor(visit)
              return pet ? (
                <TimelineItem key={visit.id} visit={visit} pet={pet} last={index === history.length - 1} />
              ) : null
            })}
          </ol>
        </>
      )}

      {history.length === 0 && <p className="mt-6 text-center text-sm text-ink-muted">No visits recorded yet.</p>}
    </>
  )
}

function UpcomingCard({ visit, pet, today }: { visit: Visit; pet: Pet; today: string }) {
  const id = useId()
  const when = formatRelativeDays(daysBetween(today, visit.date))
  return (
    <section
      aria-labelledby={id}
      className="mt-6 flex flex-col gap-5 rounded-3xl bg-feature p-6 text-white lg:flex-row lg:items-center"
    >
      <div className="flex min-w-0 flex-1 items-center gap-5">
        <div
          aria-hidden="true"
          className={cx(
            'hidden size-16 shrink-0 flex-col items-center justify-center rounded-2xl md:flex',
            petTheme[pet.color].avatar,
          )}
        >
          <span className="text-xs font-bold">{formatMonthAbbr(visit.date)}</span>
          <span className="text-2xl leading-none font-extrabold">{formatDayOfMonth(visit.date)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-bold tracking-wider text-feature-label uppercase">Upcoming · {when}</p>
            <PetPill pet={pet} />
          </div>
          <h2 id={id} className="mt-2 text-xl font-extrabold tracking-tight md:text-2xl">
            {visit.title}
          </h2>
          <p className="mt-1 text-sm text-white/80">
            {formatWeekdayShortDate(visit.date)} · {formatTime(visit.time)} · {visit.clinic}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:flex">
        <Button variant="inverse">
          <span>
            Add questions<span className="hidden md:inline"> for the vet</span>
          </span>
        </Button>
        <Button variant="inverse-outline">Reschedule</Button>
      </div>
    </section>
  )
}

function TimelineItem({ visit, pet, last }: { visit: Visit; pet: Pet; last: boolean }) {
  const meta = visitMeta(visit)
  return (
    <li className="flex gap-4">
      <div aria-hidden="true" className="flex w-3.5 shrink-0 flex-col items-center pt-7">
        <span className={cx('size-3.5 shrink-0 rounded-full', petTheme[pet.color].dot)} />
        {!last && <span className="mt-1 w-0.5 flex-1 bg-line" />}
      </div>
      <Card as="article" className="mb-4 min-w-0 flex-1 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">{formatShortDate(visit.date)}</p>
          <PetPill pet={pet} />
        </div>
        <h3 className="mt-1 text-lg font-bold">{visit.title}</h3>
        <p className="mt-1 text-sm text-ink-soft">{visit.summary}</p>
        {meta.length > 0 && (
          <p className="mt-1 text-sm font-semibold text-primary">
            {visit.prescriptionIds.length > 0 ? (
              <Link to="/medications" className="inline-flex h-11 items-center hover:text-primary-dark">
                {meta.join(' · ')}
              </Link>
            ) : (
              <span className="inline-flex h-11 items-center">{meta.join(' · ')}</span>
            )}
          </p>
        )}
      </Card>
    </li>
  )
}

function VisitDetails({ visit }: { visit: Visit }) {
  const { pets, medications, addAttachment } = useAppState()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const pet = pets.find((p) => p.id === visit.petId)
  const prescribed = visit.prescriptionIds.flatMap((id) => medications.filter((m) => m.id === id))
  const label = 'mb-2 text-xs font-semibold tracking-wider text-ink-muted uppercase'

  return (
    <Card as="section" aria-label="Visit details" className="p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {formatWeekdayLongDate(visit.date)} · {visit.clinic}
        </p>
        {pet && <PetPill pet={pet} />}
      </div>
      <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{visit.title}</h2>

      <h3 className={cx(label, 'mt-6')}>Vet's notes</h3>
      <p className="text-sm leading-relaxed text-ink-soft">{visit.notes || 'No notes yet.'}</p>

      {prescribed.length > 0 && (
        <>
          <h3 className={cx(label, 'mt-6')}>Prescribed</h3>
          <ul className="space-y-2">
            {prescribed.map((med) => (
              <li key={med.id}>
                <Link
                  to="/medications"
                  className="flex min-h-14 items-center gap-3 rounded-2xl bg-bg px-3 py-2 text-sm hover:bg-divider"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                    <Pill className="size-4" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 font-medium text-ink">{prescriptionLabel(med)}</span>
                  <span className="font-semibold text-primary">View</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3 className={cx(label, 'mt-6')}>Attachments</h3>
      <ul className="flex flex-wrap gap-3">
        {visit.attachments.map((att) => (
          <li key={att.id}>
            <AttachmentTile attachment={att} className="size-24" />
          </li>
        ))}
        <li>
          <label
            className={cx(
              'flex size-24 items-center justify-center rounded-2xl border border-dashed border-ink-muted text-ink-soft hover:bg-bg has-focus-visible:outline-2 has-focus-visible:outline-primary',
              uploading && 'opacity-60',
            )}
          >
            <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
            <span className="sr-only">Add attachment</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              disabled={uploading}
              onChange={async (e) => {
                const input = e.currentTarget
                const file = input.files?.[0]
                input.value = ''
                if (!file) return
                setUploadError('')
                setUploading(true)
                try {
                  await addAttachment(visit.id, file)
                } catch (error) {
                  setUploadError(errorMessage(error))
                } finally {
                  setUploading(false)
                }
              }}
            />
          </label>
        </li>
      </ul>
      <p role="status" className="mt-2 text-xs text-ink-muted empty:hidden">
        {uploading ? 'Uploading…' : ''}
      </p>
      {uploadError && (
        <p role="alert" className="mt-2 rounded-xl bg-severe-tint px-3 py-2 text-sm text-severe">
          {uploadError}
        </p>
      )}
    </Card>
  )
}
