import type { IconName } from '../components/ui/icon-paths'

/**
 * A notification, as data. The shell renders and announces them; it never
 * fetches, marks read, or decides what a click means — the app does that from
 * the emitted id.
 */
export interface NotificationItem {
  id: string
  title: string
  /** Secondary line. Kept short; this is a menu, not an inbox. */
  body?: string
  /** Pre-formatted for display ("2h ago"), because only the app knows the locale. */
  time?: string
  icon?: IconName | string
  unread?: boolean
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger'
}
