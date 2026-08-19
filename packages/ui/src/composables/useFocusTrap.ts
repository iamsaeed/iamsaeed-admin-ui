import { nextTick, onScopeDispose, watch, type Ref } from 'vue'

/**
 * Contain keyboard focus inside an overlay, and give it back when the overlay
 * closes.
 *
 * WHY THIS IS NOT OPTIONAL: `aria-modal="true"` tells assistive tech that
 * everything outside the dialog is inert. If Tab can still reach the page
 * behind it, that is a false promise — a screen-reader user is told they are
 * in a modal while their cursor wanders into content they cannot see. The
 * attribute and the trap have to ship together or neither should.
 *
 * Restoring focus on close matters just as much and is more often forgotten:
 * without it, closing a dialog drops focus onto `<body>`, and the next Tab
 * starts again from the top of the document. A keyboard user loses their
 * place every single time.
 */

/**
 * Elements that can hold focus. `:not([disabled])` and the negative-tabindex
 * exclusion matter — a disabled button is in the DOM but must not be a stop,
 * and `tabindex="-1"` means programmatically focusable but not tabbable.
 */
const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(',')

function focusableWithin(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => {
    // offsetParent is null for display:none subtrees; the rect check catches
    // visibility:hidden and zero-size elements that would be dead stops.
    if (el.hasAttribute('inert')) return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 || rect.height > 0
  })
}

export interface FocusTrapOptions {
  /** Focus this instead of the first focusable element (e.g. a Cancel button). */
  initialFocus?: () => HTMLElement | null | undefined
  /** Skip restoring focus on close — rare; only when the trigger is gone. */
  restoreFocus?: boolean
}

/**
 * Traps focus inside `container` whenever `active` is true.
 *
 * @param active     reactive open/closed state
 * @param container  ref to the overlay root
 */
export function useFocusTrap(
  active: Ref<boolean>,
  container: Ref<HTMLElement | null>,
  options: FocusTrapOptions = {},
) {
  const { restoreFocus = true } = options
  let previouslyFocused: HTMLElement | null = null

  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !active.value) return
    const root = container.value
    if (!root) return

    const items = focusableWithin(root)
    if (!items.length) {
      // Nothing to focus: keep focus on the container rather than letting Tab
      // escape to the page behind.
      e.preventDefault()
      root.focus()
      return
    }

    const first = items[0]!
    const last = items[items.length - 1]!
    const current = document.activeElement as HTMLElement | null

    // Wrap at both ends. Also catches the case where focus has somehow landed
    // outside the container entirely (e.g. a click on the scrim).
    if (e.shiftKey && (current === first || !root.contains(current))) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && (current === last || !root.contains(current))) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(active, async (isOpen, wasOpen) => {
    if (isOpen === wasOpen) return

    if (isOpen) {
      previouslyFocused = (document.activeElement as HTMLElement) ?? null
      document.addEventListener('keydown', onKeydown, true)

      await nextTick()
      const root = container.value
      if (!root) return
      const target = options.initialFocus?.() ?? focusableWithin(root)[0] ?? root
      // A container that is itself the fallback target needs to be focusable.
      if (target === root && !root.hasAttribute('tabindex')) root.setAttribute('tabindex', '-1')
      target.focus()
    } else {
      document.removeEventListener('keydown', onKeydown, true)
      if (restoreFocus && previouslyFocused?.isConnected) previouslyFocused.focus()
      previouslyFocused = null
    }
  })

  /**
   * Release the trap if the owning component goes away while still open.
   *
   * Without this the keydown listener outlives its component and keeps
   * intercepting Tab against a container that is no longer in the document —
   * which traps the ENTIRE page with no way out short of a reload. Closing
   * the overlay normally is the common path; unmounting mid-open (a route
   * change while a drawer is open, say) is the one that bites.
   */
  onScopeDispose(() => {
    document.removeEventListener('keydown', onKeydown, true)
  })

  return {
    /** Exposed for tests and for callers that need to re-query after a re-render. */
    focusableWithin,
  }
}
