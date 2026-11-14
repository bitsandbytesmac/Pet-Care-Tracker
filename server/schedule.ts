import { and, eq, lte } from 'drizzle-orm'
import { addDays } from '../src/lib/format'
import type { Db } from './db/client'
import { doses, medications } from './db/schema'

type MedicationRow = typeof medications.$inferSelect

/** Whether a medicine is scheduled on `date` (started, and for courses, not past the last day). */
export function isScheduledOn(med: MedicationRow, date: string): boolean {
  if (med.status !== 'active' || med.startDate > date) return false
  if (med.trackingKind === 'course' && med.totalDays) {
    return date <= addDays(med.startDate, med.totalDays - 1)
  }
  return true
}

/**
 * Materialise a user's doses for `date` from each active medicine's reminder times.
 * A medicine's day is generated once: if it already has any dose that day, it is left alone,
 * so later edits to reminder times don't rewrite past schedules. Safe to call concurrently
 * (the unique index + ON CONFLICT DO NOTHING absorbs races).
 */
export async function ensureDosesForDate(db: Db, userId: string, date: string): Promise<void> {
  const [activeMeds, existing] = await Promise.all([
    db
      .select()
      .from(medications)
      .where(and(eq(medications.userId, userId), eq(medications.status, 'active'), lte(medications.startDate, date))),
    db
      .selectDistinct({ medicationId: doses.medicationId })
      .from(doses)
      .where(and(eq(doses.userId, userId), eq(doses.date, date))),
  ])
  const scheduled = new Set(existing.map((e) => e.medicationId))
  const rows = activeMeds
    .filter((med) => !scheduled.has(med.id) && isScheduledOn(med, date))
    .flatMap((med) => med.reminderTimes.map((time) => ({ userId, medicationId: med.id, date, time })))
  if (rows.length > 0) {
    await db.insert(doses).values(rows).onConflictDoNothing()
  }
}
