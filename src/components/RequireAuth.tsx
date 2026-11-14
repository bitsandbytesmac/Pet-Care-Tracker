import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { UNAUTHORIZED_EVENT } from '../lib/api'
import { authClient } from '../lib/authClient'

/** Renders children only for a signed-in user; otherwise redirects to /login and comes back afterwards. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { data: session, isPending, refetch } = authClient.useSession()
  const location = useLocation()

  // Any API 401 (expired session) re-checks the session, which redirects if it's gone.
  useEffect(() => {
    const onUnauthorized = () => void refetch()
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [refetch])

  if (isPending) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg">
        <p role="status" className="text-sm text-ink-muted">
          Loading…
        </p>
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
