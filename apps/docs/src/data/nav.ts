import type { NotificationItem, BottomNavItem, NavSchema } from '@iamsaeed/admin-ui'

/**
 * Nav is data the app owns — the shell renders whatever it is handed.
 * Note every id is a ROUTE NAME, never a path.
 */
export const DOCS_NAV: NavSchema = [
  {
    id: 'workspace',
    label: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'home' },
      {
        id: 'content',
        label: 'Content',
        icon: 'file-text',
        badge: '24',
        children: [
          { id: 'content.posts', label: 'Posts' },
          { id: 'content.pages', label: 'Pages' },
          { id: 'content.drafts', label: 'Drafts', badge: '4' },
          { id: 'content.archive', label: 'Archive' },
        ],
      },
      {
        id: 'media',
        label: 'Media library',
        icon: 'image',
        children: [
          { id: 'media.images', label: 'Images' },
          { id: 'media.videos', label: 'Videos' },
          { id: 'media.documents', label: 'Documents' },
        ],
      },
      { id: 'comments', label: 'Comments', icon: 'message-square', badge: '12' },
    ],
  },
  {
    id: 'audience',
    label: 'Audience',
    items: [
      {
        id: 'users',
        label: 'Users',
        icon: 'users',
        children: [
          { id: 'users.all', label: 'All users' },
          { id: 'users.roles', label: 'Roles & permissions' },
          { id: 'users.invitations', label: 'Invitations' },
        ],
      },
      { id: 'taxonomies', label: 'Taxonomies', icon: 'tag' },
      { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
    ],
  },
  {
    id: 'design',
    label: 'Design',
    items: [
      {
        id: 'kit',
        label: 'Component kit',
        icon: 'sparkles',
        children: [
          { id: 'kit.foundations', label: 'Foundations' },
          { id: 'kit.buttons', label: 'Buttons' },
          { id: 'kit.inputs', label: 'Inputs & forms' },
          { id: 'kit.controls', label: 'Selection controls' },
          { id: 'kit.data', label: 'Data display' },
          { id: 'kit.charts', label: 'Charts & metrics' },
          { id: 'kit.feedback', label: 'Feedback & status' },
          { id: 'kit.navigation', label: 'Navigation' },
          { id: 'kit.overlays', label: 'Overlays' },
          { id: 'kit.media', label: 'Media & avatars' },
          { id: 'kit.typography', label: 'Typography blocks' },
          { id: 'kit.marketing', label: 'Marketing blocks' },
        ],
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      {
        id: 'settings',
        label: 'Settings',
        icon: 'settings',
        children: [
          { id: 'settings.general', label: 'General' },
          { id: 'settings.appearance', label: 'Appearance' },
          { id: 'settings.integrations', label: 'Integrations' },
          { id: 'settings.billing', label: 'Billing' },
        ],
      },
      { id: 'help', label: 'Help & docs', icon: 'help' },
      { id: 'auth.signin', label: 'Auth screens', icon: 'lock' },
    ],
  },
]

/** Capped at four; the fifth slot is the drawer's "More". */
export const BOTTOM_NAV: BottomNavItem[] = [
  { id: 'dashboard', label: 'Home', icon: 'home' },
  { id: 'content.posts', label: 'Content', icon: 'file-text' },
  { id: 'kit.foundations', label: 'Kit', icon: 'sparkles' },
  { id: 'analytics', label: 'Stats', icon: 'bar-chart' },
]

/** Sample notifications, so the bell has something to show in the guide. */
export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'invoice-paid',
    title: 'Invoice paid',
    body: 'Talbot & Rowe settled INV-2041',
    time: '2h ago',
    icon: 'receipt',
    tone: 'success',
    unread: true,
  },
  {
    id: 'new-comment',
    title: 'New comment',
    body: 'Elena Marsh on "The case for oklch"',
    time: '5h ago',
    icon: 'message-square',
    tone: 'accent',
    unread: true,
  },
  {
    id: 'draft-scheduled',
    title: 'Draft scheduled',
    body: '"Designing for clarity" publishes Friday',
    time: 'Yesterday',
    icon: 'calendar',
    tone: 'neutral',
    unread: true,
  },
  {
    id: 'storage',
    title: 'Storage at 82%',
    body: 'Media library is nearing its limit',
    time: '3d ago',
    icon: 'alert-triangle',
    tone: 'warn',
  },
]
