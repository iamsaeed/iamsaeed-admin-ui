import { computed, reactive, watch } from 'vue'
import { useIsDesktop } from './useBreakpoint'

/**
 * Sidebar state — singleton, same reasoning as useTheme.
 *
 * The shell has TWO distinct behaviours and conflating them is the classic
 * responsive-admin bug:
 *
 *   desktop (>=lg)  a permanent rail that can be COLLAPSED to icons
 *   mobile  (<lg)   an off-canvas DRAWER that is opened and closed
 *
 * `collapsed` and `drawerOpen` are therefore separate pieces of state, and
 * `collapsed` is the only one persisted — a drawer must never survive a
 * reload, or the user lands on a page with the nav covering the content.
 */

const STORAGE_KEY = 'lm-sidebar'
const isBrowser = typeof window !== 'undefined'

const state = reactive({
  collapsed: false,
  drawerOpen: false,
  /** Which sidebar group is expanded — one at a time, accordion-style. */
  openGroup: null as string | null,
})

let initialised = false

function init() {
  if (initialised || !isBrowser) return
  initialised = true

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) state.collapsed = JSON.parse(raw)?.collapsed === true
  } catch {
    /* ignore */
  }

  watch(
    () => state.collapsed,
    (v) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ collapsed: v }))
      } catch {
        /* ignore */
      }
    },
  )

  // A drawer left open while the viewport grows into desktop would otherwise
  // linger as an invisible focus trap.
  const isDesktop = useIsDesktop()
  watch(isDesktop, (desktop) => {
    if (desktop) state.drawerOpen = false
  })

  // Body scroll lock — without it the page behind the drawer scrolls under
  // the user's finger, which reads as the drawer being broken.
  watch(
    () => state.drawerOpen,
    (open) => {
      document.body.style.overflow = open ? 'hidden' : ''
    },
  )
}

export function useSidebar() {
  init()

  return {
    collapsed: computed(() => state.collapsed),
    drawerOpen: computed(() => state.drawerOpen),
    openGroup: computed(() => state.openGroup),

    toggleCollapsed: () => {
      state.collapsed = !state.collapsed
      // Collapsing to icons hides labels, so an expanded group is meaningless.
      if (state.collapsed) state.openGroup = null
    },
    setCollapsed: (v: boolean) => {
      state.collapsed = v
    },

    openDrawer: () => {
      state.drawerOpen = true
    },
    closeDrawer: () => {
      state.drawerOpen = false
    },
    toggleDrawer: () => {
      state.drawerOpen = !state.drawerOpen
    },

    toggleGroup: (id: string) => {
      state.openGroup = state.openGroup === id ? null : id
    },
    setOpenGroup: (id: string | null) => {
      state.openGroup = id
    },
  }
}
