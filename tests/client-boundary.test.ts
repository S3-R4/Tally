import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'

it.skipIf(!existsSync('dist/client/assets'))(
  'keeps server configuration and database code out of browser bundles',
  () => {
    for (const file of readdirSync('dist/client/assets').filter((file) =>
      file.endsWith('.js'),
    )) {
      const content = readFileSync(join('dist/client/assets', file), 'utf8')
      for (const marker of [
        'GOOGLE_CLIENT_SECRET',
        'TALLY_DATABASE_PATH',
        'better-sqlite3',
        'PRAGMA journal_mode',
      ])
        expect(content.includes(marker), `${file}: ${marker}`).toBe(false)
      // Better Auth includes variable names in shared helpers; names are not secret values.
      for (const secret of [
        process.env.BETTER_AUTH_SECRET,
        process.env.GOOGLE_CLIENT_SECRET,
      ]) {
        if (secret && secret.length >= 16)
          expect(
            content.includes(secret),
            `${file}: configured secret value`,
          ).toBe(false)
      }
    }
  },
)
