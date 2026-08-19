/**
 * `@askasia/admin-ui/views` — the ported screens, as importable scaffolding.
 *
 * A separate entry from the main barrel on purpose: these are STARTING POINTS
 * carrying demo data, not part of the design system. An app that imports only
 * `@askasia/admin-ui` never pays for them.
 *
 * Typical use is to copy one into your app and replace its data source, or to
 * mount it directly while the real screen is being built.
 */

/* ── Dashboard ──────────────────────────────────────────────────────────── */
export { default as DashboardView } from './views/DashboardView.vue'

/* ── Auth ───────────────────────────────────────────────────────────────── */
export { default as SignInView } from './views/auth/SignInView.vue'
export { default as SignUpView } from './views/auth/SignUpView.vue'
export { default as ForgotPasswordView } from './views/auth/ForgotPasswordView.vue'

/* ── Content ────────────────────────────────────────────────────────────── */
export { default as ContentListView } from './views/content/ContentListView.vue'
export { default as PostsView } from './views/content/PostsView.vue'
export { default as PagesView } from './views/content/PagesView.vue'
export { default as DraftsView } from './views/content/DraftsView.vue'
export { default as ArchiveView } from './views/content/ArchiveView.vue'

/* ── Media ──────────────────────────────────────────────────────────────── */
export { default as MediaGridView } from './views/media/MediaGridView.vue'
export { default as ImagesView } from './views/media/ImagesView.vue'
export { default as VideosView } from './views/media/VideosView.vue'
export { default as DocumentsView } from './views/media/DocumentsView.vue'

/* ── Users ──────────────────────────────────────────────────────────────── */
export { default as AllUsersView } from './views/users/AllUsersView.vue'
export { default as RolesView } from './views/users/RolesView.vue'
export { default as InvitationsView } from './views/users/InvitationsView.vue'

/* ── Settings ───────────────────────────────────────────────────────────── */
export { default as SettingsLayout } from './views/settings/SettingsLayout.vue'
export { default as GeneralView } from './views/settings/GeneralView.vue'
export { default as AppearanceView } from './views/settings/AppearanceView.vue'
export { default as IntegrationsView } from './views/settings/IntegrationsView.vue'
export { default as BillingView } from './views/settings/BillingView.vue'

/* ── Misc ───────────────────────────────────────────────────────────────── */
export { default as TaxonomiesView } from './views/TaxonomiesView.vue'
export { default as AnalyticsView } from './views/AnalyticsView.vue'
export { default as CommentsView } from './views/CommentsView.vue'
export { default as HelpView } from './views/HelpView.vue'

/* ── Component kit (the living style guide) ─────────────────────────────── */
export { default as KitFoundationsView } from './views/kit/FoundationsView.vue'
export { default as KitButtonsView } from './views/kit/ButtonsView.vue'
export { default as KitInputsView } from './views/kit/InputsView.vue'
export { default as KitControlsView } from './views/kit/ControlsView.vue'
export { default as KitDataView } from './views/kit/DataView.vue'
export { default as KitChartsView } from './views/kit/ChartsView.vue'
export { default as KitFeedbackView } from './views/kit/FeedbackView.vue'
export { default as KitNavigationView } from './views/kit/NavigationView.vue'
export { default as KitOverlaysView } from './views/kit/OverlaysView.vue'
export { default as KitMediaView } from './views/kit/MediaView.vue'
export { default as KitTypographyView } from './views/kit/TypographyView.vue'
export { default as KitMarketingView } from './views/kit/MarketingView.vue'

/* ── Demo data (delete these imports when wiring real sources) ──────────── */
export type { ContentRow } from './views/content/ContentListView.vue'
export type { MediaItem } from './views/media/MediaGridView.vue'
