import { describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { featureFixture, now, start, input, tracked } from './feature-fixture'
import { mutateTime, records, timerState } from '../src/lib/server/time-records'
import { duration, eligible } from '../src/lib/time'
import { timingRevisions } from '../src/lib/server/schema'

describe('persistent time records', () => {
  it('deduplicates commands, enforces revisions and a single timer, and excludes pause gaps', () => {
    const { db, sqlite } = featureFixture()
    const id = mutateTime(db, 'alpha', start(), now)!
    expect(mutateTime(db, 'alpha', start(), now + 1000)).toBe(id)
    expect(() => mutateTime(db, 'alpha', start('another'), now + 1000)).toThrow(
      'already active',
    )
    expect(() =>
      mutateTime(db, 'alpha', start('start', { minutes: 10 }), now),
    ).toThrow('identifier')
    const pause = input({
      action: 'pause',
      id,
      expectedRevision: 0,
      requestId: 'pause',
    })
    mutateTime(db, 'alpha', pause, now + 60000)
    mutateTime(db, 'alpha', pause, now + 120000)
    expect(() =>
      mutateTime(
        db,
        'alpha',
        input({
          action: 'resume',
          id,
          expectedRevision: 0,
          requestId: 'stale',
        }),
        now + 120000,
      ),
    ).toThrow('changed')
    mutateTime(
      db,
      'alpha',
      input({ action: 'resume', id, expectedRevision: 1, requestId: 'resume' }),
      now + 120000,
    )
    mutateTime(
      db,
      'alpha',
      input({ action: 'stop', id, expectedRevision: 2, requestId: 'stop' }),
      now + 180000,
    )
    expect(duration(records(db, 'alpha')[0].intervals, now + 200000)).toBe(
      120000,
    )
    expect(() =>
      mutateTime(
        db,
        'beta',
        input({
          action: 'metadata',
          id,
          expectedRevision: 3,
          title: 'hijack',
          note: '',
          taskId: null,
          tagId: null,
        }),
        now + 200000,
      ),
    ).toThrow('not found')
    sqlite.close()
  })
  it('clips overdue countdowns, waits for the next phase, and shifts deadlines after pauses', () => {
    const { db, sqlite } = featureFixture()
    const id = mutateTime(
      db,
      'alpha',
      start('countdown', { mode: 'countdown', minutes: 1 }),
      now,
    )!
    mutateTime(
      db,
      'alpha',
      input({ action: 'pause', id, expectedRevision: 0, requestId: 'pause' }),
      now + 10000,
    )
    mutateTime(
      db,
      'alpha',
      input({ action: 'resume', id, expectedRevision: 1, requestId: 'resume' }),
      now + 100000,
    )
    const state = timerState(db, 'alpha', now + 3_600_000)
    expect(state.active).toBeNull()
    expect(state.latest?.intervals.at(-1)?.endAtMs).toBe(now + 150000)
    expect(duration(state.latest!.intervals, now + 3_600_000)).toBe(60000)
    expect(records(db, 'alpha')).toHaveLength(1)
    sqlite.close()
  })
  it('preserves revisions, permanently excludes corrected time, and checks overlap on restore', () => {
    const { db, sqlite } = featureFixture()
    const id = tracked(db, 'alpha', now - 4 * 3_600_000, now)
    expect(eligible(records(db, 'alpha')[0])).toBe(true)
    mutateTime(
      db,
      'alpha',
      input({
        action: 'metadata',
        id,
        expectedRevision: 1,
        title: 'changed',
        note: '',
        taskId: null,
        tagId: null,
      }),
      now,
    )
    expect(eligible(records(db, 'alpha')[0])).toBe(true)
    const parts = [{ startAtMs: now - 3_600_000, endAtMs: now }]
    mutateTime(
      db,
      'alpha',
      input({ action: 'correct', id, expectedRevision: 2, parts }),
      now,
    )
    expect(eligible(records(db, 'alpha')[0])).toBe(false)
    expect(
      db
        .select()
        .from(timingRevisions)
        .where(eq(timingRevisions.sessionId, id))
        .get()?.intervals[0].startAtMs,
    ).toBe(now - 4 * 3_600_000)
    mutateTime(
      db,
      'alpha',
      input({ action: 'delete-session', id, expectedRevision: 3 }),
      now,
    )
    mutateTime(
      db,
      'alpha',
      input({
        action: 'manual',
        parts,
        title: '',
        note: '',
        tagId: null,
        taskId: null,
      }),
      now,
    )
    expect(() =>
      mutateTime(
        db,
        'alpha',
        input({ action: 'restore-session', id, expectedRevision: 4 }),
        now,
      ),
    ).toThrow('overlaps')
    expect(records(db, 'alpha').find((row) => row.id === id)?.deletedAtMs).toBe(
      now,
    )
    sqlite.close()
  })
  it('rejects future, inverted, internally overlapping, and active-overlapping manual time atomically', () => {
    const { db, sqlite } = featureFixture()
    mutateTime(db, 'alpha', start(), now)
    for (const parts of [
      [{ startAtMs: now - 1, endAtMs: now + 1 }],
      [{ startAtMs: now - 1, endAtMs: now - 2 }],
      [
        { startAtMs: now - 10, endAtMs: now - 2 },
        { startAtMs: now - 5, endAtMs: now - 1 },
      ],
    ]) {
      expect(() =>
        mutateTime(
          db,
          'alpha',
          input({
            action: 'manual',
            parts,
            title: '',
            note: '',
            tagId: null,
            taskId: null,
          }),
          now + 100,
        ),
      ).toThrow()
    }
    expect(records(db, 'alpha')).toHaveLength(1)
    sqlite.close()
  })
})
