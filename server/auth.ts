import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { getDb } from './db/client'
import { account, rateLimit, session, user, verification } from './db/schema'
import { env } from './env'

function createAuth() {
  const e = env()
  return betterAuth({
    baseURL: e.BETTER_AUTH_URL,
    secret: e.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getDb(), {
      provider: 'pg',
      schema: { user, session, account, verification, rateLimit },
    }),
    emailAndPassword: {
      enabled: true,
      // A personal app: turn sign-up off (ALLOW_SIGNUP=false) once your account exists.
      disableSignUp: !e.ALLOW_SIGNUP,
      minPasswordLength: 10,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // refresh the expiry at most once a day
    },
    rateLimit: {
      // Database storage so limits hold across serverless instances. Better Auth enables it in production.
      storage: 'database',
      customRules: {
        '/sign-in/email': { window: 60, max: 5 },
        '/sign-up/email': { window: 60, max: 3 },
      },
    },
  })
}

export type Auth = ReturnType<typeof createAuth>

let auth: Auth | undefined

export function getAuth(): Auth {
  auth ??= createAuth()
  return auth
}
