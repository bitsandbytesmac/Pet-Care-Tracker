import { describe, expect, it } from 'vitest'
import type { Dose, Medication, Pet } from '../types'
import {
  buildSchedule,
  courseDay,
  daysOfSupplyLeft,
  doseStatus,
  frequencyShort,
  needsRefill,
  nextDoseLabel,
  prescriptionLabel,
  progressInfo,
} from './meds'

const TODAY = '2026-11-13'
const at = (hhmm: string, date = TODAY) => new Date(`${date}T${hhmm}:00`)

function med(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'm1',
    name: 'Test med',
    petId: 'p1',
    dose: '1 tablet',
    frequency: 'Once daily',
    reminderTimes: ['08:00'],
    status: 'active',
    startDate: '2026-11-08',
    tracking: { kind: 'course', totalDays: 14 },
    completedOn: null,
    ...overrides,
  }
}

function dose(overrides: Partial<Dose> = {}): Dose {
  return { id: 'd1', medicationId: 'm1', date: TODAY, time: '08:00', givenAt: null, ...overrides }
}

const pet: Pet = {
  id: 'p1',
  name: 'Bantay',
  species: 'Dog',
  breed: 'Aspin',
  sex: 'Male',
  age: '',
  weight: '',
  neutered: true,
  color: 'mint',
  clinic: '',
  lastVaccine: '',
  food: '',
  allergies: '',
  weightHistory: [],
}

describe('doseStatus', () => {
  it('is due before its time, overdue after, and given once marked', () => {
    const d = dose({ time: '18:00' })
    expect(doseStatus(d, at('17:59'))).toBe('due')
    expect(doseStatus(d, at('18:00'))).toBe('due')
    expect(doseStatus(d, at('18:01'))).toBe('overdue')
    expect(doseStatus({ ...d, givenAt: '2026-11-13T10:00:00Z' }, at('23:00'))).toBe('given')
  })

  it('treats a dose from a previous day as overdue', () => {
    expect(doseStatus(dose({ date: '2026-11-12', time: '21:00' }), at('07:00'))).toBe('overdue')
  })
})

describe('courseDay', () => {
  it('counts from the start date, 1-based', () => {
    expect(courseDay(med(), '2026-11-08')).toBe(1)
    expect(courseDay(med(), TODAY)).toBe(6)
    expect(courseDay(med(), '2026-11-21')).toBe(14)
  })

  it('clamps before the start and after the end', () => {
    expect(courseDay(med(), '2026-11-01')).toBe(1)
    expect(courseDay(med(), '2026-12-31')).toBe(14)
  })

  it('is null for non-course medicines', () => {
    expect(courseDay(med({ tracking: { kind: 'ongoing' } }), TODAY)).toBeNull()
  })
})

describe('supply and refills', () => {
  const supply = (remaining: number, frequency: Medication['frequency'] = 'Once daily') =>
    med({ frequency, tracking: { kind: 'supply', remaining, total: 60 } })

  it('divides remaining supply by doses per day', () => {
    expect(daysOfSupplyLeft(supply(5))).toBe(5)
    expect(daysOfSupplyLeft(supply(15, 'Twice daily'))).toBe(7)
    expect(daysOfSupplyLeft(med())).toBeNull()
  })

  it('flags a refill at 7 days or less, inclusive', () => {
    expect(needsRefill(supply(7))).toBe(true)
    expect(needsRefill(supply(8))).toBe(false)
    expect(needsRefill(supply(0))).toBe(true)
  })

  it('never flags completed or non-supply medicines', () => {
    expect(needsRefill({ ...supply(1), status: 'completed' })).toBe(false)
    expect(needsRefill(med())).toBe(false)
  })
})

describe('progressInfo', () => {
  it('describes a course on a given day', () => {
    expect(progressInfo(med(), TODAY)).toMatchObject({ kind: 'Course', label: 'Day 6 of 14', value: 6, max: 14, low: false })
  })

  it('shows a completed course as finished', () => {
    expect(progressInfo(med({ status: 'completed' }), '2027-01-01').label).toBe('Day 14 of 14')
  })

  it('describes a supply and marks it low when a refill is due', () => {
    expect(progressInfo(med({ tracking: { kind: 'supply', remaining: 5, total: 60 } }), TODAY)).toMatchObject({
      kind: 'Supply',
      label: '5 of 60 left',
      low: true,
    })
  })

  it('describes an ongoing medicine', () => {
    expect(progressInfo(med({ tracking: { kind: 'ongoing' } }), TODAY).label).toBe('No end date')
  })
})

describe('nextDoseLabel', () => {
  it('uses the earliest dose not yet given today', () => {
    const doses = [
      dose({ id: 'a', time: '20:00' }),
      dose({ id: 'b', time: '08:00', givenAt: '2026-11-13T00:00:00Z' }),
      dose({ id: 'c', time: '14:00' }),
    ]
    expect(nextDoseLabel(med(), doses)).toBe('Today, 2:00 PM')
  })

  it('falls back to tomorrow’s first reminder when today is done', () => {
    const m = med({ reminderTimes: ['20:00', '08:00'] })
    expect(nextDoseLabel(m, [dose({ givenAt: '2026-11-13T00:00:00Z' })])).toBe('Tomorrow, 8:00 AM')
  })

  it('ignores other medicines’ doses', () => {
    expect(nextDoseLabel(med(), [dose({ medicationId: 'other', time: '09:00' })])).toBe('Tomorrow, 8:00 AM')
  })

  it('shows the finish date for completed medicines', () => {
    expect(nextDoseLabel(med({ status: 'completed', completedOn: '2026-10-02' }), [])).toBe('Finished Oct 2')
    expect(nextDoseLabel(med({ status: 'completed' }), [])).toBe('Finished')
  })

  it('says "As needed" when there are no reminder times', () => {
    expect(nextDoseLabel(med({ reminderTimes: [] }), [])).toBe('As needed')
  })
})

describe('labels', () => {
  it('shortens frequencies', () => {
    expect(frequencyShort('Once daily')).toBe('Daily')
    expect(frequencyShort('Twice daily')).toBe('2× daily')
    expect(frequencyShort('Three times daily')).toBe('3× daily')
    expect(frequencyShort('As needed')).toBe('As needed')
  })

  it('builds a prescription label, with course length only for courses', () => {
    const antibiotic = med({ name: 'Antibiotic', dose: '1 tablet with food', frequency: 'Twice daily' })
    expect(prescriptionLabel(antibiotic)).toBe('Antibiotic · 1 tablet with food, twice daily, 14 days')
    expect(prescriptionLabel(med({ tracking: { kind: 'ongoing' } }))).toBe('Test med · 1 tablet, once daily')
  })
})

describe('buildSchedule', () => {
  it('joins doses with medicine and pet, sorted by time, with clock-based status', () => {
    const doses = [
      dose({ id: 'late', time: '21:00' }),
      dose({ id: 'missed', time: '18:00' }),
      dose({ id: 'done', time: '08:00', givenAt: '2026-11-13T00:00:00Z' }),
    ]
    const rows = buildSchedule(doses, [med()], [pet], at('19:30'))
    expect(rows.map((r) => [r.dose.time, r.med.name, r.pet.name, r.status])).toEqual([
      ['08:00', 'Test med', 'Bantay', 'given'],
      ['18:00', 'Test med', 'Bantay', 'overdue'],
      ['21:00', 'Test med', 'Bantay', 'due'],
    ])
  })

  it('drops doses whose medicine or pet no longer exists', () => {
    expect(buildSchedule([dose({ medicationId: 'missing' })], [med()], [pet], at('09:00'))).toEqual([])
    expect(buildSchedule([dose()], [med()], [], at('09:00'))).toEqual([])
  })
})
