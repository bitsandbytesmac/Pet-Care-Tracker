/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

const unprefixedDisplay = /(^|\s)(hidden|block|inline|inline-block|inline-flex|flex|grid|inline-grid|contents)(\s|$)/

/**
 * A component's default display class, dropped when the caller's className sets
 * its own (e.g. "hidden md:inline-flex"). Two display utilities on one element
 * conflict and the winner depends on CSS order, not class order.
 */
export function display(defaultDisplay: string, className?: string): string | false {
  return !unprefixedDisplay.test(className ?? '') && defaultDisplay
}
