import { Hono } from 'hono'
import { z } from 'zod'
import { getAuth } from '../auth'
import { getDb } from '../db/client'
import { testRoutesEnabled } from '../env'
import { isoDateSchema, notFound, parse, readJson } from '../http'
import { seedSampleData } from '../seed'

/**
 * Test-only routes, used by Playwright to give every test its own seeded account.
 * Return 404 unless ENABLE_TEST_ROUTES=true, and never on a Vercel production deployment.
 */
export const devRoutes = new Hono()

devRoutes.use(async (_c, next) => {
  if (!testRoutesEnabled()) throw notFound()
  await next()
})

/** Create a fresh user with the sample data (relative to `today`) and sign the caller in as them. */
devRoutes.post('/demo-session', async (c) => {
  const { today, seed } = parse(
    z.object({ today: isoDateSchema, seed: z.boolean().default(true) }),
    await readJson(c),
  )
  const email = `test-${crypto.randomUUID()}@petcare.test`
  const response = await getAuth().api.signUpEmail({
    body: { email, password: crypto.randomUUID(), name: 'Test user' },
    asResponse: true,
  })
  if (!response.ok) {
    return c.json({ error: `Could not create test user (${response.status}). Is ALLOW_SIGNUP=true?` }, 500)
  }
  const { user } = (await response.clone().json()) as { user: { id: string } }
  if (seed) await seedSampleData(getDb(), user.id, today)

  // Pass Better Auth's Set-Cookie through so the caller is signed in.
  const headers = new Headers(response.headers)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({ userId: user.id, email }), { status: 200, headers })
})
