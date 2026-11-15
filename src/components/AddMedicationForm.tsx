import { useId, useState, type FormEvent } from 'react'
import { errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import { parseTimeList } from '../lib/format'
import { useAppState } from '../state/AppStateContext'
import { FREQUENCIES, type Frequency } from '../types'
import { Button } from './Button'
import { Card } from './Card'
import { Field, FormError, FormStatus, inputClass } from './Field'

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
  const [busy, setBusy] = useState(false)

  if (pets.length === 0) {
    return (
      <Card as="section" aria-label="Add medication" className={cx('p-5 text-sm text-ink-muted md:p-6', className)}>
        Add a pet first, then you can add their medicines.
      </Card>
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    setBusy(true)
    try {
      const med = await addMedication({
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
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card as="section" aria-labelledby={headingId} className={className}>
      <form onSubmit={handleSubmit} className="space-y-4 p-5 md:p-6" noValidate>
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
          <Field label="For how long" htmlFor={`${id}-duration`} hint="Leave blank if ongoing.">
            <input
              id={`${id}-duration`}
              className={inputClass}
              placeholder="e.g. 10 days"
              aria-describedby={`${id}-duration-hint`}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Reminder times" htmlFor={`${id}-times`} hint="Separate times with commas.">
          <input
            id={`${id}-times`}
            className={inputClass}
            value={times}
            onChange={(e) => setTimes(e.target.value)}
            aria-describedby={`${id}-times-hint`}
          />
        </Field>

        <FormError>{error}</FormError>
        <FormStatus>{saved}</FormStatus>

        <Button type="submit" block disabled={busy}>
          {busy ? 'Saving…' : 'Save medication'}
        </Button>
      </form>
    </Card>
  )
}
