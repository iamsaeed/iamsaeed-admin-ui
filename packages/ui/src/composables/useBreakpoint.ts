import { computed, onScopeDispose, ref } from 'vue'

/**
 * Breakpoints, mirroring `theme.css`. Keep the two in step — the CSS is what
 * actually lays the page out; this exists for the cases where layout genuinely
 * depends on JS (which element to teleport, whether to trap focus in a drawer).
 *
 * Prefer a CSS media query when a CSS media query will do.
 */
export const BREAKPOINTS = {
  xs: 360,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type BreakpointKey = keyof typeof BREAKPOINTS

const isBrowser = typeof window !== 'undefined'

/** Reactive `min-width` match for one breakpoint. */
export function useBreakpoint(key: BreakpointKey) {
  const matches = ref(false)
  if (!isBrowser) return computed(() => false)

  const mq = window.matchMedia(`(min-width: ${BREAKPOINTS[key]}px)`)
  matches.value = mq.matches

  const onChange = (e: MediaQueryListEvent) => {
    matches.value = e.matches
  }
  mq.addEventListener('change', onChange)
  onScopeDispose(() => mq.removeEventListener('change', onChange))

  return computed(() => matches.value)
}

/**
 * The shell's central question: is the sidebar a permanent rail (lg and up)
 * or an off-canvas drawer? Everything about the responsive shell keys off this.
 */
export function useIsDesktop() {
  return useBreakpoint('lg')
}

/** True on touch-primary devices — for gating hover-only affordances. */
export function useIsTouch() {
  const isTouch = ref(false)
  if (!isBrowser) return computed(() => false)

  const mq = window.matchMedia('(pointer: coarse)')
  isTouch.value = mq.matches

  const onChange = (e: MediaQueryListEvent) => {
    isTouch.value = e.matches
  }
  mq.addEventListener('change', onChange)
  onScopeDispose(() => mq.removeEventListener('change', onChange))

  return computed(() => isTouch.value)
}
