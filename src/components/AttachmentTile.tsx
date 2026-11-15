import { FileText, Image, Receipt } from 'lucide-react'
import { cx } from '../lib/cx'
import type { Attachment } from '../types'

const icons = { photo: Image, receipt: Receipt, file: FileText } satisfies Record<Attachment['kind'], unknown>

interface AttachmentTileProps {
  attachment: Attachment
  caption?: string
  className?: string
}

/** Square tile for a photo/receipt. Opens the file in a new tab when one is stored; photos show a thumbnail. */
export function AttachmentTile({ attachment, caption, className }: AttachmentTileProps) {
  const Icon = icons[attachment.kind]
  const base = cx(
    'relative flex flex-col items-center justify-center gap-1 overflow-hidden rounded-xl bg-divider p-2 text-center text-xs text-ink-muted',
    className,
  )
  const label = (
    <>
      <Icon className="size-5 shrink-0" strokeWidth={2} aria-hidden="true" />
      <span className="max-w-full truncate">{attachment.name}</span>
      {caption && <span>{caption}</span>}
    </>
  )

  if (!attachment.url) return <div className={base}>{label}</div>

  return (
    <a
      href={attachment.url}
      target="_blank"
      rel="noreferrer"
      className={cx(base, 'hover:ring-2 hover:ring-primary')}
      aria-label={`Open ${attachment.name}`}
    >
      {attachment.kind === 'photo' ? (
        <img src={attachment.url} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />
      ) : (
        label
      )}
    </a>
  )
}
