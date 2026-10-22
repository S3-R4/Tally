import { eq, inArray, or } from 'drizzle-orm'
import type { AppDatabase } from './db'
import {
  timingRevisions,
  members,
  focusSessions,
  participations,
  challenges,
  commands,
  user,
  friendships,
  kudos,
} from './schema'
import { records, reconcile } from './time-records'
import { planning } from './planning'
import {
  dayAt,
  dayStart,
  shiftDay,
  splitDays,
  streaks,
  weekStart,
  duration,
  eligible,
} from '../time'
import { settingsSchema, type MutationInput, type ViewInput } from '../inputs'
import { fail } from './domain'

export function calendarRange(
  input: Pick<ViewInput, 'from' | 'to'>,
  zone: string,
  now: number,
) {
  const today = dayAt(now, zone)
  const from = input.from ?? `${today.slice(0, 7)}-01`
  const to = input.to ?? shiftDay(today, 1)
  const fromAtMs = dayStart(from, zone),
    toAtMs = dayStart(to, zone)
  if (fromAtMs >= toAtMs || toAtMs - fromAtMs > 367 * 86_400_000)
    fail(
      'INVALID_INPUT',
      'Choose a positive range of at most 366 days. The end date is exclusive.',
    )
  return { from, to, fromAtMs, toAtMs }
}
export function focusSummary(
  db: AppDatabase,
  userId: string,
  zone: string,
  now: number,
  ranked = false,
) {
  const focus = records(db, userId).filter((row) =>
    ranked
      ? eligible(row)
      : row.kind === 'focus' &&
        row.status === 'completed' &&
        row.deletedAtMs === null,
  )
  const days = splitDays(
    focus.flatMap((row) => row.intervals),
    zone,
    0,
    now,
  )
  return {
    focus,
    days,
    streak: streaks(days, dayAt(now, zone)),
    lifetimeDurationMs: Object.values(days).reduce((a, b) => a + b, 0),
  }
}
export function workspace(
  db: AppDatabase,
  userId: string,
  input: ViewInput,
  now: number,
) {
  reconcile(db, now, userId)
  const member = db
    .select()
    .from(members)
    .where(eq(members.userId, userId))
    .get()!
  const plan = planning(db, userId)
  const range = calendarRange(
    {
      from:
        input.from ?? (input.daily ? dayAt(now, member.timeZone) : undefined),
      to:
        input.to ??
        (input.daily
          ? shiftDay(input.from ?? dayAt(now, member.timeZone), 1)
          : undefined),
    },
    member.timeZone,
    now,
  )
  const summary = focusSummary(db, userId, member.timeZone, now)
  const rangeDays = Object.fromEntries(
    Object.entries(summary.days).filter(
      ([day]) => day >= range.from && day < range.to,
    ),
  )
  const byTag: Record<string, number> = {},
    byTask: Record<string, number> = {},
    byWeek: Record<string, number> = {},
    byMonth: Record<string, number> = {},
    byYear: Record<string, number> = {}
  let sessionCount = 0
  const daySessions: Record<string, number> = {}
  const timeline: {
    day: string
    startAtMs: number
    endAtMs: number
    sessionId: string
    title: string
  }[] = []
  for (const row of summary.focus) {
    for (const day of Object.keys(
      splitDays(
        row.intervals,
        member.timeZone,
        range.fromAtMs,
        Math.min(now, range.toAtMs),
      ),
    ))
      daySessions[day] = (daySessions[day] ?? 0) + 1
    for (const part of row.intervals) {
      let cursor = Math.max(part.startAtMs, range.fromAtMs)
      const end = Math.min(part.endAtMs ?? now, now, range.toAtMs)
      while (cursor < end) {
        const day = dayAt(cursor, member.timeZone),
          next = Math.min(end, dayStart(shiftDay(day, 1), member.timeZone))
        timeline.push({
          day,
          startAtMs: cursor,
          endAtMs: next,
          sessionId: row.id,
          title: row.title,
        })
        cursor = next
      }
    }
    const ms = Object.values(
      splitDays(
        row.intervals,
        member.timeZone,
        range.fromAtMs,
        Math.min(now, range.toAtMs),
      ),
    ).reduce((a, b) => a + b, 0)
    if (ms > 0) {
      sessionCount++
      byTag[row.tagId ?? 'untagged'] =
        (byTag[row.tagId ?? 'untagged'] ?? 0) + ms
      byTask[row.taskId ?? 'unassigned'] =
        (byTask[row.taskId ?? 'unassigned'] ?? 0) + ms
    }
  }
  for (const [day, ms] of Object.entries(summary.days)) {
    const week = weekStart(day),
      month = day.slice(0, 7),
      year = day.slice(0, 4)
    byWeek[week] = (byWeek[week] ?? 0) + ms
    byMonth[month] = (byMonth[month] ?? 0) + ms
    byYear[year] = (byYear[year] ?? 0) + ms
  }
  const today = dayAt(now, member.timeZone)
  const all = records(db, userId)
  const matching = all
    .filter(
      (row) =>
        (!input.tagId || row.tagId === input.tagId) &&
        (input.recordType === 'all' ||
          row.kind === input.recordType ||
          row.source === input.recordType) &&
        (!input.search ||
          `${row.title} ${row.note}`
            .toLowerCase()
            .includes(input.search.toLowerCase())) &&
        (input.deleted ? row.deletedAtMs !== null : row.deletedAtMs === null) &&
        (row.intervals.some(
          (part) =>
            part.startAtMs < range.toAtMs &&
            (part.endAtMs ?? now) > range.fromAtMs,
        ) ||
          (row.createdAtMs >= range.fromAtMs &&
            row.createdAtMs < range.toAtMs)),
    )
    .sort((a, b) => b.createdAtMs - a.createdAtMs || a.id.localeCompare(b.id))
  const page = matching.slice(input.page * 50, (input.page + 1) * 50)
  const revisions = page.length
    ? db
        .select()
        .from(timingRevisions)
        .where(
          inArray(
            timingRevisions.sessionId,
            page.map((row) => row.id),
          ),
        )
        .all()
    : []
  return {
    member,
    ...plan,
    range,
    sessions: page.map((row) => ({
      ...row,
      timingRevisions: revisions.filter(
        (revision) => revision.sessionId === row.id,
      ),
    })),
    totalSessions: matching.length,
    report: {
      timeline: timeline.sort((a, b) => a.startAtMs - b.startAtMs),
      daySessions,
      days: rangeDays,
      allDays: summary.days,
      byTag,
      byTask,
      byWeek,
      byMonth,
      byYear,
      sessionCount,
      rangeDurationMs: Object.values(rangeDays).reduce((a, b) => a + b, 0),
      lifetimeDurationMs: summary.lifetimeDurationMs,
      streak: summary.streak,
      todayDurationMs: summary.days[today] ?? 0,
      weekDurationMs: byWeek[weekStart(today)] ?? 0,
      bestDayDurationMs: Math.max(0, ...Object.values(summary.days)),
      bestWeekDurationMs: Math.max(0, ...Object.values(byWeek)),
      bestMonthDurationMs: Math.max(0, ...Object.values(byMonth)),
      taskActual: Object.fromEntries(
        plan.tasks.map((task) => [
          task.id,
          summary.focus
            .filter((row) => row.taskId === task.id)
            .reduce((sum, row) => sum + duration(row.intervals, now), 0),
        ]),
      ),
    },
  }
}
export function mutateSettings(
  db: AppDatabase,
  userId: string,
  input: MutationInput,
) {
  if (input.action === 'settings') {
    db.update(members)
      .set(settingsSchema.parse(input))
      .where(eq(members.userId, userId))
      .run()
  } else if (input.action === 'reset' || input.action === 'delete-account') {
    if (
      input.confirmation !==
      (input.action === 'reset' ? 'RESET FOCUS' : 'DELETE ACCOUNT')
    )
      fail('INVALID_INPUT', 'The confirmation text does not match.')
    db.transaction((tx) => {
      if (input.action === 'delete-account') {
        tx.delete(user).where(eq(user.id, userId)).run()
        return
      }
      tx.delete(commands).where(eq(commands.userId, userId)).run()
      tx.delete(focusSessions).where(eq(focusSessions.userId, userId)).run()
      tx.delete(participations).where(eq(participations.userId, userId)).run()
      tx.delete(challenges).where(eq(challenges.ownerId, userId)).run()
    })
  } else fail('INVALID_INPUT', 'Unknown settings operation.')
}
export function csvCell(value: unknown) {
  const text = String(value ?? '')
  return `"${(/^[\s]*[=+\-@\t\r]/.test(text) ? "'" : '') + text.replaceAll('"', '""')}"`
}
export function exportData(
  db: AppDatabase,
  userId: string,
  format: 'csv' | 'json',
  now: number,
) {
  reconcile(db, now, userId)
  const ownRecords = records(db, userId),
    plan = planning(db, userId)
  if (format === 'csv') {
    const rows: unknown[][] = [
      [
        'id',
        'title',
        'note',
        'kind',
        'source',
        'status',
        'timing_edited',
        'deleted_at_ms',
        'duration_ms',
        'task',
        'tag',
        'intervals_json',
      ],
    ]
    for (const row of ownRecords)
      rows.push([
        row.id,
        row.title,
        row.note,
        row.kind,
        row.source,
        row.status,
        row.timingEdited,
        row.deletedAtMs,
        duration(row.intervals, now),
        plan.tasks.find((task) => task.id === row.taskId)?.title,
        plan.tags.find((tag) => tag.id === row.tagId)?.name,
        JSON.stringify(
          row.intervals.map(({ startAtMs, endAtMs }) => ({
            startAtMs,
            endAtMs,
          })),
        ),
      ])
    return rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  }
  const ownedParticipations = db
    .select()
    .from(participations)
    .where(eq(participations.userId, userId))
    .all()
  const ownChallenges = db
    .select()
    .from(challenges)
    .all()
    .filter(
      (row) =>
        row.ownerId === userId ||
        ownedParticipations.some((part) => part.challengeId === row.id),
    )
  const revisions = ownRecords.length
    ? db
        .select()
        .from(timingRevisions)
        .where(
          inArray(
            timingRevisions.sessionId,
            ownRecords.map((row) => row.id),
          ),
        )
        .all()
    : []
  return JSON.stringify(
    {
      schemaVersion: 1,
      exportedAtMs: now,
      member: db.select().from(members).where(eq(members.userId, userId)).get(),
      ...plan,
      sessions: ownRecords,
      timingRevisions: revisions,
      friendships: db
        .select()
        .from(friendships)
        .where(
          or(eq(friendships.firstId, userId), eq(friendships.secondId, userId)),
        )
        .all(),
      kudos: db
        .select()
        .from(kudos)
        .where(or(eq(kudos.senderId, userId), eq(kudos.recipientId, userId)))
        .all(),
      challenges: ownChallenges,
      participations: ownedParticipations,
    },
    null,
    2,
  )
}
