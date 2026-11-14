/**
 * Create a local demo account with the sample data:  npm run db:seed
 * Re-running is safe: an existing demo account is left as it is.
 */
import { eq } from 'drizzle-orm'
import { localIsoDate } from '../../src/lib/format'
import { getAuth } from '../auth'
import { closeDb, getDb } from '../db/client'
import { user } from '../db/schema'
import { seedSampleData } from '../seed'

process.loadEnvFile('.env')

const DEMO_EMAIL = 'demo@petcare.local'
const DEMO_PASSWORD = 'petcare-demo-2026'

async function main() {
  const db = getDb()
  const [existing] = await db.select({ id: user.id }).from(user).where(eq(user.email, DEMO_EMAIL))
  if (existing) {
    console.log(`Demo account already exists: ${DEMO_EMAIL}`)
    return
  }
  const result = await getAuth().api.signUpEmail({
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD, name: 'Demo' },
  })
  await seedSampleData(db, result.user.id, localIsoDate())
  console.log(`Created demo account\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => closeDb())
