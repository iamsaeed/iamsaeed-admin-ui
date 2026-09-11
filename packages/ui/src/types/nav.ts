import type { IconName } from '../components/ui/icon-paths'

/**
 * Navigation is DATA, passed in by the consuming app — the shell never
 * hard-codes routes. Every destination is a route NAME, never a path, so a
 * URL change is a router concern and never a nav-file edit.
 */

export interface NavItem {
  id: string
  label: string
  icon?: IconName | string
  /** vue-router route name. */
  to?: string
  badge?: string | number
  /** A parent with children renders as an expandable group. */
  children?: NavItem[]
  /** Hide behind a permission/flag the app resolves. */
  visible?: boolean
}

export interface NavSection {
  id: string
  /** Section heading; omit for an unlabelled leading group. */
  label?: string
  items: NavItem[]
}

export type NavSchema = NavSection[]

/**
 * Bottom-nav entries for phones. Deliberately capped at five — more than
 * that and targets fall below a comfortable thumb width. Everything else
 * lives behind the "More" drawer.
 */
export interface BottomNavItem {
  id: string
  label: string
  icon: IconName | string
  to?: string
  badge?: string | number
}

/**
 * An entry in the topbar's user menu. Data, like the sidebar nav — the shell
 * does not decide whether an app has a profile page, a workspace switcher or
 * only a sign-out.
 */
export interface UserMenuItem {
  id: string
  label: string
  icon?: IconName | string
  /** Destructive styling; sign-out is the usual one. */
  danger?: boolean
  /** Draw a separator ABOVE this item. */
  separated?: boolean
}
