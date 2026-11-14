import { useId, useState, type FormEvent } from 'react'
import { parseTimeList } from '../lib/format'
import { useAppState } from '../state/AppStateContext'
import type { Frequency } from '../types'
import { Button } from './Button'
import { Card } from './Card'
import { Field, inputClass } from './Field'

const FREQUENCIES: Frequency[] = ['Once daily', 'Twice daily', 'Three times daily', 'As needed']

const defaultTimes: Record<Frequency, string> = {
  'Once daily': '8:00 AM',
  'Twice daily': '8:00 AM, 8:00 PM',
  'Three times daily': '8:00 AM, 2:00 PM, 8:00 PM',
  'As needed': '',
}

export function AddMedicationForm({ className }: { className?: string }) {
  const { pets, addMedication } = useAppState()
  const id = useId()
  const headingId = `${id}-heading`

  const [name, setName] = useState('')
  const [petId, setPetId] = useState(pets[0]?.id ?? '')
  const [dose, setDose] = useState('')
  const [frequency, setFrequency] = useState<Frequency>('Once daily')
  const [duration, setDuration] = useState('')
  const [times, setTimes] = useState(defaultTimes['Once daily'])
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaved('')
    const reminderTimes = parseTimeList(times)
    if (!name.trim() || !dose.trim()) {
      setError('Add a medicine name and a dose.')
      return
    }
    if (reminderTimes === null) {
      setError('Reminder times should look like "8:00 AM, 8:00 PM".')
      return
    }
    const days = Number.parseInt(duration, 10)
    const med = addMedication({
      name: name.trim(),
      petId,
      dose: dose.trim(),
      frequency,
      reminderTimes,
      totalDays: Number.isFinite(days) && days > 0 ? days : undefined,
    })
    const pet = pets.find((p) => p.id === petId)
    setError('')
    setSaved(`${med.name} added for ${pet?.name ?? 'your pet'}.`)
    setName('')
    setDose('')
    setDuration('')
  }

  return (
    <Card as="section" aria-labelledby={headingId} className={className}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5" noValidate>
        <h2 id={headingId} className="text-lg font-bold">
          Add medication
        </h2>

        <Field label="Medicine name" htmlFor={`${id}-name`}>
          <input
            id={`${id}-name`}
            className={inputClass}
            placeholder="e.g. Ear drops"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Pet" htmlFor={`${id}-pet`}>
            <select id={`${id}-pet`} className={inputClass} value={petId} onChange={(e) => setPetId(e.target.value)}>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Dose" htmlFor={`${id}-dose`}>
            <input
              id={`${id}-dose`}
              className={inputClass}
              placeholder="e.g. 1 tablet"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="How often" htmlFor={`${id}-frequency`}>
            <select
              id={`${id}-frequency`}
              className={inputClass}
              value={frequency}
              onChange={(e) => {
                const next = e.target.value as Frequency
                setFrequency(next)
                setTimes(defaultTimes[next])
              }}
            >
              {FREQUENCIES.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </select>
          </Field>
          <Field label="For how long" htmlFor={`${id}-duration`}>
            <input
              id={`${id}-duration`}
              className={inputClass}
              placeholder="e.g. 10 days"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Reminder times" htmlFor={`${id}-times`}>
          <input
            id={`${id}-times`}
            className={inputClass}
            value={times}
            onChange={(e) => setTimes(e.target.value)}
            aria-describedby={`${id}-times-hint`}
          />
          <p id={`${id}-times-hint`} className="mt-1 text-xs text-ink-muted">
            Separate times with commas.
          </p>
        </Field>

        {error && (
          <p role="alert" className="rounded-xl bg-severe-tint px-3 py-2 text-sm text-severe">
            {error}
          </p>
        )}
        <p role="status" className="text-sm font-semibold text-primary-dark empty:hidden">
          {saved}
        </p>

        <Button type="submit" block>
          Save medication
        </Button>
      </form>
    </Card>
  )
}
