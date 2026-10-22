import { TZDate } from '@date-fns/tz'
import { addDays, addMonths, format, startOfWeek } from 'date-fns'

export type TimeInterval = { startAtMs: number; endAtMs: number | null }
export function dayAt(atMs: number, timeZone: string) {
  return format(new TZDate(atMs, timeZone), 'yyyy-MM-dd')
}
export function dayStart(day: string, timeZone: string) {
  const [year, month, date] = day.split('-').map(Number)
  return new TZDate(year, month - 1, date, timeZone).getTime()
}
export function shiftDay(day: string, count: number) {
  return format(
    addDays(new TZDate(dayStart(day, 'UTC'), 'UTC'), count),
    'yyyy-MM-dd',
  )
}
export function shiftMonth(day: string, count: number) {
  return format(
    addMonths(new TZDate(dayStart(day, 'UTC'), 'UTC'), count),
    'yyyy-MM-dd',
  )
}
export function weekStart(day: string) {
  return format(
    startOfWeek(new TZDate(dayStart(day, 'UTC'), 'UTC'), { weekStartsOn: 1 }),
    'yyyy-MM-dd',
  )
}
export function duration(intervals: TimeInterval[], now = Date.now()) {
  return intervals.reduce(
    (sum, part) =>
      sum + Math.max(0, Math.min(part.endAtMs ?? now, now) - part.startAtMs),
    0,
  )
}
export function eligible(record: {
  source: string
  kind: string
  status: string
  timingEdited: boolean
  deletedAtMs: number | null
}) {
  return (
    record.source === 'timer' &&
    record.kind === 'focus' &&
    record.status === 'completed' &&
    !record.timingEdited &&
    record.deletedAtMs === null
  )
}
export function splitDays(
  parts: TimeInterval[],
  timeZone: string,
  fromAtMs = 0,
  toAtMs = Date.now(),
) {
  const days: Record<string, number> = {}
  for (const part of parts) {
    if (part.endAtMs === null) continue
    let cursor = Math.max(part.startAtMs, fromAtMs)
    const end = Math.min(part.endAtMs, toAtMs)
    while (cursor < end) {
      const day = dayAt(cursor, timeZone)
      const next = Math.min(end, dayStart(shiftDay(day, 1), timeZone))
      if (next <= cursor) throw new Error('Invalid calendar boundary')
      days[day] = (days[day] ?? 0) + next - cursor
      cursor = next
    }
  }
  return days
}
export function streaks(
  days: Record<string, number>,
  today: string,
  minimumMs = 300_000,
) {
  const qualified = Object.keys(days)
    .filter((day) => days[day] >= minimumMs)
    .sort()
  let best = 0,
    run = 0,
    previous = ''
  for (const day of qualified) {
    run = previous && shiftDay(previous, 1) === day ? run + 1 : 1
    best = Math.max(best, run)
    previous = day
  }
  let cursor = days[today] >= minimumMs ? today : shiftDay(today, -1)
  let current = 0
  while (days[cursor] >= minimumMs) {
    current++
    cursor = shiftDay(cursor, -1)
  }
  return { current, best }
}
export function formatDuration(ms: number) {
  const minutes = Math.floor(Math.max(0, ms) / 60_000)
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}
