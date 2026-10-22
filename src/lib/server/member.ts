import { eq } from 'drizzle-orm'
import { database } from './db'
import { getAuth } from './auth'
import { authConfigured, instanceTimeZone, isAllowedEmail } from './config'
import { members, instance } from './schema'

export async function currentMember(headers: Headers) {
  if (!authConfigured()) return null
  const identity = await getAuth().api.getSession({ headers })
  if (!identity) return null
  if (!identity.user.emailVerified || !isAllowedEmail(identity.user.email))
    throw new Error('FORBIDDEN: This Google account is not approved for Tally.')
  const { db } = database()
  const zone = db.select().from(instance).get()?.timeZone
  if (zone !== instanceTimeZone())
    throw new Error(
      'Tally database is not initialized for the configured time zone. Run db:migrate.',
    )
  db.insert(members)
    .values({
      userId: identity.user.id,
      displayName: `Member ${identity.user.id.slice(0, 6)}`,
      timeZone: zone,
    })
    .onConflictDoNothing()
    .run()
  const member = db
    .select()
    .from(members)
    .where(eq(members.userId, identity.user.id))
    .get()!
  return { ...member, image: identity.user.image ?? null }
}

export async function requireMember(headers: Headers) {
  const member = await currentMember(headers)
  if (!member)
    throw new Error('UNAUTHENTICATED: Sign in with an approved Google account.')
  return member
}
