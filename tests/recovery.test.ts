import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { featureFixture, now, input, start } from './feature-fixture'
import { openDatabase } from '../src/lib/server/db'
import { mutateTime, timerState } from '../src/lib/server/time-records'
import { duration } from '../src/lib/time'

it('recovers a due countdown after closing and restoring a consistent SQLite backup', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'tally-timer-restore-'))
  try {
    const { db, sqlite } = featureFixture(join(dir, 'source.sqlite'))
    mutateTime(
      db,
      'alpha',
      start('recover', { mode: 'countdown', minutes: 25 }),
      now,
    )
    await sqlite.backup(join(dir, 'backup.sqlite'))
    sqlite.close()
    const restored = openDatabase(join(dir, 'backup.sqlite'))
    const state = timerState(restored.db, 'alpha', now + 86_400_000)
    expect(state.active).toBeNull()
    expect(duration(state.latest!.intervals, now + 86_400_000)).toBe(25 * 60000)
    expect(restored.sqlite.pragma('integrity_check', { simple: true })).toBe(
      'ok',
    )
    restored.sqlite.close()
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
it('does not acknowledge a failed write or leave a half-transition', () => {
  const { db, sqlite } = featureFixture()
  const id = mutateTime(db, 'alpha', start(), now)!
  sqlite.exec(
    "CREATE TRIGGER fail_transition BEFORE UPDATE ON focus_sessions BEGIN SELECT RAISE(ABORT, 'fixture disk failure'); END",
  )
  expect(() =>
    mutateTime(
      db,
      'alpha',
      input({
        action: 'pause',
        id,
        expectedRevision: 0,
        requestId: 'failed-pause',
      }),
      now + 60000,
    ),
  ).toThrow()
  const state = timerState(db, 'alpha', now + 60000)
  expect(state.active?.status).toBe('running')
  expect(state.active?.revision).toBe(0)
  expect(state.active?.intervals[0].endAtMs).toBeNull()
  sqlite.close()
})
