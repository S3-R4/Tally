import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { database } from './db'
import * as schema from './schema'
import { authConfiguration, isAllowedEmail } from './config'

function createAuth() {
  const config = authConfiguration()
  return betterAuth({
    appName: 'Tally',
    baseURL: config.baseURL,
    secret: config.secret,
    database: drizzleAdapter(database().db, { provider: 'sqlite', schema }),
    socialProviders: {
      google: { clientId: config.clientId, clientSecret: config.clientSecret },
    },
    emailAndPassword: { enabled: false },
    session: { cookieCache: { enabled: false } },
    databaseHooks: {
      user: {
        create: {
          before: async (value) => {
            if (!value.emailVerified || !isAllowedEmail(value.email))
              return false
          },
        },
      },
      session: {
        create: {
          before: async (value) => {
            const member = database()
              .db.select()
              .from(schema.user)
              .where(eq(schema.user.id, value.userId))
              .get()
            if (!member?.emailVerified || !isAllowedEmail(member.email))
              return false
          },
        },
      },
    },
    plugins: [tanstackStartCookies()],
  })
}

let auth: ReturnType<typeof createAuth> | undefined
export function getAuth() {
  return (auth ??= createAuth())
}
