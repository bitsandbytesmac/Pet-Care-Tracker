import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { authClient } from '../lib/authClient'

interface SignOutButtonProps {
  className?: string
  children: ReactNode
  'aria-label'?: string
}

export function SignOutButton({ className, children, 'aria-label': ariaLabel }: SignOutButtonProps) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={className}
      onClick={async () => {
        await authClient.signOut()
        navigate('/login', { replace: true })
      }}
    >
      {children}
    </button>
  )
}
