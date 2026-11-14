/**
 * Vercel Function entry point. vercel.json rewrites /api/* here, and the Hono app
 * routes by the original path. Not deployed yet: verify on the first Vercel deploy.
 */
import { app } from '../server/app'

const handle = (request: Request) => app.fetch(request)

export const GET = handle
export const POST = handle
export const PATCH = handle
export const PUT = handle
export const DELETE = handle
export const OPTIONS = handle
