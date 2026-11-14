import type { Context, MiddlewareHandler } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { isIsoDate, isTime } from '../src/lib/format'
import { getAuth } from './auth'

export type AppEnv = { Variables: { userId: string } }

export const isoDateSchema = z.string().refine(isIsoDate, 'Expected a date like 2026-11-13')
export const timeSchema = z.string().refine(isTime, 'Expected a 24-hour time like 18:00')
export const idSchema = z.uuid()

function badRequest(message: string): HTTPException {
  return new HTTPException(400, { res: Response.json({ error: message }, { status: 400 }) })
}

export function notFound(what = 'Not found'): HTTPException {
  return new HTTPException(404, { res: Response.json({ error: what }, { status: 404 }) })
}

/** Validate input; respond 400 with the first problem in plain words. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data)
  if (!result.success) {
    const issue = result.error.issues[0]
    const where = issue?.path.length ? `${issue.path.join('.')}: ` : ''
    throw badRequest(`${where}${issue?.message ?? 'Invalid request'}`)
  }
  return result.data
}

export async function readJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json()
  } catch {
    throw badRequest('Expected a JSON body')
  }
}

/** A path id that isn't a UUID can't exist, so it's a 404 (not a database error). */
export function pathId(c: Context, name = 'id'): string {
  const value = c.req.param(name)
  if (!value || !idSchema.safeParse(value).success) throw notFound()
  return value
}

/** Rejects requests without a valid session; otherwise sets `userId`. */
export const requireUser: MiddlewareHandler<AppEnv> = async (c, next) => {
  const session = await getAuth().api.getSession({ headers: c.req.raw.headers })
  if (!session) return c.json({ error: 'Not signed in' }, 401)
  c.set('userId', session.user.id)
  await next()
}
