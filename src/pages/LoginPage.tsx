import { PawPrint } from 'lucide-react'
import { useEffect, useId, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Field, FormError, inputClass } from '../components/Field'
import { api } from '../lib/api'
import { authClient } from '../lib/authClient'

type Mode = 'sign-in' | 'sign-up'

export default function LoginPage() {
  const { data: session, isPending } = authClient.useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'
  const id = useId()

  const [mode, setMode] = useState<Mode>('sign-in')
  const [allowSignup, setAllowSignup] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api<{ allowSignup: boolean }>('/config')
      .then((config) => setAllowSignup(config.allowSignup))
      .catch(() => setAllowSignup(false))
  }, [])

  if (!isPending && session) return <Navigate to={from} replace />

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setBusy(true)
    const result =
      mode === 'sign-in'
        ? await authClient.signIn.email({ email: email.trim(), password })
        : await authClient.signUp.email({ email: email.trim(), password, name: name.trim() || email.trim() })
    setBusy(false)
    if (result.error) {
      setError(
        result.error.status === 401 || result.error.code === 'INVALID_EMAIL_OR_PASSWORD'
          ? 'That email and password don’t match.'
          : result.error.status === 429
            ? 'Too many attempts. Wait a minute and try again.'
            : (result.error.message ?? 'Something went wrong. Please try again.'),
      )
      return
    }
    navigate(from, { replace: true })
  }

  const signingUp = mode === 'sign-up'

  return (
    <main className="flex min-h-dvh items-center justify-center bg-bg px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary text-white">
            <PawPrint className="size-6" strokeWidth={2} aria-hidden="true" />
          </span>
          <span className="text-2xl font-extrabold tracking-tight text-ink">PetCare</span>
        </div>

        <Card className="p-6">
          <h1 className="text-2xl font-extrabold tracking-tight">{signingUp ? 'Create your account' : 'Sign in'}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {signingUp ? 'Keep your pets’ care in one private place.' : 'Welcome back.'}
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {signingUp && (
              <Field label="Your name" htmlFor={`${id}-name`}>
                <input
                  id={`${id}-name`}
                  className={inputClass}
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
            )}
            <Field label="Email" htmlFor={`${id}-email`}>
              <input
                id={`${id}-email`}
                type="email"
                className={inputClass}
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>
            <Field label="Password" htmlFor={`${id}-password`} hint={signingUp ? 'At least 10 characters.' : undefined}>
              <input
                id={`${id}-password`}
                type="password"
                className={inputClass}
                autoComplete={signingUp ? 'new-password' : 'current-password'}
                required
                minLength={signingUp ? 10 : undefined}
                aria-describedby={signingUp ? `${id}-password-hint` : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <FormError>{error}</FormError>

            <Button type="submit" block disabled={busy}>
              {busy ? 'Please wait…' : signingUp ? 'Create account' : 'Sign in'}
            </Button>
          </form>

          {allowSignup && (
            <p className="mt-4 text-center text-sm text-ink-muted">
              {signingUp ? 'Already have an account?' : 'New here?'}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(signingUp ? 'sign-in' : 'sign-up')
                  setError('')
                }}
                className="inline-flex h-11 items-center font-semibold text-primary hover:text-primary-dark"
              >
                {signingUp ? 'Sign in' : 'Create an account'}
              </button>
            </p>
          )}
        </Card>
      </div>
    </main>
  )
}
