import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { database } from '../src/lib/server/db'
import { instanceTimeZone } from '../src/lib/server/config'
import { instance } from '../src/lib/server/schema'

const { db, sqlite } = database()
migrate(db, { migrationsFolder: './drizzle' })
db.insert(instance)
  .values({ id: 1, timeZone: instanceTimeZone() })
  .onConflictDoNothing()
  .run()
const stored = db.select().from(instance).get()
if (stored?.timeZone !== instanceTimeZone())
  throw new Error('Instance time zone cannot change after setup.')
sqlite.close()
console.log('Migrations applied; instance time zone verified.')
