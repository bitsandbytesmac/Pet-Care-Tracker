import { Camera, Download, X } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Field, Legend, inputClass, textareaClass } from '../components/Field'
import { PetAvatar } from '../components/PetAvatar'
import { SectionHeader } from '../components/SectionHeader'
import { SegmentedControl } from '../components/SegmentedControl'
import { SeverityPill } from '../components/StatusPill'
import { errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import { currentTime, formatShortDate, formatTime } from '../lib/format'
import { useAppState } from '../state/AppStateContext'
import { SEVERITIES, SYMPTOM_KINDS, type Pet, type Severity, type SymptomEntry, type SymptomKind } from '../types'

export default function LogPage() {
  const { pets, symptoms } = useAppState()
  const navigate = useNavigate()
  const location = useLocation()

  function close() {
    // "default" key means this page was the first one loaded — nothing to go back to.
    if (location.key === 'default') navigate('/')
    else navigate(-1)
  }

  return (
    <>
      <header className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Close"
          onClick={close}
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface md:hidden"
        >
          <X className="size-5" strokeWidth={2} aria-hidden="true" />
        </button>
        <div>
          <p className="hidden text-base text-ink-muted md:block">Track what you notice between vet visits</p>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
            <span className="md:hidden">Log a symptom</span>
            <span className="hidden md:inline">Symptom log</span>
          </h1>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-2 lg:items-start">
        <SymptomForm />
        <SymptomHistory entries={symptoms} pets={pets} />
      </div>
    </>
  )
}

function SymptomForm() {
  const { pets, addSymptom, today } = useAppState()
  const id = useId()
  const [petId, setPetId] = useState(pets[0]?.id ?? '')
  const [selected, setSelected] = useState<SymptomKind[]>([])
  const [severity, setSeverity] = useState<Severity>('Mild')
  const [date, setDate] = useState(today)
  const [time, setTime] = useState(currentTime)
  const [notes, setNotes] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  if (pets.length === 0) {
    return (
      <Card as="section" aria-label="New entry" className="p-5 text-sm text-ink-muted md:p-6">
        Add a pet first, then you can log their symptoms.
      </Card>
    )
  }

  function toggleSymptom(kind: SymptomKind) {
    setSelected((current) => (current.includes(kind) ? current.filter((k) => k !== kind) : [...current, kind]))
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved('')
    if (selected.length === 0) {
      setError('Pick at least one symptom.')
      return
    }
    setBusy(true)
    try {
      await addSymptom({ petId, date, time, symptoms: selected, severity, notes: notes.trim() }, photo ?? undefined)
      const pet = pets.find((p) => p.id === petId)
      setSaved(`Saved to ${pet?.name ?? 'your pet'}'s log`)
      setError('')
      setSelected([])
      setSeverity('Mild')
      setNotes('')
      setPhoto(null)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const count = selected.length

  return (
    <Card as="section" aria-labelledby={`${id}-title`} className="p-5 md:p-6">
      <h2 id={`${id}-title`} className="sr-only md:not-sr-only md:mb-4 md:text-lg md:font-bold">
        New entry
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <fieldset>
          <Legend>Which pet?</Legend>
          <div className="grid grid-cols-2 gap-3">
            {pets.map((pet) => {
              const active = pet.id === petId
              return (
                <button
                  key={pet.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setPetId(pet.id)}
                  className={cx(
                    'flex h-16 items-center gap-3 rounded-2xl border-2 bg-surface px-3 text-left text-base font-semibold transition-colors md:h-14',
                    active ? 'border-primary' : 'border-line hover:border-ink-muted',
                  )}
                >
                  <PetAvatar pet={pet} size="lg" className="md:size-9" />
                  {pet.name}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <Legend>What did you notice?</Legend>
          <div className="flex flex-wrap gap-2">
            {SYMPTOM_KINDS.map((kind) => {
              const active = selected.includes(kind)
              return (
                <button
                  key={kind}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSymptom(kind)}
                  className={cx(
                    'h-11 rounded-full border px-4 text-sm font-medium transition-colors',
                    active ? 'border-ink bg-ink text-white' : 'border-line bg-surface text-ink hover:bg-divider',
                  )}
                >
                  {kind}
                </button>
              )
            })}
          </div>
        </fieldset>

        <fieldset>
          <Legend>How bad is it?</Legend>
          <SegmentedControl
            label="Severity"
            value={severity}
            onChange={setSeverity}
            activeTone="primary"
            options={SEVERITIES.map((s) => ({ value: s, label: s }))}
          />
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date" htmlFor={`${id}-date`}>
            <input
              id={`${id}-date`}
              type="date"
              className={inputClass}
              value={date}
              max={today}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="Time" htmlFor={`${id}-time`}>
            <input
              id={`${id}-time`}
              type="time"
              className={inputClass}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Notes" htmlFor={`${id}-notes`}>
          <textarea
            id={`${id}-notes`}
            rows={3}
            className={textareaClass}
            placeholder="What happened, how long, anything that helped…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-severe-tint px-3 py-2 text-sm text-severe">
            {error}
          </p>
        )}
        <p role="status" className="rounded-xl bg-primary-tint px-3 py-2 text-sm font-semibold text-primary-dark empty:hidden">
          {saved}
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex h-12 items-center justify-center gap-2 rounded-xl border border-dashed border-ink-muted px-4 text-sm font-medium text-ink-soft hover:bg-bg has-focus-visible:outline-2 has-focus-visible:outline-primary">
            <Camera className="size-4 shrink-0" strokeWidth={2} aria-hidden="true" />
            <span className="truncate">{photo?.name ?? 'Add a photo'}</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button type="submit" className="h-12 text-base" disabled={busy}>
            Save entry{count > 0 && ` (${count} symptom${count > 1 ? 's' : ''})`}
          </Button>
        </div>
      </form>
    </Card>
  )
}

function SymptomHistory({ entries, pets }: { entries: SymptomEntry[]; pets: Pet[] }) {
  const id = useId()

  function exportForVet() {
    const lines = entries.map((e) => {
      const pet = pets.find((p) => p.id === e.petId)
      const notes = e.notes ? ` — ${e.notes}` : ''
      return `${formatShortDate(e.date)} ${formatTime(e.time)} · ${pet?.name ?? ''} · ${e.title} (${e.severity})${notes}`
    })
    const blob = new Blob([`Symptom log\n\n${lines.join('\n')}\n`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'symptom-log.txt'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card as="section" aria-labelledby={id} className="p-5 md:p-6">
      <SectionHeader
        id={id}
        title="History"
        action={
          <Button variant="outline" onClick={exportForVet}>
            <Download className="size-4" strokeWidth={2} aria-hidden="true" />
            Export for vet
          </Button>
        }
      />
      <ol aria-label="Symptom history" className="mt-3 divide-y divide-divider">
        {entries.map((entry) => {
          const pet = pets.find((p) => p.id === entry.petId)
          return (
            <li key={entry.id} className="flex items-start gap-3 py-4">
              <span className="w-12 shrink-0 pt-1 text-xs font-semibold text-ink-muted">
                {formatShortDate(entry.date)}
              </span>
              {pet && <PetAvatar pet={pet} size="sm" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink">
                  <span className="sr-only">{pet?.name}: </span>
                  {entry.title}
                </p>
                {entry.notes && <p className="text-xs text-ink-muted">{entry.notes}</p>}
                {entry.photo?.url && (
                  <a
                    href={entry.photo.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-11 items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-dark"
                  >
                    <Camera className="size-3.5" strokeWidth={2} aria-hidden="true" />
                    View photo
                  </a>
                )}
              </div>
              <SeverityPill severity={entry.severity} />
            </li>
          )
        })}
      </ol>
    </Card>
  )
}
