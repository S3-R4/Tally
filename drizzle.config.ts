import { defineConfig } from 'drizzle-kit'
import { loadEnvFile } from 'node:process'

try {
  loadEnvFile()
} catch {
  /* Environment variables may be provided by the service. */
}

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/server/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.TALLY_DATABASE_PATH ?? './data/tally.sqlite',
  },
})
