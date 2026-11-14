import { drizzle } from 'drizzle-orm/node-postgres'
import pg from 'pg'
import { env } from '../env'
import * as schema from './schema'

function createDb() {
  // Small pool: serverless functions run many instances. On Neon, use the pooled connection string.
  const pool = new pg.Pool({ connectionString: env().DATABASE_URL, max: 5 })
  return { pool, db: drizzle({ client: pool, schema }) }
}

type DbHandle = ReturnType<typeof createDb>
export type Db = DbHandle['db']

// Cached on globalThis so Vite's dev reloads of server code don't open a new pool each time.
const globalForDb = globalThis as typeof globalThis & { __petcareDb?: DbHandle }

export function getDb(): Db {
  globalForDb.__petcareDb ??= createDb()
  return globalForDb.__petcareDb.db
}

export async function closeDb(): Promise<void> {
  await globalForDb.__petcareDb?.pool.end()
  globalForDb.__petcareDb = undefined
}
