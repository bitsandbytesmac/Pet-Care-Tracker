import type { Visit, VisitType } from '../types'
import { daysBetween, formatRelativeDays, formatTime, formatWeekdayShortDate } from './format'

/** How a visit should be shown relative to `today`. */
export type VisitState = 'upcoming' | 'overdue' | 'completed'

export function visitState(visit: Pick<Visit, 'status' | 'date'>, today: string): VisitState {
  if (visit.status === 'completed') return 'completed'
  return visit.date < today ? 'overdue' : 'upcoming'
}

const byDateTime = (a: Visit, b: Visit) => a.date.localeCompare(b.date) || (a.time ?? '').localeCompare(b.time ?? '')

/** Scheduled visits, soonest first (overdue ones come first because their dates are earliest). */
export function scheduledVisits(visits: Visit[]): Visit[] {
  return visits.filter((v) => v.status === 'scheduled').sort(byDateTime)
}

/** Completed visits, newest first. */
export function completedVisits(visits: Visit[]): Visit[] {
  return visits.filter((v) => v.status === 'completed').sort((a, b) => byDateTime(b, a))
}

/** True when a scheduled visit's reminder window has started and the visit hasn't passed. */
export function reminderActive(visit: Pick<Visit, 'status' | 'date' | 'reminderDays'>, today: string): boolean {
  if (visit.status !== 'scheduled' || visit.reminderDays === null) return false
  const days = daysBetween(today, visit.date)
  return days >= 0 && days <= visit.reminderDays
}

/** "In 4 days", "Today", or "2 days overdue". */
export function visitWhen(visit: Pick<Visit, 'status' | 'date'>, today: string): string {
  const days = daysBetween(today, visit.date)
  if (visit.status === 'scheduled' && days < 0) return `${-days} day${days === -1 ? '' : 's'} overdue`
  return formatRelativeDays(days)
}

export function reminderLabel(days: number | null): string {
  if (days === null) return 'No reminder'
  if (days === 0) return 'On the day'
  if (days === 7) return '1 week before'
  return `${days} day${days === 1 ? '' : 's'} before`
}

/** Vaccinations and deworming: the visits owners most need to find again. */
export const PREVENTIVE_TYPES: readonly VisitType[] = ['Vaccination', 'Deworming']

/** The latest completed and the next scheduled visit of one type for a pet. */
export function lastAndNext(visits: Visit[], petId: string, type: VisitType): { last?: Visit; next?: Visit } {
  const mine = visits.filter((v) => v.petId === petId && v.type === type)
  return { last: completedVisits(mine)[0], next: scheduledVisits(mine)[0] }
}

/** "Tue, Nov 17 · 10:00 AM", or just the date when the time isn't known. */
export function formatVisitDate(visit: Pick<Visit, 'date' | 'time'>): string {
  return visit.time ? `${formatWeekdayShortDate(visit.date)} · ${formatTime(visit.time)}` : formatWeekdayShortDate(visit.date)
}

/** "1,250.00" */
export function formatCost(cost: number): string {
  return cost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
