import { mkdirSync, chmodSync } from 'node:fs'
import { resolve } from 'node:path'
import { database } from '../src/lib/server/db'

const destination = resolve(
  process.argv[2] ||
    `backups/tally-${new Date().toISOString().replaceAll(':', '-')}.sqlite`,
)
mkdirSync(resolve(destination, '..'), { recursive: true, mode: 0o700 })
const { sqlite } = database()
await sqlite.backup(destination)
chmodSync(destination, 0o600)
sqlite.close()
console.log(`Consistent backup saved to ${destination}`)
