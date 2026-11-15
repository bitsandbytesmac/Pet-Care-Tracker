import { Bell, ChevronDown, Pill, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { AttachmentTile } from '../components/AttachmentTile'
import { Button, ButtonLink } from '../components/Button'
import { Card } from '../components/Card'
import { FormError, FormStatus, inputClass } from '../components/Field'
import { FilterPills } from '../components/FilterPills'
import { PageHeader } from '../components/PageHeader'
import { PetPill } from '../components/PetAvatar'
import { SectionHeader } from '../components/SectionHeader'
import { VisitForm } from '../components/VisitForm'
import { VisitStatePill, VisitTypePill } from '../components/VisitPills'
import { errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import { formatDayOfMonth, formatMonthAbbr, formatShortDate, formatWeekdayLongDate } from '../lib/format'
import { prescriptionLabel } from '../lib/meds'
import { petTheme } from '../lib/petTheme'
import { useIsDesktop } from '../lib/useMediaQuery'
import {
  completedVisits,
  formatCost,
  formatVisitDate,
  reminderActive,
  reminderLabel,
  scheduledVisits,
  visitState,
  visitWhen,
} from '../lib/visits'
import { useAppState } from '../state/AppStateContext'
import { VISIT_TYPES, type Pet, type Visit, type VisitStatus, type VisitType } from '../types'

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

/** Which visit is open in a form, and with which starting status ("completed" = Mark as done). */
type Editing = { id: string; status?: VisitStatus } | null

export default function VisitsPage() {
  const { visits, pets, today } = useAppState()
  const isDesktop = useIsDesktop()
  const [params, setParams] = useSearchParams()

  // Links from elsewhere can preselect a pet (?pet=) and open the form (?new=completed|scheduled).
  const petParam = params.get('pet')
  const [petFilter, setPetFilter] = useState<string>(pets.some((p) => p.id === petParam) ? petParam! : ALL)
  const [typeFilter, setTypeFilter] = useState<VisitType | typeof ALL>(ALL)
  const newParam = params.get('new')
  const [newForm, setNewForm] = useState<VisitStatus | null>(
    pets.length && (newParam === 'completed' || newParam === 'scheduled') ? newParam : null,
  )
  const [editing, setEditing] = useState<Editing>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const typeFilterId = useId()

  const matches = (v: Visit) =>
    (petFilter === ALL || v.petId === petFilter) && (typeFilter === ALL || v.type === typeFilter)
  const upcoming = scheduledVisits(visits.filter(matches))
  const history = completedVisits(visits.filter(matches))
  const selected = history.find((v) => v.id === selectedId) ?? history[0]
  const petFor = (visit: Visit) => pets.find((p) => p.id === visit.petId)

  function openNew(status: VisitStatus) {
    setEditing(null)
    setNewForm(status)
  }

  function closeNew(saved?: Visit) {
    setNewForm(null)
    if (params.has('new')) {
      const next = new URLSearchParams(params)
      next.delete('new')
      setParams(next, { replace: true })
    }
    if (saved) showVisit(saved)
  }

  /** Make sure a just-saved visit is visible: clear filters that would hide it and select it. */
  function showVisit(saved: Visit) {
    if (petFilter !== ALL && petFilter !== saved.petId) setPetFilter(ALL)
    if (typeFilter !== ALL && typeFilter !== saved.type) setTypeFilter(ALL)
    if (saved.status === 'completed') setSelectedId(saved.id)
  }

  function closeEdit(saved?: Visit) {
    setEditing(null)
    if (saved) showVisit(saved)
  }

  if (pets.length === 0) {
    return (
      <>
        <PageHeader title="Vet visits" subtitle="Appointments and history" />
        <Card className="mt-6 flex flex-col items-start gap-4 p-6 md:flex-row md:items-center">
          <p className="flex-1 text-sm text-ink-muted">Add a pet first, then you can log their vet visits and appointments.</p>
          <ButtonLink to="/pets/new">Add a pet</ButtonLink>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Vet visits"
        subtitle="Appointments and history"
        actions={
          <Button onClick={() => openNew('completed')} aria-expanded={newForm !== null}>
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Log vet visit
          </Button>
        }
      />

      {newForm && (
        <VisitForm
          key={newForm}
          className="mt-6 max-w-3xl"
          initialStatus={newForm}
          initialPetId={petFilter === ALL ? undefined : petFilter}
          onDone={closeNew}
        />
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <FilterPills
          label="Filter visits by pet"
          value={petFilter}
          onChange={setPetFilter}
          options={[{ value: ALL, label: 'All' }, ...pets.map((p) => ({ value: p.id, label: p.name }))]}
        />
        <div className="flex items-center gap-2">
          <label htmlFor={typeFilterId} className="text-sm font-semibold text-ink">
            Type
          </label>
          <select
            id={typeFilterId}
            className={cx(inputClass, 'w-auto min-w-40')}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as VisitType | typeof ALL)}
          >
            <option value={ALL}>All types</option>
            {VISIT_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      <UpcomingSection
        visits={upcoming}
        pets={pets}
        today={today}
        editing={editing}
        onEdit={setEditing}
        onCloseEdit={closeEdit}
        onSchedule={() => openNew('scheduled')}
      />

      <section aria-labelledby="history-heading" className="mt-8">
        <SectionHeader id="history-heading" title="History" />
        {history.length === 0 ? (
          <EmptyNote className="mt-2">
            {petFilter === ALL && typeFilter === ALL
              ? 'No past visits yet. Use “Log vet visit” to record one.'
              : 'No past visits match these filters.'}
          </EmptyNote>
        ) : isDesktop ? (
          <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start">
            <ul aria-label="Visit history" className="space-y-3">
              {history.map((visit) => {
                const pet = petFor(visit)
                const isSelected = visit.id === selected?.id
                return (
                  <li key={visit.id}>
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => {
                        setSelectedId(visit.id)
                        if (editing?.id !== visit.id) setEditing(null)
                      }}
                      className={cx(
                        'flex w-full items-center gap-4 rounded-xl border bg-surface px-4 py-3.5 text-left transition-colors',
                        isSelected ? 'border-primary ring-1 ring-primary' : 'border-line hover:border-ink-muted/60',
                      )}
                    >
                      <span className="w-14 shrink-0 text-sm text-ink-muted">{formatShortDate(visit.date)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-ink">{visit.title}</span>
                        <span className="block text-xs text-ink-muted">
                          {[visit.type, ...visitMeta(visit)].join(' · ')}
                        </span>
                      </span>
                      {pet && <PetPill pet={pet} />}
                    </button>
                  </li>
                )
              })}
            </ul>
            {selected &&
              (editing?.id === selected.id ? (
                <VisitForm key={selected.id} visit={selected} onDone={closeEdit} />
              ) : (
                <Card as="section" aria-label="Visit details" className="p-6">
                  <VisitDetails visit={selected} onEdit={() => setEditing({ id: selected.id })} />
                </Card>
              ))}
          </div>
        ) : (
          <ol aria-label="Visit history" className="mt-3">
            {history.map((visit, index) => {
              const pet = petFor(visit)
              if (!pet) return null
              return editing?.id === visit.id ? (
                <li key={visit.id} className="mb-4">
                  <VisitForm visit={visit} onDone={closeEdit} />
                </li>
              ) : (
                <TimelineItem
                  key={visit.id}
                  visit={visit}
                  pet={pet}
                  last={index === history.length - 1}
                  onEdit={() => setEditing({ id: visit.id })}
                />
              )
            })}
          </ol>
        )}
      </section>
    </>
  )
}

function EmptyNote({ children, className }: { children: string; className?: string }) {
  return (
    <p className={cx('rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-ink-muted', className)}>
      {children}
    </p>
  )
}

interface UpcomingSectionProps {
  visits: Visit[]
  pets: Pet[]
  today: string
  editing: Editing
  onEdit: (editing: Editing) => void
  onCloseEdit: (saved?: Visit) => void
  onSchedule: () => void
}

function UpcomingSection({ visits, pets, today, editing, onEdit, onCloseEdit, onSchedule }: UpcomingSectionProps) {
  return (
    <section aria-labelledby="upcoming-heading" className="mt-8">
      <SectionHeader
        id="upcoming-heading"
        title="Upcoming"
        action={
          <Button variant="outline" onClick={onSchedule}>
            <Plus className="size-4" strokeWidth={2} aria-hidden="true" />
            Schedule
          </Button>
        }
      />
      {visits.length === 0 ? (
        <EmptyNote className="mt-2">No appointments scheduled. Book vaccinations, deworming or checkups so they aren’t missed.</EmptyNote>
      ) : (
        <ul aria-label="Upcoming appointments" className="mt-3 grid gap-4 xl:grid-cols-2">
          {visits.map((visit) => {
            const pet = pets.find((p) => p.id === visit.petId)
            if (!pet) return null
            return (
              <li key={visit.id} className={cx(editing?.id === visit.id && 'xl:col-span-2')}>
                {editing?.id === visit.id ? (
                  <VisitForm visit={visit} initialStatus={editing.status} onDone={onCloseEdit} />
                ) : (
                  <AppointmentCard
                    visit={visit}
                    pet={pet}
                    today={today}
                    onEdit={() => onEdit({ id: visit.id })}
                    onMarkDone={() => onEdit({ id: visit.id, status: 'completed' })}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

interface AppointmentCardProps {
  visit: Visit
  pet: Pet
  today: string
  onEdit: () => void
  onMarkDone: () => void
}

function AppointmentCard({ visit, pet, today, onEdit, onMarkDone }: AppointmentCardProps) {
  const id = useId()
  const state = visitState(visit, today)
  const due = visit.date <= today
  const reminding = reminderActive(visit, today)
  return (
    <Card
      as="article"
      aria-labelledby={id}
      className={cx('flex h-full gap-4 p-4 md:p-5', state === 'overdue' && 'border-warn-line')}
    >
      <div
        aria-hidden="true"
        className={cx('flex size-14 shrink-0 flex-col items-center justify-center rounded-xl', petTheme[pet.color].avatar)}
      >
        <span className="text-xs font-bold">{formatMonthAbbr(visit.date)}</span>
        <span className="text-xl leading-none font-extrabold">{formatDayOfMonth(visit.date)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <VisitStatePill state={state} label={visitWhen(visit, today)} />
          <VisitTypePill type={visit.type} />
        </div>
        <h3 id={id} className="mt-2 font-bold text-ink">
          {visit.title}
        </h3>
        <p className="text-sm text-ink-muted">
          {[pet.name, formatVisitDate(visit), visit.clinic].filter(Boolean).join(' · ')}
        </p>
        {visit.reminderDays !== null && (
          <p className={cx('mt-1 flex items-center gap-1.5 text-xs', reminding ? 'font-semibold text-primary-dark' : 'text-ink-muted')}>
            <Bell className="size-3.5 shrink-0" strokeWidth={2} aria-hidden="true" />
            Reminder: {reminderLabel(visit.reminderDays).toLowerCase()}
          </p>
        )}
        {visit.notes && <p className="mt-2 text-sm text-ink-soft">{visit.notes}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {due && (
            <Button onClick={onMarkDone} aria-describedby={id}>
              Mark as done
            </Button>
          )}
          <Button variant="outline" onClick={onEdit} aria-describedby={id}>
            Edit
          </Button>
        </div>
      </div>
    </Card>
  )
}

function TimelineItem({ visit, pet, last, onEdit }: { visit: Visit; pet: Pet; last: boolean; onEdit: () => void }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const meta = visitMeta(visit)
  return (
    <li className="flex gap-4">
      <div aria-hidden="true" className="flex w-3.5 shrink-0 flex-col items-center pt-7">
        <span className={cx('size-3.5 shrink-0 rounded-full', petTheme[pet.color].dot)} />
        {!last && <span className="mt-1 w-0.5 flex-1 bg-line" />}
      </div>
      <Card as="article" aria-labelledby={`${id}-title`} className="mb-4 min-w-0 flex-1">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`${id}-details`}
          onClick={() => setOpen((o) => !o)}
          className="block w-full rounded-2xl p-5 text-left"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-muted">{formatShortDate(visit.date)}</span>
            <span className="flex items-center gap-2">
              <PetPill pet={pet} />
              <ChevronDown
                className={cx('size-5 text-ink-muted transition-transform', open && 'rotate-180')}
                strokeWidth={2}
                aria-hidden="true"
              />
            </span>
          </span>
          <span id={`${id}-title`} className="mt-1 block text-lg font-bold text-ink">
            {visit.title}
          </span>
          <span className="mt-1 block text-sm text-ink-muted">{[visit.type, ...meta].join(' · ')}</span>
        </button>
        {open && (
          <div id={`${id}-details`} className="border-t border-divider px-5 pt-4 pb-5">
            <VisitDetails visit={visit} onEdit={onEdit} compact />
          </div>
        )}
      </Card>
    </li>
  )
}

/** Full record of one visit. `compact` drops the heading block (the timeline card already shows it). */
function VisitDetails({ visit, onEdit, compact = false }: { visit: Visit; onEdit: () => void; compact?: boolean }) {
  const { pets, medications, addAttachment } = useAppState()
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const pet = pets.find((p) => p.id === visit.petId)
  const prescribed = visit.prescriptionIds.flatMap((id) => medications.filter((m) => m.id === id))
  const label = 'mb-1.5 text-xs font-semibold tracking-wider text-ink-muted uppercase'
  const textBlocks: [string, string][] = [
    ['Diagnosis or findings', visit.diagnosis],
    ['Treatment or medication', visit.treatment],
    ['Notes', visit.notes],
  ]
  const hasText = textBlocks.some(([, value]) => value)

  return (
    <>
      {!compact && (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-ink-muted">
              {[formatWeekdayLongDate(visit.date), visit.clinic].filter(Boolean).join(' · ')}
            </p>
            {pet && <PetPill pet={pet} />}
          </div>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight">{visit.title}</h2>
        </>
      )}
      <div className={cx('flex flex-wrap items-center justify-between gap-3', !compact && 'mt-3')}>
        <div className="flex flex-wrap items-center gap-2">
          <VisitTypePill type={visit.type} />
          {compact && visit.clinic && <span className="text-sm text-ink-muted">{visit.clinic}</span>}
        </div>
        <Button variant="outline" onClick={onEdit} aria-label={`Edit ${visit.title}`}>
          Edit
        </Button>
      </div>

      {textBlocks.map(
        ([title, value]) =>
          value && (
            <div key={title} className="mt-5">
              <h3 className={label}>{title}</h3>
              <p className="text-sm leading-relaxed whitespace-pre-line text-ink-soft">{value}</p>
            </div>
          ),
      )}
      {!hasText && prescribed.length === 0 && (
        <p className="mt-5 text-sm text-ink-muted">No findings or treatment recorded yet. Use Edit to add them.</p>
      )}

      {prescribed.length > 0 && (
        <div className="mt-5">
          <h3 className={label}>Prescribed</h3>
          <ul className="space-y-2">
            {prescribed.map((med) => (
              <li key={med.id}>
                <Link
                  to="/medications"
                  className="flex min-h-14 items-center gap-3 rounded-xl bg-bg px-3 py-2 text-sm hover:bg-divider"
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
        </div>
      )}

      {visit.cost !== null && (
        <div className="mt-5">
          <h3 className={label}>Cost</h3>
          <p className="text-sm font-semibold text-ink">{formatCost(visit.cost)}</p>
        </div>
      )}

      <div className="mt-5">
        <h3 className={label}>Attachments</h3>
        <ul className="flex flex-wrap gap-3">
          {visit.attachments.map((att) => (
            <li key={att.id}>
              <AttachmentTile attachment={att} className="size-24" />
            </li>
          ))}
          <li>
            <label
              className={cx(
                'flex size-24 items-center justify-center rounded-xl border border-dashed border-ink-muted text-ink-soft hover:bg-bg has-focus-visible:outline-2 has-focus-visible:outline-primary',
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
        <FormStatus className="mt-3">{uploading ? 'Uploading…' : ''}</FormStatus>
        <FormError className="mt-3">{uploadError}</FormError>
      </div>
    </>
  )
}
