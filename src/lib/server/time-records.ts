import { randomUUID } from 'node:crypto'
import { and, eq, isNull, ne, asc, lte } from 'drizzle-orm'
import type { AppDatabase } from './db'
import {
  focusSessions,
  intervals,
  timingRevisions,
  commands,
  members,
} from './schema'
import type { MutationInput } from '../inputs'
import { duration, type TimeInterval } from '../time'
import { fail, ownedLinks } from './domain'

export function records(db: AppDatabase, userId: string) {
  const sessions = db
    .select()
    .from(focusSessions)
    .where(eq(focusSessions.userId, userId))
    .all()
  const parts = db
    .select({
      id: intervals.id,
      sessionId: intervals.sessionId,
      startAtMs: intervals.startAtMs,
      endAtMs: intervals.endAtMs,
    })
    .from(intervals)
    .innerJoin(focusSessions, eq(focusSessions.id, intervals.sessionId))
    .where(eq(focusSessions.userId, userId))
    .orderBy(asc(intervals.startAtMs))
    .all()
  const grouped = new Map<string, typeof parts>()
  for (const part of parts) {
    const group = grouped.get(part.sessionId) ?? []
    group.push(part)
    grouped.set(part.sessionId, group)
  }
  return sessions.map((row) => ({
    ...row,
    intervals: grouped.get(row.id) ?? [],
  }))
}
export type TimeRecord = ReturnType<typeof records>[number]
function closeOpen(db: AppDatabase, sessionId: string, endAtMs: number) {
  for (const part of db
    .select()
    .from(intervals)
    .where(and(eq(intervals.sessionId, sessionId), isNull(intervals.endAtMs)))
    .all()) {
    if (endAtMs <= part.startAtMs)
      db.delete(intervals).where(eq(intervals.id, part.id)).run()
    else
      db.update(intervals)
        .set({ endAtMs })
        .where(eq(intervals.id, part.id))
        .run()
  }
}
export function reconcile(db: AppDatabase, now: number, userId?: string) {
  db.transaction((tx) => {
    const due = tx
      .select()
      .from(focusSessions)
      .where(
        and(
          eq(focusSessions.status, 'running'),
          lte(focusSessions.deadlineAtMs, now),
          userId ? eq(focusSessions.userId, userId) : undefined,
        ),
      )
      .all()
    for (const row of due) {
      closeOpen(tx, row.id, row.deadlineAtMs!)
      tx.update(focusSessions)
        .set({ status: 'completed', revision: row.revision + 1 })
        .where(eq(focusSessions.id, row.id))
        .run()
    }
  })
}
export function timerState(db: AppDatabase, userId: string, now: number) {
  reconcile(db, now, userId)
  const all = records(db, userId).filter(
    (row) => row.source === 'timer' && row.deletedAtMs === null,
  )
  return {
    serverAtMs: now,
    active: all.find((row) => row.status !== 'completed') ?? null,
    latest: all.sort((a, b) => b.createdAtMs - a.createdAtMs)[0] ?? null,
  }
}
export function validParts(
  db: AppDatabase,
  userId: string,
  parts: TimeInterval[],
  now: number,
  excludingId?: string,
) {
  const sorted = [...parts].sort((a, b) => a.startAtMs - b.startAtMs)
  if (
    sorted.some(
      (part, i) =>
        part.endAtMs === null ||
        part.endAtMs <= part.startAtMs ||
        part.endAtMs > now ||
        (i > 0 && sorted[i - 1].endAtMs! > part.startAtMs),
    )
  )
    fail(
      'INVALID_INPUT',
      'Intervals must be positive, in the past, and must not overlap.',
    )
  const existing = db
    .select({ startAtMs: intervals.startAtMs, endAtMs: intervals.endAtMs })
    .from(intervals)
    .innerJoin(focusSessions, eq(focusSessions.id, intervals.sessionId))
    .where(
      and(
        eq(focusSessions.userId, userId),
        isNull(focusSessions.deletedAtMs),
        excludingId ? ne(focusSessions.id, excludingId) : undefined,
      ),
    )
    .all()
  if (
    sorted.some((part) =>
      existing.some(
        (other) =>
          part.startAtMs < (other.endAtMs ?? Number.POSITIVE_INFINITY) &&
          part.endAtMs! > other.startAtMs,
      ),
    )
  )
    fail('CONFLICT', 'This time overlaps another record or your active timer.')
}
function insertParts(
  db: AppDatabase,
  sessionId: string,
  parts: TimeInterval[],
) {
  for (const part of parts)
    db.insert(intervals)
      .values({ id: randomUUID(), sessionId, ...part })
      .run()
}
export function mutateTime(
  db: AppDatabase,
  userId: string,
  input: MutationInput,
  now: number,
) {
  reconcile(db, now, userId)
  return db.transaction((tx) => {
    if (
      input.action === 'start' ||
      input.action === 'pause' ||
      input.action === 'resume' ||
      input.action === 'stop'
    ) {
      const fingerprint = JSON.stringify(input)
      const previous = tx
        .select()
        .from(commands)
        .where(
          and(
            eq(commands.userId, userId),
            eq(commands.requestId, input.requestId),
          ),
        )
        .get()
      if (previous) {
        if (
          previous.fingerprint !== fingerprint ||
          !('sessionId' in previous.result)
        )
          fail(
            'CONFLICT',
            'This request identifier has already been used. Refresh before retrying.',
          )
        return previous.result.sessionId
      }
      let sessionId: string
      if (input.action === 'start') {
        if (input.round > input.rounds)
          fail('INVALID_INPUT', 'Round cannot exceed the number of rounds.')
        if (records(tx, userId).some((row) => row.status !== 'completed'))
          fail('CONFLICT', 'A timer is already active. Refresh to use it.')
        ownedLinks(tx, userId, input.taskId, input.tagId)
        const tagId = input.tagId
        ownedLinks(tx, userId, null, tagId)
        sessionId = randomUUID()
        const preferences = tx
          .select()
          .from(members)
          .where(eq(members.userId, userId))
          .get()!
        const cycleFocusMinutes =
          input.cycleFocusMinutes ??
          (input.kind === 'focus' ? input.minutes : preferences.focusMinutes)
        const cycleBreakMinutes =
          input.cycleBreakMinutes ??
          (input.kind === 'break' ? input.minutes : preferences.breakMinutes)
        const plannedDurationMs =
          input.mode === 'countdown' ? input.minutes * 60_000 : null
        tx.insert(focusSessions)
          .values({
            id: sessionId,
            userId,
            source: 'timer',
            kind: input.kind,
            mode: input.mode,
            status: 'running',
            plannedDurationMs,
            deadlineAtMs:
              plannedDurationMs === null ? null : now + plannedDurationMs,
            round: input.round,
            rounds: input.rounds,
            cycleFocusMinutes,
            cycleBreakMinutes,
            title: input.title,
            note: input.note,
            taskId: input.taskId,
            tagId,
            createdAtMs: now,
          })
          .run()
        insertParts(tx, sessionId, [{ startAtMs: now, endAtMs: null }])
      } else {
        const row = records(tx, userId).find(
          (record) => record.id === input.id && record.deletedAtMs === null,
        )
        if (!row) fail('NOT_FOUND', 'Session not found.')
        if (row.revision !== input.expectedRevision)
          fail(
            'CONFLICT',
            'This timer changed on another device. The latest state has been loaded.',
          )
        if (row.status === 'completed')
          fail('CONFLICT', 'This timer has already finished.')
        sessionId = row.id
        if (input.action === 'resume') {
          if (row.status !== 'paused')
            fail('CONFLICT', 'Only a paused timer can resume.')
          // A manual entry can occupy a paused gap, but never the new open interval.
          const futureParts = records(tx, userId)
            .filter(
              (other) => other.id !== row.id && other.deletedAtMs === null,
            )
            .flatMap((other) => other.intervals)
          if (futureParts.some((part) => (part.endAtMs ?? Infinity) > now))
            fail('CONFLICT', 'Another interval overlaps the resumed timer.')
          insertParts(tx, row.id, [{ startAtMs: now, endAtMs: null }])
          tx.update(focusSessions)
            .set({
              status: 'running',
              deadlineAtMs:
                row.plannedDurationMs === null
                  ? null
                  : now +
                    Math.max(
                      0,
                      row.plannedDurationMs - duration(row.intervals, now),
                    ),
              revision: row.revision + 1,
            })
            .where(eq(focusSessions.id, row.id))
            .run()
        } else {
          if (input.action === 'pause' && row.status !== 'running')
            fail('CONFLICT', 'Only a running timer can pause.')
          closeOpen(tx, row.id, Math.min(now, row.deadlineAtMs ?? now))
          tx.update(focusSessions)
            .set({
              status: input.action === 'pause' ? 'paused' : 'completed',
              revision: row.revision + 1,
            })
            .where(eq(focusSessions.id, row.id))
            .run()
        }
      }
      tx.insert(commands)
        .values({
          userId,
          requestId: input.requestId,
          fingerprint,
          result: { sessionId },
        })
        .run()
      return sessionId
    }
    if (input.action === 'manual') {
      ownedLinks(tx, userId, input.taskId, input.tagId)
      validParts(tx, userId, input.parts, now)
      const sessionId = randomUUID()
      tx.insert(focusSessions)
        .values({
          id: sessionId,
          userId,
          source: 'manual',
          kind: 'focus',
          mode: 'manual',
          status: 'completed',
          title: input.title,
          note: input.note,
          taskId: input.taskId,
          tagId: input.tagId,
          createdAtMs: now,
        })
        .run()
      insertParts(tx, sessionId, input.parts)
      return sessionId
    }
    if (
      input.action !== 'metadata' &&
      input.action !== 'correct' &&
      input.action !== 'delete-session' &&
      input.action !== 'restore-session'
    )
      fail('INVALID_INPUT', 'Unknown time operation.')
    const row = records(tx, userId).find((record) => record.id === input.id)
    if (!row) fail('NOT_FOUND', 'Session not found.')
    if (row.revision !== input.expectedRevision)
      fail('CONFLICT', 'This session changed. Reload before saving.')
    if (input.action === 'metadata') {
      ownedLinks(tx, userId, input.taskId, input.tagId, true)
      tx.update(focusSessions)
        .set({
          title: input.title,
          note: input.note,
          taskId: input.taskId,
          tagId: input.tagId,
          revision: row.revision + 1,
        })
        .where(eq(focusSessions.id, row.id))
        .run()
    } else {
      if (row.status !== 'completed')
        fail(
          'CONFLICT',
          'Stop the timer before changing its timing or deleting it.',
        )
      if (input.action === 'correct') {
        validParts(tx, userId, input.parts, now, row.id)
        tx.insert(timingRevisions)
          .values({
            id: randomUUID(),
            sessionId: row.id,
            intervals: row.intervals.map(({ startAtMs, endAtMs }) => ({
              startAtMs,
              endAtMs,
            })),
            changedAtMs: now,
          })
          .run()
        tx.delete(intervals).where(eq(intervals.sessionId, row.id)).run()
        insertParts(tx, row.id, input.parts)
        tx.update(focusSessions)
          .set({ timingEdited: true, revision: row.revision + 1 })
          .where(eq(focusSessions.id, row.id))
          .run()
      } else {
        if (input.action === 'restore-session')
          validParts(tx, userId, row.intervals, now, row.id)
        tx.update(focusSessions)
          .set({
            deletedAtMs: input.action === 'delete-session' ? now : null,
            revision: row.revision + 1,
          })
          .where(eq(focusSessions.id, row.id))
          .run()
      }
    }
    return row.id
  })
}
