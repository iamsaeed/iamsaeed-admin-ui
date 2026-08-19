/**
 * @askasia/admin-ui — public API
 *
 * Styles are NOT imported here; a consumer imports them once, explicitly:
 *     @import '@askasia/admin-ui/styles';
 * Keeping CSS out of the JS entry means a Blade page can use the stylesheet
 * without pulling the whole component bundle.
 */

/* ── Theme ──────────────────────────────────────────────────────────────── */
export {
  THEMES,
  SKINS,
  DENSITIES,
  RADII,
  SKIN_HUES,
  SKIN_CHROMA,
  SKIN_LABELS,
  DEFAULT_THEME_STATE,
  STORAGE_KEY,
  themeInitScript,
} from './theme/config'
export type {
  Theme,
  Skin,
  Density,
  Radius,
  ThemePreference,
  ThemeState,
} from './theme/config'

/* ── Composables ────────────────────────────────────────────────────────── */
export { useTheme } from './composables/useTheme'
export { useSidebar } from './composables/useSidebar'
export { useFocusTrap } from './composables/useFocusTrap'
export type { FocusTrapOptions } from './composables/useFocusTrap'
export { maxChromaForHue, oklchToRgb, contrastRatio, isInGamut } from './theme/oklch'
export {
  useBreakpoint,
  useIsDesktop,
  useIsTouch,
  BREAKPOINTS,
} from './composables/useBreakpoint'
export type { BreakpointKey } from './composables/useBreakpoint'

/* ── Types ──────────────────────────────────────────────────────────────── */
export type { NavItem, NavSection, NavSchema, BottomNavItem } from './types/nav'
export { ICON_NAMES, ICON_PATHS } from './components/ui/icon-paths'
export type { IconName } from './components/ui/icon-paths'

/* ── Layouts ────────────────────────────────────────────────────────────── */
export { default as AdminLayout } from './layouts/AdminLayout.vue'
export { default as AuthLayout } from './layouts/AuthLayout.vue'

/* ── Shell ──────────────────────────────────────────────────────────────── */
export { default as AppSidebar } from './components/layout/AppSidebar.vue'
export { default as AppTopbar } from './components/layout/AppTopbar.vue'
export { default as BottomNav } from './components/layout/BottomNav.vue'
export { default as TweaksPanel } from './components/layout/TweaksPanel.vue'

/* ── UI ─────────────────────────────────────────────────────────────────── */
export { default as Icon } from './components/ui/Icon.vue'

/* ── Style-guide primitives ─────────────────────────────────────────────── */
export { default as KitSection } from './components/kit/KitSection.vue'
export { default as KitBlock } from './components/kit/KitBlock.vue'
