import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawn } from 'node:child_process'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { openDatabase } from '../../src/lib/server/db'
import { instance, user, session, members } from '../../src/lib/server/schema'
import {
  fixtureSecret,
  fixtureURL,
  approvedToken,
  outsiderToken,
  partnerToken,
  workflowToken,
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
  ['partner', 'partner@example.com', partnerToken],
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
db.insert(session)
  .values({
    id: 'workflow-session',
    userId: 'approved',
    token: workflowToken,
    expiresAt: new Date(Date.now() + 3_600_000),
    createdAt: now,
    updatedAt: now,
  })
  .run()
db.insert(members)
  .values({
    userId: 'partner',
    displayName: 'Partner',
    timeZone: 'Europe/Berlin',
  })
  .run()
sqlite.close()

const server = spawn(
  process.execPath,
  process.env.TALLY_E2E_PRODUCTION === '1'
    ? [
        'node_modules/srvx/bin/srvx.mjs',
        '--prod',
        '--host',
        '127.0.0.1',
        '--port',
        '3101',
        '--static',
        '../client',
        '--entry',
        'dist/server/server.js',
      ]
    : [
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
      NODE_ENV:
        process.env.TALLY_E2E_PRODUCTION === '1' ? 'production' : 'development',
      TALLY_DATABASE_PATH: path,
      TALLY_TIME_ZONE: 'Europe/Berlin',
      TALLY_ALLOWED_EMAILS: 'member@example.com,partner@example.com',
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
