import { ChevronLeft, Pill } from 'lucide-react'
import { AttachmentTile } from '../components/AttachmentTile'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router'
import { Button, TextLink } from '../components/Button'
import { Card, SectionCard } from '../components/Card'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Field, FormError, inputClass } from '../components/Field'
import { VisitStatePill, VisitTypePill } from '../components/VisitPills'
import { chipClasses } from '../components/choice'
import { PetAvatar } from '../components/PetAvatar'
import { SeverityPill, severityDot } from '../components/StatusPill'
import { cx } from '../lib/cx'
import { errorMessage } from '../lib/api'
import { formatMediumDate, formatShortDate } from '../lib/format'
import { courseDay } from '../lib/meds'
import { petTheme } from '../lib/petTheme'
import { useIsDesktop } from '../lib/useMediaQuery'
import {
  PREVENTIVE_TYPES,
  completedVisits,
  formatVisitDate,
  lastAndNext,
  scheduledVisits,
  visitState,
  visitWhen,
} from '../lib/visits'
import { useAppState, type PetDetailsPatch } from '../state/AppStateContext'
import type { Pet } from '../types'

type Tab = 'overview' | 'health' | 'files'
const TABS: { value: Tab; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'health', label: 'Health' },
  { value: 'files', label: 'Files' },
]

export default function PetProfilePage() {
  const { petId } = useParams()
  const { pets } = useAppState()
  const pet = pets.find((p) => p.id === petId)

  if (!pet) {
    const first = pets[0]
    return <Navigate to={first ? `/pets/${first.id}` : '/'} replace />
  }
  // Keyed by pet so tab and edit state reset when switching pets.
  return <PetProfile key={pet.id} pet={pet} />
}

function PetProfile({ pet }: { pet: Pet }) {
  const { pets } = useAppState()
  const isDesktop = useIsDesktop()
  const [tab, setTab] = useState<Tab>('overview')
  const [editing, setEditing] = useState(false)
  const tabsId = useId()

  return (
    <>
      <Banner pet={pet} editing={editing} onEdit={() => setEditing((e) => !e)} />

      {editing && <EditPetForm pet={pet} onDone={() => setEditing(false)} />}

      {isDesktop ? (
        <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <ActiveMedsCard pet={pet} />
          <PreventiveCareCard pet={pet} />
          <CareDetailsCard pet={pet} />
          <VisitsCard pet={pet} />
          <SymptomsCard pet={pet} />
          <WeightTrendCard pet={pet} />
        </div>
      ) : (
        <>
          <nav aria-label="Switch pet" className="mt-5 flex flex-wrap gap-2">
            {pets.map((p) => (
              <Link
                key={p.id}
                to={`/pets/${p.id}`}
                aria-current={p.id === pet.id ? 'page' : undefined}
                className={chipClasses(p.id === pet.id, 'flex items-center gap-2 pr-4 pl-1.5')}
              >
                <PetAvatar pet={p} size="sm" />
                {p.name}
              </Link>
            ))}
          </nav>

          <div role="tablist" aria-label="Profile sections" className="mt-4 flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                type="button"
                role="tab"
                id={`${tabsId}-${t.value}-tab`}
                aria-selected={tab === t.value}
                aria-controls={`${tabsId}-${t.value}-panel`}
                onClick={() => setTab(t.value)}
                className={chipClasses(tab === t.value, 'px-5')}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div
            role="tabpanel"
            id={`${tabsId}-${tab}-panel`}
            aria-labelledby={`${tabsId}-${tab}-tab`}
            className="mt-4 space-y-4"
          >
            {tab === 'overview' && (
              <>
                <ActiveMedsCard pet={pet} />
                <PreventiveCareCard pet={pet} />
                <CareDetailsCard pet={pet} />
                <SymptomsCard pet={pet} title="Latest symptom" limit={1} />
              </>
            )}
            {tab === 'health' && (
              <>
                <VisitsCard pet={pet} />
                <SymptomsCard pet={pet} />
                <WeightTrendCard pet={pet} />
              </>
            )}
            {tab === 'files' && <FilesCard pet={pet} />}
          </div>
        </>
      )}
    </>
  )
}

function Banner({ pet, editing, onEdit }: { pet: Pet; editing: boolean; onEdit: () => void }) {
  const theme = petTheme[pet.color]
  const editButton = (label: string, className: string) => (
    <button
      type="button"
      aria-expanded={editing}
      onClick={onEdit}
      className={cx('h-11 shrink-0 rounded-full bg-white/60 px-5 text-sm font-semibold text-ink hover:bg-white md:rounded-xl md:bg-surface', className)}
    >
      {editing ? 'Close' : label}
    </button>
  )

  return (
    <section
      aria-labelledby="pet-name"
      className={cx('-mx-5 -mt-6 px-5 pt-6 pb-6 md:mx-0 md:mt-0 md:rounded-2xl md:p-6', theme.banner)}
    >
      <div className="mb-5 flex items-center justify-between md:hidden">
        <Link
          to="/"
          aria-label="Back to Today"
          className="flex size-11 items-center justify-center rounded-full bg-white/60 text-ink hover:bg-white"
        >
          <ChevronLeft className="size-5" strokeWidth={2} aria-hidden="true" />
        </Link>
        {editButton('Edit', '')}
      </div>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <PetAvatar pet={pet} size="xl" onBanner />
          <div className="min-w-0">
            <h1 id="pet-name" className="text-4xl font-extrabold tracking-tight text-ink">
              {pet.name}
            </h1>
            <p className={cx('mt-1 text-base', theme.ink)}>
              {pet.species} · {pet.breed} · {pet.sex}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-3 gap-3 lg:w-md">
          {[
            ['Age', pet.age],
            ['Weight', pet.weight],
            ['Neutered', pet.neutered ? 'Yes' : 'No'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/60 px-4 py-3">
              <dt className={cx('text-xs font-medium', theme.ink)}>{label}</dt>
              <dd className="mt-0.5 truncate text-lg font-bold text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        {editButton('Edit profile', 'hidden md:block')}
      </div>
    </section>
  )
}

function EditPetForm({ pet, onDone }: { pet: Pet; onDone: () => void }) {
  const { updatePet, deletePet, announce, medications, visits, symptoms } = useAppState()
  const id = useId()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [draft, setDraft] = useState<Required<PetDetailsPatch>>({
    age: pet.age,
    weight: pet.weight,
    neutered: pet.neutered,
    clinic: pet.clinic,
    lastVaccine: pet.lastVaccine,
    food: pet.food,
    allergies: pet.allergies,
  })
  const text = (key: Exclude<keyof PetDetailsPatch, 'neutered'>, label: string) => (
    <Field label={label} htmlFor={`${id}-${key}`}>
      <input
        id={`${id}-${key}`}
        className={inputClass}
        value={draft[key]}
        onChange={(e) => setDraft((d) => ({ ...d, [key]: e.target.value }))}
      />
    </Field>
  )

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    try {
      await updatePet(pet.id, draft)
      onDone()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    setDeleteError('')
    try {
      await deletePet(pet.id)
      // The profile redirects to another pet (or Today) once this pet is gone from state.
      announce(`${pet.name} was deleted.`)
    } catch (e) {
      setDeleteError(errorMessage(e))
      setDeleting(false)
    }
  }

  const petVisits = visits.filter((v) => v.petId === pet.id)
  const petSymptoms = symptoms.filter((s) => s.petId === pet.id)
  const fileCount = petVisits.reduce((n, v) => n + v.attachments.length, 0) + petSymptoms.filter((s) => s.photo).length
  const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
  const records = [
    count(medications.filter((m) => m.petId === pet.id).length, 'medication', 'medications'),
    count(petVisits.length, 'vet visit', 'vet visits'),
    count(petSymptoms.length, 'symptom entry', 'symptom entries'),
    ...(fileCount ? [count(fileCount, 'photo or file', 'photos and files')] : []),
  ]

  return (
    <Card as="section" aria-labelledby={`${id}-title`} className="mt-6 p-5 md:p-6">
      <h2 id={`${id}-title`} className="text-lg font-bold">
        Edit {pet.name}'s profile
      </h2>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {text('age', 'Age')}
        {text('weight', 'Weight')}
        {text('clinic', 'Vet clinic')}
        {text('lastVaccine', 'Last vaccine')}
        {text('food', 'Food')}
        {text('allergies', 'Allergies')}
        <label className="flex h-11 items-center gap-3 self-end text-sm font-semibold">
          <input
            type="checkbox"
            className="size-5 accent-primary"
            checked={draft.neutered}
            onChange={(e) => setDraft((d) => ({ ...d, neutered: e.target.checked }))}
          />
          Neutered
        </label>
        <FormError className="sm:col-span-2 xl:col-span-4">{error}</FormError>
        <div className="flex gap-3 self-end sm:col-span-2 xl:col-span-1">
          <Button type="submit" className="flex-1" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </Button>
          <Button variant="outline" onClick={onDone} className="flex-1">
            Cancel
          </Button>
        </div>
      </form>

      <div className="mt-6 flex flex-col gap-3 border-t border-divider pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ink-muted">Deleting {pet.name} also removes their medicines, vet visits and symptom log.</p>
        <Button variant="danger-outline" onClick={() => setConfirming(true)}>
          Delete {pet.name}
        </Button>
      </div>

      <ConfirmDialog
        open={confirming}
        title={`Delete ${pet.name}?`}
        confirmLabel={`Delete ${pet.name}`}
        busy={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setConfirming(false)
          setDeleteError('')
        }}
      >
        <p>This permanently deletes {pet.name}’s profile and everything recorded for them: {records.join(', ')}.</p>
        <p>This can’t be undone.</p>
      </ConfirmDialog>
    </Card>
  )
}

function ActiveMedsCard({ pet }: { pet: Pet }) {
  const { medications, today } = useAppState()
  const meds = medications.filter((m) => m.petId === pet.id && m.status === 'active')
  return (
    <SectionCard title="Active medications" action={<TextLink to="/medications">Manage</TextLink>}>
      {meds.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">No active medications.</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {meds.map((med) => (
            <li key={med.id} className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-tint text-primary">
                <Pill className="size-5" strokeWidth={2} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold text-ink">{med.name}</p>
                <p className="text-sm text-ink-muted">
                  {med.dose} · {med.frequency.toLowerCase()}
                  {med.tracking.kind === 'course' && ` · day ${courseDay(med, today)} of ${med.tracking.totalDays}`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}

function CareDetailsCard({ pet }: { pet: Pet }) {
  const rows: [string, string][] = [
    ['Vet clinic', pet.clinic],
    ['Last vaccine', pet.lastVaccine],
    ['Food', pet.food],
    ['Allergies', pet.allergies],
  ]
  return (
    <SectionCard title="Care details">
      <dl className="mt-2 divide-y divide-divider">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
            <dt className="text-ink-muted">{label}</dt>
            <dd className="text-right font-medium text-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  )
}

/** Bar chart of the last six recorded weights, latest highlighted. */
function WeightTrendCard({ pet, className }: { pet: Pet; className?: string }) {
  const records = pet.weightHistory.slice(-6)
  const latest = records.at(-1)

  if (!latest) {
    return (
      <SectionCard title="Weight trend" className={className}>
        <p className="mt-2 text-sm text-ink-muted">Weights recorded at each vet visit will appear here.</p>
      </SectionCard>
    )
  }

  const max = Math.max(...records.map((r) => r.kg))
  const barWidth = 40
  const gap = 16
  const height = 100
  const width = records.length * barWidth + (records.length - 1) * gap

  return (
    <SectionCard title="Weight trend" className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="mt-4 h-28 w-full"
        role="img"
        aria-label={`Weights: ${records.map((r) => `${formatShortDate(r.date)} ${r.kg} kg`).join(', ')}`}
        preserveAspectRatio="xMidYMax meet"
      >
        {records.map((r, i) => {
          const h = (r.kg / max) * (height - 4)
          return (
            <rect
              key={i}
              x={i * (barWidth + gap)}
              y={height - h}
              width={barWidth}
              height={h}
              rx={4}
              className={r === latest ? 'fill-primary' : 'fill-primary-tint'}
            />
          )
        })}
      </svg>
      <p className="mt-3 text-xs text-ink-muted">
        Latest: {latest.kg} kg on {formatShortDate(latest.date)}
      </p>
    </SectionCard>
  )
}

function VisitsCard({ pet }: { pet: Pet }) {
  const { visits, today } = useAppState()
  const mine = visits.filter((v) => v.petId === pet.id)
  const upcoming = scheduledVisits(mine)
  const past = completedVisits(mine)
  return (
    <SectionCard title="Vet visits" action={<TextLink to={`/visits?pet=${pet.id}&new=completed`}>Log visit</TextLink>}>
      {upcoming.length > 0 && (
        <ul aria-label={`${pet.name}’s appointments`} className="mt-2 space-y-2">
          {upcoming.slice(0, 2).map((v) => (
            <li key={v.id} className="flex items-center gap-3 rounded-xl bg-bg px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{v.title}</p>
                <p className="text-xs text-ink-muted">
                  {v.type} · {formatVisitDate(v)}
                </p>
              </div>
              <VisitStatePill state={visitState(v, today)} label={visitWhen(v, today)} />
            </li>
          ))}
        </ul>
      )}
      <DatedList
        empty={upcoming.length ? 'No past visits yet.' : 'No vet visits yet.'}
        items={past.slice(0, 4).map((v) => ({
          id: v.id,
          date: v.date,
          title: v.title,
          detail: v.diagnosis || v.treatment,
          trailing: <VisitTypePill type={v.type} />,
        }))}
      />
      {mine.length > 0 && <TextLink to={`/visits?pet=${pet.id}`}>Full history</TextLink>}
    </SectionCard>
  )
}

/** Last and next vaccination and deworming, so they're easy to find without scrolling the history. */
function PreventiveCareCard({ pet }: { pet: Pet }) {
  const { visits, today } = useAppState()
  return (
    <SectionCard title="Vaccines & deworming">
      <dl className="mt-1 divide-y divide-divider">
        {PREVENTIVE_TYPES.map((type) => {
          const { last, next } = lastAndNext(visits, pet.id, type)
          // Before any vaccination visit is logged, fall back to the profile's manual "Last vaccine" note.
          const lastText = last
            ? formatMediumDate(last.date)
            : type === 'Vaccination' && pet.lastVaccine
              ? pet.lastVaccine
              : 'None recorded'
          return (
            <div key={type} className="py-3">
              <dt className="text-sm font-semibold text-ink">{type}</dt>
              <dd className="mt-1 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="block text-xs text-ink-muted">Last</span>
                  <span className={last ? 'font-medium text-ink' : 'text-ink-muted'}>{lastText}</span>
                </div>
                <div>
                  <span className="block text-xs text-ink-muted">Next</span>
                  {next ? (
                    <span className={cx('font-medium', visitState(next, today) === 'overdue' ? 'text-warn-dark' : 'text-ink')}>
                      {formatShortDate(next.date)} · {visitWhen(next, today)}
                    </span>
                  ) : (
                    <TextLink to={`/visits?pet=${pet.id}&new=scheduled`} className="-mt-2.5">
                      Schedule<span className="sr-only"> {type.toLowerCase()}</span>
                    </TextLink>
                  )}
                </div>
              </dd>
            </div>
          )
        })}
      </dl>
    </SectionCard>
  )
}

function SymptomsCard({ pet, title = 'Symptom log', limit }: { pet: Pet; title?: string; limit?: number }) {
  const { symptoms } = useAppState()
  const entries = symptoms.filter((s) => s.petId === pet.id).slice(0, limit)
  return (
    <SectionCard title={title} action={<TextLink to="/log">Log new</TextLink>}>
      {limit === 1 && entries[0] ? (
        <div className="mt-2 flex gap-3">
          <span
            aria-hidden="true"
            className={cx('mt-1.5 size-3 shrink-0 rounded-full', severityDot[entries[0].severity])}
          />
          <div>
            <p className="font-semibold text-ink">
              {entries[0].title} · {entries[0].severity}
            </p>
            <p className="text-sm text-ink-muted">
              {formatShortDate(entries[0].date)}
              {entries[0].notes && ` · ${entries[0].notes}`}
            </p>
          </div>
        </div>
      ) : (
        <DatedList
          empty="Nothing logged yet."
          items={entries.map((s) => ({
            id: s.id,
            date: s.date,
            title: s.title,
            detail: s.notes,
            trailing: <SeverityPill severity={s.severity} />,
          }))}
        />
      )}
    </SectionCard>
  )
}

interface DatedItem {
  id: string
  date: string
  title: string
  detail: string
  trailing?: ReactNode
}

function DatedList({ items, empty }: { items: DatedItem[]; empty: string }) {
  if (items.length === 0) return <p className="mt-2 text-sm text-ink-muted">{empty}</p>
  return (
    <ul className="mt-2 divide-y divide-divider">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-4 py-3">
          <span className="w-12 shrink-0 pt-0.5 text-xs font-semibold text-ink-muted">{formatShortDate(item.date)}</span>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-ink">{item.title}</p>
            {item.detail && <p className="text-sm text-ink-muted">{item.detail}</p>}
          </div>
          {item.trailing}
        </li>
      ))}
    </ul>
  )
}

function FilesCard({ pet }: { pet: Pet }) {
  const { visits } = useAppState()
  const files = visits
    .filter((v) => v.petId === pet.id)
    .flatMap((v) => v.attachments.map((a) => ({ ...a, visit: v })))
  return (
    <SectionCard title="Files">
      {files.length === 0 ? (
        <p className="mt-2 text-sm text-ink-muted">
          Photos and receipts you attach to vet visits appear here.
        </p>
      ) : (
        <ul className="mt-3 grid grid-cols-3 gap-3">
          {files.map(({ visit, ...file }) => (
            <li key={file.id}>
              <AttachmentTile attachment={file} caption={formatShortDate(visit.date)} className="aspect-square" />
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  )
}
