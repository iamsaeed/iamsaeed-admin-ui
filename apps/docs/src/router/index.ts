import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

/**
 * Every route is NAMED and lazy-loaded — the house rule is that app code and
 * nav data reference `kit.foundations`, never `/kit/foundations`.
 *
 * Views are imported from the PACKAGE, not from this app: the docs site is a
 * consumer of `@iamsaeed/admin-ui`, which is the only honest way to prove the
 * exported screens actually work outside the repo that defines them.
 *
 * Imports are written out statically rather than built from a template string
 * so Vite can code-split them; a dynamic path would defeat that.
 */
const routes: RouteRecordRaw[] = [
  { path: '/', redirect: { name: 'dashboard' } },
  { path: '/dashboard', name: 'dashboard', component: () => import('@ui/views/DashboardView.vue') },

  // Content
  { path: '/posts', name: 'content.posts', component: () => import('@ui/views/content/PostsView.vue') },
  { path: '/pages', name: 'content.pages', component: () => import('@ui/views/content/PagesView.vue') },
  { path: '/drafts', name: 'content.drafts', component: () => import('@ui/views/content/DraftsView.vue') },
  { path: '/archive', name: 'content.archive', component: () => import('@ui/views/content/ArchiveView.vue') },

  // Media
  { path: '/media/images', name: 'media.images', component: () => import('@ui/views/media/ImagesView.vue') },
  { path: '/media/videos', name: 'media.videos', component: () => import('@ui/views/media/VideosView.vue') },
  { path: '/media/documents', name: 'media.documents', component: () => import('@ui/views/media/DocumentsView.vue') },

  // Audience
  { path: '/comments', name: 'comments', component: () => import('@ui/views/CommentsView.vue') },
  { path: '/users', name: 'users.all', component: () => import('@ui/views/users/AllUsersView.vue') },
  { path: '/users/roles', name: 'users.roles', component: () => import('@ui/views/users/RolesView.vue') },
  { path: '/users/invitations', name: 'users.invitations', component: () => import('@ui/views/users/InvitationsView.vue') },
  { path: '/taxonomies', name: 'taxonomies', component: () => import('@ui/views/TaxonomiesView.vue') },
  { path: '/analytics', name: 'analytics', component: () => import('@ui/views/AnalyticsView.vue') },

  // Component kit
  { path: '/kit/foundations', name: 'kit.foundations', component: () => import('@ui/views/kit/FoundationsView.vue') },
  { path: '/kit/buttons', name: 'kit.buttons', component: () => import('@ui/views/kit/ButtonsView.vue') },
  { path: '/kit/inputs', name: 'kit.inputs', component: () => import('@ui/views/kit/InputsView.vue') },
  { path: '/kit/controls', name: 'kit.controls', component: () => import('@ui/views/kit/ControlsView.vue') },
  { path: '/kit/data', name: 'kit.data', component: () => import('@ui/views/kit/DataView.vue') },
  { path: '/kit/charts', name: 'kit.charts', component: () => import('@ui/views/kit/ChartsView.vue') },
  { path: '/kit/feedback', name: 'kit.feedback', component: () => import('@ui/views/kit/FeedbackView.vue') },
  { path: '/kit/navigation', name: 'kit.navigation', component: () => import('@ui/views/kit/NavigationView.vue') },
  { path: '/kit/overlays', name: 'kit.overlays', component: () => import('@ui/views/kit/OverlaysView.vue') },
  { path: '/kit/media', name: 'kit.media', component: () => import('@ui/views/kit/MediaView.vue') },
  { path: '/kit/typography', name: 'kit.typography', component: () => import('@ui/views/kit/TypographyView.vue') },
  { path: '/kit/marketing', name: 'kit.marketing', component: () => import('@ui/views/kit/MarketingView.vue') },

  // Settings
  { path: '/settings/general', name: 'settings.general', component: () => import('@ui/views/settings/GeneralView.vue') },
  { path: '/settings/appearance', name: 'settings.appearance', component: () => import('@ui/views/settings/AppearanceView.vue') },
  { path: '/settings/integrations', name: 'settings.integrations', component: () => import('@ui/views/settings/IntegrationsView.vue') },
  { path: '/settings/billing', name: 'settings.billing', component: () => import('@ui/views/settings/BillingView.vue') },

  { path: '/help', name: 'help', component: () => import('@ui/views/HelpView.vue') },

  // Auth — full-screen, deliberately OUTSIDE the admin shell (meta.bare)
  { path: '/signin', name: 'auth.signin', component: () => import('@ui/views/auth/SignInView.vue'), meta: { bare: true } },
  { path: '/signup', name: 'auth.signup', component: () => import('@ui/views/auth/SignUpView.vue'), meta: { bare: true } },
  { path: '/forgot', name: 'auth.forgot', component: () => import('@ui/views/auth/ForgotPasswordView.vue'), meta: { bare: true } },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
