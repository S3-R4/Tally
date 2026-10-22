import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { openDatabase } from '../../src/lib/server/db'
import { instance, user, session } from '../../src/lib/server/schema'
import {
  fixtureSecret,
  fixtureURL,
  approvedToken,
  outsiderToken,
} from './fixture'

const directory = mkdtempSync(join(tmpdir(), 'tally-browser-'))
const path = join(directory, 'fixture.sqlite')
const { db, sqlite } = openDatabase(path)
migrate(db, { migrationsFolder: './drizzle' })
db.insert(instance).values({ id: 1, timeZone: 'Europe/Berlin' }).run()
const now = new Date()
for (const [id, email, token] of [
  ['approved', 'member@example.com', approvedToken],
  ['outsider', 'outsider@example.com', outsiderToken],
]) {
  db.insert(user)
    .values({
      id,
      name: 'Private Google name',
      email,
      emailVerified: true,
      createdAt: now,
      updatedAt: now,
    })
    .run()
  db.insert(session)
    .values({
      id: `${id}-session`,
      userId: id,
      token,
      expiresAt: new Date(Date.now() + 3_600_000),
      createdAt: now,
      updatedAt: now,
    })
    .run()
}
sqlite.close()

const server = spawn(
  process.execPath,
  [
    'node_modules/vite/bin/vite.js',
    '--host',
    '127.0.0.1',
    '--port',
    '3101',
    '--strictPort',
  ],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      TALLY_DATABASE_PATH: path,
      TALLY_TIME_ZONE: 'Europe/Berlin',
      TALLY_ALLOWED_EMAILS: 'member@example.com',
      BETTER_AUTH_URL: fixtureURL,
      BETTER_AUTH_SECRET: fixtureSecret,
      GOOGLE_CLIENT_ID: 'fixture-client',
      GOOGLE_CLIENT_SECRET: 'fixture-google-secret',
    },
  },
)
for (const signal of ['SIGINT', 'SIGTERM'] as const)
  process.on(signal, () => server.kill(signal))
server.on('exit', (code) => process.exit(code ?? 0))
process.on('exit', () => rmSync(directory, { recursive: true, force: true }))
