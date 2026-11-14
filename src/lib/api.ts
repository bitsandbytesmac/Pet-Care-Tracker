export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

/** Fired on any 401 so the auth gate can send the user to the sign-in page. */
export const UNAUTHORIZED_EVENT = 'petcare:unauthorized'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE'
  /** Sent as JSON */
  body?: unknown
  /** Sent as multipart (file uploads) */
  form?: FormData
}

/** Call the PetCare API at /api{path}. Throws ApiError with the server's message on failure. */
export async function api<T>(path: string, { method = 'GET', body, form }: ApiOptions = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    credentials: 'same-origin',
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: form ?? (body === undefined ? undefined : JSON.stringify(body)),
  })
  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      // Not JSON: keep the generic message.
    }
    if (res.status === 401) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    throw new ApiError(res.status, message)
  }
  return (res.status === 204 ? undefined : await res.json()) as T
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof TypeError) return 'Can’t reach the server. Check your connection and try again.'
  return 'Something went wrong. Please try again.'
}
