import { createElement, useId, type HTMLAttributes, type ReactNode } from 'react'
import { cx } from '../lib/cx'
import { SectionHeader } from './SectionHeader'

type CardProps = HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'li' | 'aside'
}

/** White rounded surface with a light border. */
export function Card({ as = 'div', className, ...props }: CardProps) {
  return createElement(as, {
    className: cx('rounded-2xl border border-line bg-surface', className),
    ...props,
  })
}

interface SectionCardProps {
  title: string
  action?: ReactNode
  className?: string
  children: ReactNode
}

/** A Card that is a labelled <section> with a SectionHeader. */
export function SectionCard({ title, action, className, children }: SectionCardProps) {
  const id = useId()
  return (
    <Card as="section" aria-labelledby={id} className={cx('p-5 md:p-6', className)}>
      <SectionHeader id={id} title={title} action={action} />
      {children}
    </Card>
  )
}
