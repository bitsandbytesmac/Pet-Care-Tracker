import { app } from '../app'
import type { AppData } from '../../src/types'

export const ORIGIN = 'http://localhost:5173'
export const TODAY = '2026-11-13'

/** A signed-in API client for one fresh test user. */
export interface TestUser {
  userId: string
  request: (path: string, init?: RequestInit) => Promise<Response>
  json: <T = unknown>(path: string, init?: Omit<RequestInit, 'body'> & { body?: unknown }) => Promise<{ status: number; body: T }>
  state: (date?: string) => Promise<AppData>
}

export async function createTestUser(options: { seed?: boolean; today?: string } = {}): Promise<TestUser> {
  const res = await app.request('/api/dev/demo-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGIN },
    body: JSON.stringify({ today: options.today ?? TODAY, seed: options.seed ?? true }),
  })
  if (res.status !== 200) throw new Error(`demo-session failed: ${res.status} ${await res.text()}`)
  const { userId } = (await res.json()) as { userId: string }
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ')

  const request = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers)
    headers.set('Cookie', cookie)
    if (!headers.has('Origin')) headers.set('Origin', ORIGIN)
    return Promise.resolve(app.request(path, { ...init, headers }))
  }

  const json: TestUser['json'] = async (path, init = {}) => {
    const { body, ...rest } = init
    const res = await request(path, {
      ...rest,
      headers: { 'Content-Type': 'application/json', ...(rest.headers as Record<string, string> | undefined) },
      body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
    })
    const text = await res.text()
    return { status: res.status, body: (text ? JSON.parse(text) : null) as never }
  }

  const state = async (date = options.today ?? TODAY) => {
    const { status, body } = await json<AppData>(`/api/state?date=${date}`)
    if (status !== 200) throw new Error(`state failed: ${status} ${JSON.stringify(body)}`)
    return body
  }

  return { userId, request, json, state }
}
