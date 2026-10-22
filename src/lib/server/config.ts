import { loadEnvFile } from 'node:process'
import { z } from 'zod'

try {
  loadEnvFile()
} catch (error) {
  if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT'))
    throw error
}

export function isAllowedEmail(
  email: string,
  allowed = process.env.TALLY_ALLOWED_EMAILS ?? '',
) {
  return allowed
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.trim().toLowerCase())
}

export function authConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    (process.env.BETTER_AUTH_SECRET?.length ?? 0) >= 32,
  )
}

export function instanceTimeZone() {
  const timeZone = process.env.TALLY_TIME_ZONE || 'Europe/Berlin'
  new Intl.DateTimeFormat('en', { timeZone }).format()
  return timeZone
}

export function authConfiguration() {
  return z
    .object({
      baseURL: z.url({ protocol: /^https?$/ }).refine((value) => {
        const url = new URL(value)
        return (
          process.env.NODE_ENV !== 'production' ||
          url.protocol === 'https:' ||
          ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
        )
      }, 'Production authentication requires HTTPS.'),
      secret: z.string().min(32),
      clientId: z.string().min(1),
      clientSecret: z.string().min(1),
    })
    .parse({
      baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
      secret: process.env.BETTER_AUTH_SECRET,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
}
