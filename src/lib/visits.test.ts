import { describe, expect, it } from 'vitest'
import type { Visit } from '../types'
import {
  completedVisits,
  formatCost,
  lastAndNext,
  reminderActive,
  reminderLabel,
  scheduledVisits,
  visitState,
  visitWhen,
} from './visits'

const TODAY = '2026-11-13'

function visit(overrides: Partial<Visit>): Visit {
  return {
    id: crypto.randomUUID(),
    petId: 'pet-1',
    type: 'General checkup',
    status: 'completed',
    date: TODAY,
    time: null,
    title: 'Visit',
    clinic: '',
    diagnosis: '',
    treatment: '',
    notes: '',
    cost: null,
    reminderDays: null,
    prescriptionIds: [],
    attachments: [],
    weightLogged: false,
    ...overrides,
  }
}

describe('visitState', () => {
  it('is completed for completed visits, whatever the date', () => {
    expect(visitState({ status: 'completed', date: '2026-12-01' }, TODAY)).toBe('completed')
  })
  it('is upcoming for scheduled visits today or later', () => {
    expect(visitState({ status: 'scheduled', date: TODAY }, TODAY)).toBe('upcoming')
    expect(visitState({ status: 'scheduled', date: '2026-11-17' }, TODAY)).toBe('upcoming')
  })
  it('is overdue for scheduled visits whose date has passed', () => {
    expect(visitState({ status: 'scheduled', date: '2026-11-12' }, TODAY)).toBe('overdue')
  })
})

describe('visitWhen', () => {
  it('describes upcoming and overdue appointments', () => {
    expect(visitWhen({ status: 'scheduled', date: '2026-11-17' }, TODAY)).toBe('In 4 days')
    expect(visitWhen({ status: 'scheduled', date: '2026-11-12' }, TODAY)).toBe('1 day overdue')
    expect(visitWhen({ status: 'scheduled', date: '2026-11-10' }, TODAY)).toBe('3 days overdue')
    expect(visitWhen({ status: 'completed', date: '2026-11-10' }, TODAY)).toBe('3 days ago')
  })
})

describe('reminderActive', () => {
  it('starts the given number of days before and lasts until the day', () => {
    const v = { status: 'scheduled' as const, date: '2026-11-16', reminderDays: 3 }
    expect(reminderActive(v, '2026-11-12')).toBe(false)
    expect(reminderActive(v, '2026-11-13')).toBe(true)
    expect(reminderActive(v, '2026-11-16')).toBe(true)
    expect(reminderActive(v, '2026-11-17')).toBe(false)
  })
  it('is off without a reminder or once the visit is completed', () => {
    expect(reminderActive({ status: 'scheduled', date: TODAY, reminderDays: null }, TODAY)).toBe(false)
    expect(reminderActive({ status: 'completed', date: TODAY, reminderDays: 1 }, TODAY)).toBe(false)
  })
})

describe('ordering and lookups', () => {
  const visits = [
    visit({ id: 'old-vax', type: 'Vaccination', date: '2025-11-01' }),
    visit({ id: 'recent-vax', type: 'Vaccination', date: '2026-10-01' }),
    visit({ id: 'next-vax', type: 'Vaccination', status: 'scheduled', date: '2027-11-01' }),
    visit({ id: 'overdue', type: 'Deworming', status: 'scheduled', date: '2026-11-01', time: '09:00' }),
    visit({ id: 'other-pet', petId: 'pet-2', type: 'Vaccination', date: '2026-11-10' }),
  ]

  it('lists scheduled visits soonest first and completed newest first', () => {
    expect(scheduledVisits(visits).map((v) => v.id)).toEqual(['overdue', 'next-vax'])
    expect(completedVisits(visits).map((v) => v.id)).toEqual(['other-pet', 'recent-vax', 'old-vax'])
  })

  it('finds the last and next visit of a type for one pet', () => {
    const { last, next } = lastAndNext(visits, 'pet-1', 'Vaccination')
    expect(last?.id).toBe('recent-vax')
    expect(next?.id).toBe('next-vax')
    expect(lastAndNext(visits, 'pet-1', 'Surgery')).toEqual({ last: undefined, next: undefined })
  })
})

describe('labels', () => {
  it('formats reminders and costs', () => {
    expect(reminderLabel(null)).toBe('No reminder')
    expect(reminderLabel(0)).toBe('On the day')
    expect(reminderLabel(1)).toBe('1 day before')
    expect(reminderLabel(3)).toBe('3 days before')
    expect(reminderLabel(7)).toBe('1 week before')
    expect(formatCost(1250)).toBe('1,250.00')
    expect(formatCost(0.5)).toBe('0.50')
  })
})
