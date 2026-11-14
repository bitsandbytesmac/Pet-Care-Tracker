import { sql } from 'drizzle-orm'
import { Hono } from 'hono'
import { csrf } from 'hono/csrf'
import { HTTPException } from 'hono/http-exception'
import { secureHeaders } from 'hono/secure-headers'
import { getAuth } from './auth'
import { getDb } from './db/client'
import { env } from './env'
import { requireUser, type AppEnv } from './http'
import { dataRoutes } from './routes/data'
import { devRoutes } from './routes/dev'
import { fileRoutes } from './routes/files'

/**
 * The whole API as one Hono app under /api. It runs:
 * - in development inside the Vite dev server (vite.config.ts → apiDevServer),
 * - on Vercel through api/index.ts,
 * - in integration tests in-process via app.request().
 */
export function createApp() {
  const app = new Hono<AppEnv>().basePath('/api')

  app.use(secureHeaders())
  // Rejects cross-site form/multipart posts. JSON requests from other origins already need CORS, which we don't allow.
  app.use(csrf({ origin: (origin) => origin === new URL(env().BETTER_AUTH_URL).origin }))

  app.onError((error, c) => {
    if (error instanceof HTTPException) return error.getResponse()
    console.error('[api]', c.req.method, c.req.path, error)
    return c.json({ error: 'Something went wrong' }, 500)
  })
  app.notFound((c) => c.json({ error: 'Not found' }, 404))

  // Public
  app.get('/health', async (c) => {
    await getDb().execute(sql`select 1`)
    return c.json({ ok: true })
  })
  app.get('/config', (c) => c.json({ allowSignup: env().ALLOW_SIGNUP }))
  app.on(['GET', 'POST'], '/auth/*', (c) => getAuth().handler(c.req.raw))
  app.route('/dev', devRoutes)

  // Everything below requires a signed-in user.
  app.use(requireUser)
  app.route('/', dataRoutes)
  app.route('/files', fileRoutes)

  return app
}

export const app = createApp()
