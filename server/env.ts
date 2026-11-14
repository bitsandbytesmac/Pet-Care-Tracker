import { z } from 'zod'

const bool = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true')

const schema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.url().default('http://localhost:5173'),
  ALLOW_SIGNUP: bool,
  ENABLE_TEST_ROUTES: bool,
  STORAGE_DRIVER: z.enum(['local', 'vercel-blob']).default('local'),
  UPLOAD_DIR: z.string().default('.data/uploads'),
  VERCEL_ENV: z.string().optional(),
})

export type Env = z.infer<typeof schema>

let cached: Env | undefined

/** Validated server environment. Throws a readable error on the first call if something is missing. */
export function env(): Env {
  if (!cached) {
    const result = schema.safeParse(process.env)
    if (!result.success) {
      throw new Error(`Invalid server environment (see .env.example):\n${z.prettifyError(result.error)}`)
    }
    cached = result.data
  }
  return cached
}

/** Test routes can never be enabled on a Vercel production deployment. */
export function testRoutesEnabled(): boolean {
  const e = env()
  return e.ENABLE_TEST_ROUTES && e.VERCEL_ENV !== 'production'
}
