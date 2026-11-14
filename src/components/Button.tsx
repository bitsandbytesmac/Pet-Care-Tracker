import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router'
import { cx, display } from '../lib/cx'

export type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'warn-outline'
  | 'inverse'
  | 'inverse-outline'
  | 'dashed'

const variants: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark',
  outline: 'border border-line bg-surface text-ink hover:bg-bg',
  'warn-outline': 'border border-warn-line bg-surface text-warn-dark hover:bg-warn-tint',
  inverse: 'bg-white text-ink hover:bg-divider',
  'inverse-outline': 'border border-white/30 text-white hover:bg-white/10',
  dashed: 'border border-dashed border-ink-muted text-ink-soft hover:bg-bg',
}

export function buttonClasses(variant: ButtonVariant = 'primary', block = false, className?: string): string {
  return cx(
    display('inline-flex', className),
    'h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold whitespace-nowrap transition-colors',
    variants[variant],
    block && 'w-full',
    className,
  )
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  block?: boolean
}

export function Button({ variant, block, className, type = 'button', ...props }: ButtonProps) {
  return <button type={type} className={buttonClasses(variant, block, className)} {...props} />
}

type ButtonLinkProps = Omit<LinkProps, 'className'> & {
  variant?: ButtonVariant
  block?: boolean
  className?: string
}

export function ButtonLink({ variant, block, className, ...props }: ButtonLinkProps) {
  return <Link className={buttonClasses(variant, block, className)} {...props} />
}

type TextLinkProps = Omit<LinkProps, 'className'> & { className?: string }

/** Small teal text link with a 44px touch target. */
export function TextLink({ className, ...props }: TextLinkProps) {
  return (
    <Link
      className={cx(
        display('inline-flex', className),
        'h-11 items-center text-sm font-semibold text-primary hover:text-primary-dark',
        className,
      )}
      {...props}
    />
  )
}
