import { useId, useState, type FormEvent } from 'react'
import { errorMessage } from '../lib/api'
import { cx } from '../lib/cx'
import { formatShortDate } from '../lib/format'
import { reminderLabel } from '../lib/visits'
import { useAppState } from '../state/AppStateContext'
import { REMINDER_DAYS, VISIT_TYPES, type Visit, type VisitInput, type VisitStatus, type VisitType } from '../types'
import { Button } from './Button'
import { Card } from './Card'
import { ConfirmDialog } from './ConfirmDialog'
import { Field, FormError, inputClass, textareaClass } from './Field'
import { SegmentedControl } from './SegmentedControl'

interface VisitFormProps {
  /** The visit being edited; omit to log a new one. */
  visit?: Visit
  /** Starting status: "completed" to log a past visit, "scheduled" to book one. Also used for "Mark as done". */
  initialStatus?: VisitStatus
  /** Preselected pet for a new visit. */
  initialPetId?: string
  /** Called after saving (with the visit), deleting, or cancelling. */
  onDone: (saved?: Visit) => void
  className?: string
}

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Past visit' },
  { value: 'scheduled', label: 'Upcoming' },
] as const

const NO_REMINDER = 'none'

/** Log a past vet visit, schedule an appointment, or edit/delete an existing visit. */
export function VisitForm({ visit, initialStatus, initialPetId, onDone, className }: VisitFormProps) {
  const { pets, today, addVisit, updateVisit, deleteVisit, announce } = useAppState()
  const id = useId()
  const editing = Boolean(visit)

  const startPet = pets.find((p) => p.id === (visit?.petId ?? initialPetId)) ?? pets[0]
  const [status, setStatus] = useState<VisitStatus>(initialStatus ?? visit?.status ?? 'completed')
  const [petId, setPetId] = useState(startPet?.id ?? '')
  const [type, setType] = useState<VisitType>(visit?.type ?? 'General checkup')
  const [title, setTitle] = useState(visit?.title ?? '')
  const [date, setDate] = useState(visit?.date ?? today)
  const [time, setTime] = useState(visit?.time ?? '')
  const [clinic, setClinic] = useState(visit?.clinic ?? startPet?.clinic ?? '')
  const [diagnosis, setDiagnosis] = useState(visit?.diagnosis ?? '')
  const [treatment, setTreatment] = useState(visit?.treatment ?? '')
  const [cost, setCost] = useState(visit?.cost === null || visit?.cost === undefined ? '' : String(visit.cost))
  const [reminder, setReminder] = useState(
    visit?.reminderDays === null || visit?.reminderDays === undefined ? (visit ? NO_REMINDER : '1') : String(visit.reminderDays),
  )
  const [notes, setNotes] = useState(visit?.notes ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  const scheduled = status === 'scheduled'
  const markingDone = visit?.status === 'scheduled' && status === 'completed'
  const heading = markingDone
    ? 'Mark visit as done'
    : editing
      ? 'Edit visit'
      : scheduled
        ? 'Schedule an appointment'
        : 'Log a vet visit'

  function changePet(next: string) {
    // Follow the pet's usual clinic unless the user has typed their own.
    const previousClinic = pets.find((p) => p.id === petId)?.clinic ?? ''
    if (!editing && clinic === previousClinic) setClinic(pets.find((p) => p.id === next)?.clinic ?? '')
    setPetId(next)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const parsedCost = cost.trim() === '' ? null : Number(cost.replace(/,/g, ''))
    if (!title.trim()) return setError('Add the reason for the visit.')
    if (!date) return setError('Pick a date.')
    if (!scheduled && date > today) return setError('A past visit can’t be in the future. Choose “Upcoming” to schedule it.')
    if (scheduled && date < today && date !== visit?.date) return setError('Pick today or a later date for an appointment.')
    if (parsedCost !== null && (!Number.isFinite(parsedCost) || parsedCost < 0)) return setError('Cost should be a number, like 850 or 1250.50.')

    const input: VisitInput = {
      petId,
      type,
      status,
      date,
      time: time || null,
      title: title.trim(),
      clinic: clinic.trim(),
      diagnosis: diagnosis.trim(),
      treatment: treatment.trim(),
      notes: notes.trim(),
      cost: parsedCost,
      reminderDays: scheduled && reminder !== NO_REMINDER ? Number(reminder) : null,
    }

    setBusy(true)
    setError('')
    try {
      const saved = visit ? await updateVisit(visit.id, input) : await addVisit(input)
      const pet = pets.find((p) => p.id === saved.petId)
      announce(
        visit
          ? 'Visit updated.'
          : scheduled
            ? `Appointment scheduled for ${pet?.name ?? 'your pet'} on ${formatShortDate(saved.date)}.`
            : `Visit saved to ${pet?.name ?? 'your pet'}’s history.`,
      )
      onDone(saved)
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!visit) return
    setDeleting(true)
    setDeleteError('')
    try {
      await deleteVisit(visit.id)
      setConfirming(false)
      announce('Visit deleted.')
      onDone()
    } catch (e) {
      setDeleteError(errorMessage(e))
      setDeleting(false)
    }
  }

  const attachmentCount = visit?.attachments.length ?? 0

  return (
    <Card as="section" aria-labelledby={`${id}-title`} className={className}>
      <form onSubmit={handleSubmit} className="space-y-5 p-5 md:p-6" noValidate>
        <h2 id={`${id}-title`} className="text-lg font-bold">
          {heading}
        </h2>

        <SegmentedControl
          label="Visit status"
          className="w-full sm:w-fit"
          value={status}
          onChange={(next) => {
            setStatus(next)
            setError('')
          }}
          options={STATUS_OPTIONS}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pet" htmlFor={`${id}-pet`}>
            <select id={`${id}-pet`} className={inputClass} value={petId} onChange={(e) => changePet(e.target.value)}>
              {pets.map((pet) => (
                <option key={pet.id} value={pet.id}>
                  {pet.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Visit type" htmlFor={`${id}-type`}>
            <select
              id={`${id}-type`}
              className={inputClass}
              value={type}
              onChange={(e) => setType(e.target.value as VisitType)}
            >
              {VISIT_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>

          <Field label="Reason for visit" htmlFor={`${id}-title-input`} className="sm:col-span-2">
            <input
              id={`${id}-title-input`}
              className={inputClass}
              placeholder={scheduled ? 'e.g. Annual vaccines' : 'e.g. Ear irritation'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </Field>

          <Field label="Date" htmlFor={`${id}-date`}>
            <input
              id={`${id}-date`}
              type="date"
              className={inputClass}
              value={date}
              min={scheduled ? today : undefined}
              max={scheduled ? undefined : today}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </Field>
          <Field label="Time" htmlFor={`${id}-time`} optional>
            <input
              id={`${id}-time`}
              type="time"
              className={inputClass}
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </Field>

          <Field label="Vet or clinic" htmlFor={`${id}-clinic`} optional className="sm:col-span-2">
            <input
              id={`${id}-clinic`}
              className={inputClass}
              placeholder="e.g. Dr. Santos, Happy Paws Clinic"
              value={clinic}
              onChange={(e) => setClinic(e.target.value)}
            />
          </Field>

          {scheduled ? (
            <Field
              label="Reminder"
              htmlFor={`${id}-reminder`}
              hint="Shown on your Today screen. Phone notifications aren’t available yet."
              className="sm:col-span-2"
            >
              <select
                id={`${id}-reminder`}
                className={inputClass}
                value={reminder}
                aria-describedby={`${id}-reminder-hint`}
                onChange={(e) => setReminder(e.target.value)}
              >
                <option value={NO_REMINDER}>{reminderLabel(null)}</option>
                {REMINDER_DAYS.map((d) => (
                  <option key={d} value={String(d)}>
                    {reminderLabel(d)}
                  </option>
                ))}
              </select>
            </Field>
          ) : (
            <>
              <Field label="Diagnosis or findings" htmlFor={`${id}-diagnosis`} optional className="sm:col-span-2">
                <textarea
                  id={`${id}-diagnosis`}
                  rows={2}
                  className={textareaClass}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                />
              </Field>
              <Field label="Treatment or medication" htmlFor={`${id}-treatment`} optional className="sm:col-span-2">
                <textarea
                  id={`${id}-treatment`}
                  rows={2}
                  className={textareaClass}
                  placeholder="e.g. Rabies vaccine; ear drops twice daily for 10 days"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                />
              </Field>
              <Field label="Cost" htmlFor={`${id}-cost`} optional>
                <input
                  id={`${id}-cost`}
                  inputMode="decimal"
                  className={inputClass}
                  placeholder="e.g. 850"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                />
              </Field>
            </>
          )}

          <Field label="Notes" htmlFor={`${id}-notes`} optional className="sm:col-span-2">
            <textarea
              id={`${id}-notes`}
              rows={2}
              className={textareaClass}
              placeholder={scheduled ? 'Questions to ask, things to bring…' : 'Follow-up advice, next steps…'}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </div>

        <FormError>{error}</FormError>

        <div className={cx('flex flex-col-reverse gap-3 sm:flex-row sm:items-center', editing ? 'sm:justify-between' : 'sm:justify-end')}>
          {editing && (
            <Button variant="danger-outline" onClick={() => setConfirming(true)}>
              Delete visit
            </Button>
          )}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onDone()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 sm:flex-none" disabled={busy}>
              {busy ? 'Saving…' : scheduled && !editing ? 'Schedule' : 'Save visit'}
            </Button>
          </div>
        </div>
      </form>

      {visit && (
        <ConfirmDialog
          open={confirming}
          title="Delete this visit?"
          confirmLabel="Delete visit"
          busy={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => {
            setConfirming(false)
            setDeleteError('')
          }}
        >
          <p>
            “{visit.title}” on {formatShortDate(visit.date)} will be permanently removed
            {attachmentCount > 0 && `, along with its ${attachmentCount} attachment${attachmentCount === 1 ? '' : 's'}`}.
          </p>
          {visit.prescriptionIds.length > 0 && <p>Medicines prescribed at this visit stay in Medications.</p>}
          <p>This can’t be undone.</p>
        </ConfirmDialog>
      )}
    </Card>
  )
}
