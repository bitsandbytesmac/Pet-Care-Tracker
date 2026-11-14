import { describe, expect, it } from 'vitest'
import { doses as sampleDoses, medications as sampleMeds, pets as samplePets } from '../data/sample'
import type { Dose, Medication } from '../types'
import {
  buildSchedule,
  daysOfSupplyLeft,
  doseStatus,
  frequencyShort,
  needsRefill,
  nextDoseLabel,
  prescriptionLabel,
  progressInfo,
} from './meds'

function med(overrides: Partial<Medication> = {}): Medication {
  return {
    id: 'm1',
    name: 'Test med',
    petId: 'mochi',
    dose: '1 tablet',
    frequency: 'Once daily',
    reminderTimes: ['08:00'],
    status: 'active',
    tracking: { kind: 'course', day: 1, totalDays: 10 },
    ...overrides,
  }
}

function dose(overrides: Partial<Dose> = {}): Dose {
  return { id: 'd1', medicationId: 'm1', time: '08:00', given: false, overdue: false, ...overrides }
}

describe('doseStatus', () => {
  it('reports given before overdue', () => {
    expect(doseStatus(dose({ given: true, overdue: true }))).toBe('given')
    expect(doseStatus(dose({ overdue: true }))).toBe('overdue')
    expect(doseStatus(dose())).toBe('due')
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

  it('flags the sample joint supplement and nothing else', () => {
    expect(sampleMeds.filter(needsRefill).map((m) => m.id)).toEqual(['joint-supplement'])
  })
})

describe('progressInfo', () => {
  it('describes a course', () => {
    expect(progressInfo(med({ tracking: { kind: 'course', day: 6, totalDays: 14 } }))).toMatchObject({
      kind: 'Course',
      label: 'Day 6 of 14',
      value: 6,
      max: 14,
      low: false,
    })
  })

  it('describes a supply and marks it low when a refill is due', () => {
    expect(progressInfo(med({ tracking: { kind: 'supply', remaining: 5, total: 60 } }))).toMatchObject({
      kind: 'Supply',
      label: '5 of 60 left',
      low: true,
    })
  })

  it('describes an ongoing medicine', () => {
    expect(progressInfo(med({ tracking: { kind: 'ongoing' } })).label).toBe('No end date')
  })
})

describe('nextDoseLabel', () => {
  it('uses the earliest dose not yet given today', () => {
    const doses = [dose({ id: 'a', time: '20:00' }), dose({ id: 'b', time: '08:00', given: true }), dose({ id: 'c', time: '14:00' })]
    expect(nextDoseLabel(med(), doses)).toBe('Today, 2:00 PM')
  })

  it('falls back to tomorrow’s first reminder when today is done', () => {
    const m = med({ reminderTimes: ['20:00', '08:00'] })
    expect(nextDoseLabel(m, [dose({ given: true })])).toBe('Tomorrow, 8:00 AM')
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
    const antibiotic = sampleMeds.find((m) => m.id === 'antibiotic')!
    expect(prescriptionLabel(antibiotic)).toBe('Antibiotic · 1 tablet with food, twice daily, 14 days')
    expect(prescriptionLabel(med({ tracking: { kind: 'ongoing' } }))).toBe('Test med · 1 tablet, once daily')
  })
})

describe('buildSchedule', () => {
  it('joins doses with medicine and pet, sorted by time', () => {
    const rows = buildSchedule(sampleDoses, sampleMeds, samplePets)
    expect(rows.map((r) => [r.dose.time, r.med.name, r.pet.name, r.status])).toEqual([
      ['08:00', 'Joint supplement', 'Bantay', 'given'],
      ['08:30', 'Ear drops', 'Mochi', 'given'],
      ['18:00', 'Antibiotic', 'Bantay', 'overdue'],
      ['21:00', 'Ear drops', 'Mochi', 'due'],
    ])
  })

  it('drops doses whose medicine or pet no longer exists', () => {
    const orphan = dose({ medicationId: 'missing' })
    expect(buildSchedule([orphan], sampleMeds, samplePets)).toEqual([])
    expect(buildSchedule(sampleDoses, sampleMeds, [])).toEqual([])
  })
})
