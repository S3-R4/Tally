import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { openDatabase } from '../src/lib/server/db'
import { user, members, instance } from '../src/lib/server/schema'
import { mutationInput, viewInput, type MutationInput } from '../src/lib/inputs'
import { mutateTime } from '../src/lib/server/time-records'

export const now = Date.parse('2026-10-15T12:00:00Z')
export function featureFixture(path = ':memory:') {
  const connection = openDatabase(path)
  migrate(connection.db, { migrationsFolder: './drizzle' })
  connection.db
    .insert(instance)
    .values({ id: 1, timeZone: 'Europe/Berlin' })
    .run()
  for (const id of ['alpha', 'beta', 'gamma']) {
    connection.db
      .insert(user)
      .values({
        id,
        name: `Private name ${id}`,
        email: `${id}@example.com`,
        emailVerified: true,
        createdAt: new Date(now),
        updatedAt: new Date(now),
      })
      .run()
    connection.db
      .insert(members)
      .values({ userId: id, displayName: id, timeZone: 'Europe/Berlin' })
      .run()
  }
  return connection
}
export function input(values: unknown) {
  return mutationInput.parse(values)
}
export function view(values: unknown = {}) {
  return viewInput.parse({ view: 'workspace', ...Object(values) })
}
export function start(
  requestId = 'start',
  overrides: Partial<Extract<MutationInput, { action: 'start' }>> = {},
) {
  return input({
    action: 'start',
    requestId,
    mode: 'stopwatch',
    kind: 'focus',
    minutes: 25,
    round: 1,
    rounds: 4,
    title: '=PRIVATE TITLE',
    note: 'PRIVATE NOTE',
    taskId: null,
    tagId: null,
    ...overrides,
  })
}
export function tracked(
  db: ReturnType<typeof featureFixture>['db'],
  userId: string,
  startAtMs: number,
  endAtMs: number,
  requestId = crypto.randomUUID(),
) {
  const id = mutateTime(db, userId, start(requestId), startAtMs)!
  mutateTime(
    db,
    userId,
    input({
      action: 'stop',
      id,
      expectedRevision: 0,
      requestId: `${requestId}-stop`,
    }),
    endAtMs,
  )
  return id
}
