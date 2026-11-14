import { describe, expect, it } from 'vitest'
import {
  addDays,
  isIsoDate,
  isTime,
  localDateTime,
  localIsoDate,
  daysBetween,
  formatDayOfMonth,
  formatLongDate,
  formatMonthAbbr,
  formatRelativeDays,
  formatShortDate,
  formatTime,
  formatWeekdayLongDate,
  formatWeekdayShortDate,
  parseTimeList,
} from './format'

describe('date formatting', () => {
  it('formats ISO dates without shifting the day (UTC-safe)', () => {
    expect(formatShortDate('2026-11-09')).toBe('Nov 9')
    expect(formatLongDate('2026-11-13')).toBe('Friday, November 13')
    expect(formatWeekdayShortDate('2026-11-17')).toBe('Tue, Nov 17')
    expect(formatWeekdayLongDate('2026-11-06')).toBe('Friday, Nov 6')
    expect(formatMonthAbbr('2026-11-17')).toBe('NOV')
    expect(formatDayOfMonth('2026-11-17')).toBe('17')
  })

  it('handles month and year boundaries', () => {
    expect(formatShortDate('2026-01-01')).toBe('Jan 1')
    expect(formatShortDate('2026-12-31')).toBe('Dec 31')
  })

  it('counts days between dates', () => {
    expect(daysBetween('2026-11-13', '2026-11-17')).toBe(4)
    expect(daysBetween('2026-11-13', '2026-11-13')).toBe(0)
    expect(daysBetween('2026-11-13', '2026-11-06')).toBe(-7)
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3)
  })

  it.each([
    [0, 'Today'],
    [1, 'Tomorrow'],
    [-1, 'Yesterday'],
    [4, 'In 4 days'],
    [-3, '3 days ago'],
  ])('describes %i days as "%s"', (days, label) => {
    expect(formatRelativeDays(days)).toBe(label)
  })
})

describe('date arithmetic and validation', () => {
  it('adds days across month, year and leap-day boundaries', () => {
    expect(addDays('2026-11-13', 4)).toBe('2026-11-17')
    expect(addDays('2026-11-13', -13)).toBe('2026-10-31')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
  })

  it('uses the local calendar date, not UTC', () => {
    // 11:30 PM local is still the same local day even where UTC has rolled over.
    expect(localIsoDate(new Date(2026, 10, 13, 23, 30))).toBe('2026-11-13')
    expect(localIsoDate(new Date(2026, 0, 5, 0, 5))).toBe('2026-01-05')
    expect(localDateTime('2026-11-13', '18:00').getHours()).toBe(18)
  })

  it.each([
    ['2026-11-13', true],
    ['2028-02-29', true],
    ['2026-02-29', false],
    ['2026-13-01', false],
    ['2026-1-01', false],
    ['today', false],
    ['', false],
  ])('isIsoDate(%s) is %s', (value, ok) => {
    expect(isIsoDate(value)).toBe(ok)
  })

  it.each([
    ['00:00', true],
    ['23:59', true],
    ['24:00', false],
    ['8:00', false],
    ['08:60', false],
  ])('isTime(%s) is %s', (value, ok) => {
    expect(isTime(value)).toBe(ok)
  })
})

describe('formatTime', () => {
  it.each([
    ['00:00', '12:00 AM'],
    ['08:30', '8:30 AM'],
    ['12:00', '12:00 PM'],
    ['18:00', '6:00 PM'],
    ['23:59', '11:59 PM'],
  ])('formats %s as %s', (input, output) => {
    expect(formatTime(input)).toBe(output)
  })
})

describe('parseTimeList', () => {
  it('parses 12-hour and 24-hour times, with or without minutes', () => {
    expect(parseTimeList('8:00 AM, 8:00 PM')).toEqual(['08:00', '20:00'])
    expect(parseTimeList('8 pm')).toEqual(['20:00'])
    expect(parseTimeList('14:30')).toEqual(['14:30'])
    expect(parseTimeList('8:00am,2:15PM')).toEqual(['08:00', '14:15'])
  })

  it('handles noon and midnight in 12-hour time', () => {
    expect(parseTimeList('12:00 AM')).toEqual(['00:00'])
    expect(parseTimeList('12:00 PM')).toEqual(['12:00'])
  })

  it('ignores blank entries and returns [] for empty input', () => {
    expect(parseTimeList('')).toEqual([])
    expect(parseTimeList(' 8 AM , , ')).toEqual(['08:00'])
  })

  it.each(['soon', '25:00', '13 PM', '0 AM', '8:75', '8:00 XM'])('rejects "%s"', (input) => {
    expect(parseTimeList(input)).toBeNull()
  })
})
