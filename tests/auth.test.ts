import { beforeAll, afterAll, describe, expect, it, vi } from 'vitest'
import { createHmac } from 'node:crypto'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { database } from '../src/lib/server/db'
import { user, session, instance } from '../src/lib/server/schema'
import { getAuth } from '../src/lib/server/auth'
import { currentMember, requireMember } from '../src/lib/server/member'

const secret = 'fixture-auth-secret-used-only-for-isolated-tests-32'
const now = new Date()
const approved = {
  id: 'approved',
  name: 'Private Google name',
  email: 'member@example.com',
  emailVerified: true,
  image: null,
  createdAt: now,
  updatedAt: now,
}
const token = 'isolated-fixture-session-token'

beforeAll(() => {
  vi.stubEnv('TALLY_DATABASE_PATH', ':memory:')
  vi.stubEnv('TALLY_ALLOWED_EMAILS', approved.email)
  vi.stubEnv('TALLY_TIME_ZONE', 'Europe/Berlin')
  vi.stubEnv('BETTER_AUTH_URL', 'http://localhost:3000')
  vi.stubEnv('BETTER_AUTH_SECRET', secret)
  vi.stubEnv('GOOGLE_CLIENT_ID', 'fixture-google-client')
  vi.stubEnv('GOOGLE_CLIENT_SECRET', 'fixture-google-secret')
  const { db } = database()
  migrate(db, { migrationsFolder: './drizzle' })
  db.insert(instance).values({ id: 1, timeZone: 'Europe/Berlin' }).run()
  db.insert(user).values(approved).run()
  db.insert(session)
    .values({
      id: 'fixture-session',
      token,
      userId: approved.id,
      createdAt: now,
      updatedAt: now,
      expiresAt: new Date(Date.now() + 3_600_000),
    })
    .run()
})
afterAll(() => {
  database().sqlite.close()
  vi.unstubAllEnvs()
})

function signedHeaders() {
  const signature = createHmac('sha256', secret).update(token).digest('base64')
  return new Headers({
    cookie: `better-auth.session_token=${encodeURIComponent(`${token}.${signature}`)}`,
  })
}

describe('Google-only membership boundary', () => {
  it('has no password login and rejects unapproved or unverified user creation', async () => {
    const auth = getAuth()
    expect(auth.options.emailAndPassword?.enabled).toBe(false)
    expect(Object.keys(auth.options.socialProviders ?? {})).toEqual(['google'])
    const before = auth.options.databaseHooks!.user!.create!.before!
    expect(await before({ ...approved, email: 'outsider@example.com' })).toBe(
      false,
    )
    expect(await before({ ...approved, emailVerified: false })).toBe(false)
    expect(await before(approved)).not.toBe(false)
  })
  it('requires a real signed session and does not publish the Google name automatically', async () => {
    expect(await currentMember(new Headers())).toBeNull()
    await expect(requireMember(new Headers())).rejects.toThrow(
      'UNAUTHENTICATED',
    )
    const member = await requireMember(signedHeaders())
    expect(member.userId).toBe(approved.id)
    expect(member.displayName).not.toBe(approved.name)
    expect(member.leaderboardOptIn).toBe(false)
    expect(member).not.toHaveProperty('email')
  })
  it('rejects an existing session immediately after allowlist removal', async () => {
    vi.stubEnv('TALLY_ALLOWED_EMAILS', '')
    await expect(requireMember(signedHeaders())).rejects.toThrow('FORBIDDEN')
    vi.stubEnv('TALLY_ALLOWED_EMAILS', approved.email)
    expect((await requireMember(signedHeaders())).userId).toBe(approved.id)
  })
})
