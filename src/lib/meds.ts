import type { Dose, DoseStatus, Medication, Pet } from '../types'
import { daysBetween, formatShortDate, formatTime, localDateTime } from './format'

/** Given, or overdue once its scheduled time has passed, otherwise due. */
export function doseStatus(dose: Dose, now: Date): DoseStatus {
  if (dose.givenAt) return 'given'
  return localDateTime(dose.date, dose.time).getTime() < now.getTime() ? 'overdue' : 'due'
}

const dosesPerDay: Record<Medication['frequency'], number> = {
  'Once daily': 1,
  'Twice daily': 2,
  'Three times daily': 3,
  'As needed': 1,
}

/** Days of supply left, or null when the medication isn't tracked by supply. */
export function daysOfSupplyLeft(med: Medication): number | null {
  if (med.tracking.kind !== 'supply') return null
  return Math.floor(med.tracking.remaining / dosesPerDay[med.frequency])
}

export const REFILL_THRESHOLD_DAYS = 7

export function needsRefill(med: Medication): boolean {
  const days = daysOfSupplyLeft(med)
  return med.status === 'active' && days !== null && days <= REFILL_THRESHOLD_DAYS
}

/** Day N of a course on `today` (1-based, clamped to the course length), or null for non-courses. */
export function courseDay(med: Medication, today: string): number | null {
  if (med.tracking.kind !== 'course') return null
  const day = daysBetween(med.startDate, today) + 1
  return Math.min(Math.max(day, 1), med.tracking.totalDays)
}

export interface ProgressInfo {
  /** "Course", "Supply" or "Ongoing" */
  kind: string
  /** "Day 6 of 14", "5 of 60 left" */
  label: string
  value: number
  max: number
  low: boolean
}

export function progressInfo(med: Medication, today: string): ProgressInfo {
  const t = med.tracking
  switch (t.kind) {
    case 'course': {
      const day = med.status === 'completed' ? t.totalDays : (courseDay(med, today) ?? 1)
      return { kind: 'Course', label: `Day ${day} of ${t.totalDays}`, value: day, max: t.totalDays, low: false }
    }
    case 'supply':
      return {
        kind: 'Supply',
        label: `${t.remaining} of ${t.total} left`,
        value: t.remaining,
        max: t.total,
        low: needsRefill(med),
      }
    case 'ongoing':
      return { kind: 'Ongoing', label: 'No end date', value: 0, max: 1, low: false }
  }
}

/** "Today, 6:00 PM", "Tomorrow, 8:00 AM" or "Finished Oct 2". */
export function nextDoseLabel(med: Medication, todaysDoses: Dose[]): string {
  if (med.status === 'completed') {
    return med.completedOn ? `Finished ${formatShortDate(med.completedOn)}` : 'Finished'
  }
  const pendingToday = todaysDoses
    .filter((d) => d.medicationId === med.id && !d.givenAt)
    .sort((a, b) => a.time.localeCompare(b.time))[0]
  if (pendingToday) return `Today, ${formatTime(pendingToday.time)}`
  const first = [...med.reminderTimes].sort()[0]
  return first ? `Tomorrow, ${formatTime(first)}` : 'As needed'
}

/** "2× daily" / "Daily" for compact chips. */
export function frequencyShort(frequency: Medication['frequency']): string {
  switch (frequency) {
    case 'Once daily':
      return 'Daily'
    case 'Twice daily':
      return '2× daily'
    case 'Three times daily':
      return '3× daily'
    case 'As needed':
      return 'As needed'
  }
}

/** "Antibiotic · 1 tablet with food, twice daily, 14 days" */
export function prescriptionLabel(med: Medication): string {
  const length = med.tracking.kind === 'course' ? `, ${med.tracking.totalDays} days` : ''
  return `${med.name} · ${med.dose}, ${med.frequency.toLowerCase()}${length}`
}

export interface ScheduleRow {
  dose: Dose
  med: Medication
  pet: Pet
  status: DoseStatus
}

export function buildSchedule(doses: Dose[], meds: Medication[], pets: Pet[], now: Date): ScheduleRow[] {
  const rows: ScheduleRow[] = []
  for (const dose of doses) {
    const med = meds.find((m) => m.id === dose.medicationId)
    const pet = med && pets.find((p) => p.id === med.petId)
    if (med && pet) rows.push({ dose, med, pet, status: doseStatus(dose, now) })
  }
  return rows.sort((a, b) => a.dose.time.localeCompare(b.dose.time))
}
