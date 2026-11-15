import { TriangleAlert } from 'lucide-react'
import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from './Button'
import { FormError } from './Field'

interface ConfirmDialogProps {
  open: boolean
  title: string
  /** What will happen, in plain words. */
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
  error?: string
}

/**
 * Modal confirmation for destructive actions, on the native <dialog> element:
 * focus is trapped, Escape cancels, and Cancel gets focus first so Enter is safe.
 */
export function ConfirmDialog({ open, title, children, confirmLabel, onConfirm, onCancel, busy, error }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-body`}
      onCancel={(event) => {
        // Escape: let React state close the dialog, and not while a delete is in flight.
        event.preventDefault()
        if (!busy) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl bg-surface p-6 text-ink shadow-xl shadow-ink/20 backdrop:bg-ink/40"
    >
      <div className="flex items-start gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-severe-tint text-severe">
          <TriangleAlert className="size-5" strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id={`${id}-title`} className="text-lg font-bold">
            {title}
          </h2>
          <div id={`${id}-body`} className="mt-1 space-y-2 text-sm text-ink-soft">
            {children}
          </div>
        </div>
      </div>
      <FormError className="mt-4">{error}</FormError>
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onCancel} disabled={busy} autoFocus>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </Button>
      </div>
    </dialog>
  )
}
