const toUtcDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

function format(iso: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', ...options }).format(toUtcDate(iso))
}

/** "Nov 9" */
export const formatShortDate = (iso: string) => format(iso, { month: 'short', day: 'numeric' })
/** "Friday, November 13" */
export const formatLongDate = (iso: string) =>
  format(iso, { weekday: 'long', month: 'long', day: 'numeric' })
/** "Tue, Nov 17" */
export const formatWeekdayShortDate = (iso: string) =>
  format(iso, { weekday: 'short', month: 'short', day: 'numeric' })
/** "Friday, Nov 6" */
export const formatWeekdayLongDate = (iso: string) =>
  format(iso, { weekday: 'long', month: 'short', day: 'numeric' })
/** "NOV" */
export const formatMonthAbbr = (iso: string) => format(iso, { month: 'short' }).toUpperCase()
/** "17" */
export const formatDayOfMonth = (iso: string) => String(toUtcDate(iso).getUTCDate())

/** "2026-11-13" + 4 → "2026-11-17" */
export function addDays(iso: string, days: number): string {
  const date = toUtcDate(iso)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const pad = (n: number) => String(n).padStart(2, '0')

/** The local calendar date of `now` as "YYYY-MM-DD" (not UTC: 11 PM in Manila is still that day). */
export function localIsoDate(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** A local Date for an ISO date + "HH:mm" time. */
export function localDateTime(isoDate: string, hhmm: string): Date {
  return new Date(`${isoDate}T${hhmm}:00`)
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUtcDate(value).getTime()) && toUtcDate(value).toISOString().startsWith(value)
}

export function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((toUtcDate(toIso).getTime() - toUtcDate(fromIso).getTime()) / 86_400_000)
}

/** "In 4 days", "Tomorrow", "Today", "3 days ago" */
export function formatRelativeDays(days: number): string {
  if (days === 0) return 'Today'
  if (days === 1) return 'Tomorrow'
  if (days === -1) return 'Yesterday'
  return days > 0 ? `In ${days} days` : `${-days} days ago`
}

/** "18:00" → "6:00 PM" */
export function formatTime(hhmm: string): string {
  const [hours = 0, minutes = 0] = hhmm.split(':').map(Number)
  const suffix = hours >= 12 ? 'PM' : 'AM'
  const hour12 = hours % 12 === 0 ? 12 : hours % 12
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`
}

/** Current local time as "HH:mm". */
export function currentTime(): string {
  const now = new Date()
  return `${pad(now.getHours())}:${pad(now.getMinutes())}`
}

/**
 * Parse "8:00 AM, 8 PM, 14:30" into ["08:00", "20:00", "14:30"].
 * Returns null if any part can't be read.
 */
export function parseTimeList(input: string): string[] | null {
  const parts = input
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const times: string[] = []
  for (const part of parts) {
    const match = /^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i.exec(part)
    if (!match) return null
    let hours = Number(match[1])
    const minutes = Number(match[2] ?? '0')
    const meridiem = match[3]?.toLowerCase()
    if (minutes > 59) return null
    if (meridiem) {
      if (hours < 1 || hours > 12) return null
      if (meridiem === 'pm' && hours !== 12) hours += 12
      if (meridiem === 'am' && hours === 12) hours = 0
    } else if (hours > 23) {
      return null
    }
    times.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`)
  }
  return times
}
