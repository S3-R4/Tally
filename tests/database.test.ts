import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { openDatabase } from '../src/lib/server/db'
import { user, focusSessions, intervals } from '../src/lib/server/schema'

const paths: string[] = []
afterEach(() => {
  for (const path of paths.splice(0))
    rmSync(path, { recursive: true, force: true })
})
function fixture(path = ':memory:') {
  const connection = openDatabase(path)
  migrate(connection.db, { migrationsFolder: './drizzle' })
  const now = new Date()
  connection.db
    .insert(user)
    .values({
      id: 'member',
      name: 'Fixture',
      email: 'member@example.com',
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  return connection
}
const active = {
  id: 'focus',
  userId: 'member',
  source: 'timer' as const,
  kind: 'focus' as const,
  mode: 'stopwatch' as const,
  status: 'running' as const,
  createdAtMs: 1,
}

describe('SQLite persistence contracts', () => {
  it('enforces one active timer, including paused state, and rolls back a failed transaction', () => {
    const { db, sqlite } = fixture()
    db.insert(focusSessions).values(active).run()
    expect(() =>
      db
        .insert(focusSessions)
        .values({ ...active, id: 'second', status: 'paused' })
        .run(),
    ).toThrow()
    expect(() =>
      db.transaction((tx) => {
        tx.insert(focusSessions)
          .values({ ...active, id: 'completed', status: 'completed' })
          .run()
        tx.insert(intervals)
          .values({
            id: 'bad',
            sessionId: 'completed',
            startAtMs: 10,
            endAtMs: 9,
          })
          .run()
      }),
    ).toThrow()
    expect(db.select().from(focusSessions).all()).toHaveLength(1)
    expect(sqlite.pragma('foreign_keys', { simple: true })).toBe(1)
    sqlite.close()
  })
  it('reapplies migrations without losing data, persists across restart, and creates a consistent backup', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'tally-database-'))
    paths.push(dir)
    const source = join(dir, 'source.sqlite')
    const { db, sqlite } = fixture(source)
    db.insert(focusSessions).values(active).run()
    migrate(db, { migrationsFolder: './drizzle' })
    const destination = join(dir, 'backup.sqlite')
    await sqlite.backup(destination)
    sqlite.close()
    for (const path of [source, destination]) {
      const reopened = openDatabase(path)
      expect(reopened.db.select().from(focusSessions).all()).toHaveLength(1)
      expect(reopened.sqlite.pragma('integrity_check', { simple: true })).toBe(
        'ok',
      )
      reopened.sqlite.close()
    }
  })
})
