import { dirname, resolve } from 'node:path'
import { mkdirSync } from 'node:fs'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import './config'

export function openDatabase(path: string) {
  if (path !== ':memory:')
    mkdirSync(dirname(resolve(path)), { recursive: true, mode: 0o700 })
  const sqlite = new Database(path)
  sqlite.pragma('foreign_keys = ON')
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('synchronous = FULL')
  sqlite.pragma('busy_timeout = 5000')
  return { sqlite, db: drizzle(sqlite, { schema }) }
}

type ConnectionDatabase = ReturnType<typeof openDatabase>['db']
export type AppDatabase =
  | ConnectionDatabase
  | Parameters<Parameters<ConnectionDatabase['transaction']>[0]>[0]
let connection: ReturnType<typeof openDatabase> | undefined
export function database() {
  return (connection ??= openDatabase(
    process.env.TALLY_DATABASE_PATH || './data/tally.sqlite',
  ))
}
