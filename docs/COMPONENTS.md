# Component and composable reference

Every export of `@iamsaeed/admin-ui`, with its real props, events and slots.

```ts
import { AdminLayout, Dialog, useTheme } from '@iamsaeed/admin-ui'
import { DashboardView } from '@iamsaeed/admin-ui/views'   // separate entry
```

Two design rules explain most of the API below:

- **Everything is data in, events out.** The library never reads `$route`, never requires Pinia,
  never fetches. Nav, notifications and menu entries are passed in; the component emits an id and
  your app decides what it means. This is what lets a Blade-hosted or router-less app use the shell.
- **Destinations are route names, never paths.**

For the CSS classes that make up the rest of a screen, see [CLASSES.md](./CLASSES.md).

---

## Contents

**Layouts** — [AdminLayout](#adminlayout) · [AuthLayout](#authlayout)
**Shell** — [AppSidebar](#appsidebar) · [AppTopbar](#apptopbar) · [BottomNav](#bottomnav) · [UserMenu](#usermenu) · [NotificationsMenu](#notificationsmenu) · [TweaksPanel](#tweakspanel)
**UI** — [Dialog](#dialog) · [Icon](#icon) · [KitSection / KitBlock](#kitsection--kitblock)
**Composables** — [useTheme](#usetheme) · [useSidebar](#usesidebar) · [useFocusTrap](#usefocustrap) · [useMenuButton](#usemenubutton) · [useBreakpoint](#usebreakpoint)
**Types and data** — [Types](#types) · [Theme constants](#theme-constants) · [Colour helpers](#colour-helpers) · [Icons](#icon-names) · [Views](#views)

---

## AdminLayout

The admin shell. Below `lg` the content is full-bleed and nav lives in an off-canvas drawer, with
an optional bottom bar; from `lg` a permanent rail sits beside the content and can collapse to
icons. Ships the skip link, the drawer focus trap, Escape-to-close and body scroll lock.

### Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `nav` | `NavSchema` | — | **Required.** Sections of nav items |
| `bottomNav` | `BottomNavItem[]` | — | Phone bottom bar. Omit for none |
| `activeId` | `string` | — | Id of the current destination |
| `title` | `string` | — | Topbar title |
| `productName` | `string` | `'Lumen'` | Brand name in the rail |
| `productTag` | `string` | `'Admin'` | Brand sub-label |
| `version` | `string` | — | Shown at the foot of the rail |
| `userName` | `string` | — | Account menu |
| `userEmail` | `string` | — | Account menu |
| `userMenuItems` | `UserMenuItem[]` | Settings + Sign out | Account menu entries |
| `notificationCount` | `number` | counted from `notifications` | Overrides the unread badge |
| `notifications` | `NotificationItem[]` | `[]` | Bell dropdown contents |

### Events

| Event | Payload | Fires when |
|---|---|---|
| `navigate` | `id: string` | A nav item is chosen (drawer closes itself) |
| `search` | `q: string` | The topbar search is submitted |
| `openTweaks` | — | The theme-tweaks button is pressed |
| `userMenuSelect` | `id: string` | An account-menu entry is chosen |
| `notificationSelect` | `id: string` | A notification is clicked |
| `notificationsMarkAllRead` | — | "Mark all read" is pressed |
| `notificationsViewAll` | — | "View all" is pressed |

### Slots

| Slot | For |
|---|---|
| default | Page content |
| `brand` | Replaces the rail's brand block |
| `topbar-actions` | Extra topbar controls, before the bell |

```vue
<AdminLayout
  :nav="NAV"
  :bottom-nav="BOTTOM_NAV"
  :active-id="activeId"
  :title="title"
  product-name="Acme"
  product-tag="Admin"
  user-name="Ahmad"
  :notifications="notifications"
  @navigate="id => router.push({ name: id })"
  @open-tweaks="tweaksOpen = true"
>
  <RouterView />
</AdminLayout>
```

`AdminLayout` does **not** render `TweaksPanel` — mount that yourself beside the layout, so an app
that does not offer theme control to its users does not ship it.

---

## AuthLayout

Split sign-in shell. The phone gets the form alone, full-bleed; the decorative panel returns at
`lg`, because on a 390px screen it would push the actual task below the fold.

| Prop | Type | Default |
|---|---|---|
| `productName` | `string` | `'Lumen'` |
| `productTag` | `string` | `'Admin'` |
| `headline` | `string` | — |
| `subline` | `string` | — |

`headline` and `subline` are marketing copy for the art panel, desktop only.

Slots: default (the form), `brand`.

---

## AppSidebar

The navigation rail. One component serves both shell modes, because duplicating it is how the two
drift apart — `variant` changes chrome only, never the tree. `AdminLayout` renders this for you;
use it directly only if you are building your own shell.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `nav` | `NavSchema` | — | **Required** |
| `activeId` | `string` | — | Passed in, not read from `$route` |
| `variant` | `'rail' \| 'drawer'` | `'rail'` | `rail` = permanent desktop; `drawer` = inside the mobile drawer |
| `productName` | `string` | `'Lumen'` | |
| `productTag` | `string` | `'Admin'` | |
| `version` | `string` | — | |

Events: `navigate(id)`, `close()` — a drawer emits `close` after `navigate`.
Slots: `brand`.

A nav item with `children` renders as an expandable group; choosing the parent toggles the group
rather than navigating. Only one group is open at a time.

---

## AppTopbar

The topbar. On a phone: hamburger, title, at most two icon actions, and a search that expands
full-screen rather than competing for width. The inline search field and the rail collapse toggle
appear from `lg`. Rendered by `AdminLayout`.

| Prop | Type | Default |
|---|---|---|
| `title` | `string` | — |
| `searchPlaceholder` | `string` | `'Search…'` |
| `notificationCount` | `number` | counted from `notifications` |
| `notifications` | `NotificationItem[]` | `[]` |
| `userName` | `string` | — |
| `userEmail` | `string` | — |
| `userMenuItems` | `UserMenuItem[]` | Settings + Sign out |
| `showThemeToggle` | `boolean` | `true` |

Events: `search(q)`, `openTweaks()`, `userMenuSelect(id)`, `notificationSelect(id)`,
`notificationsMarkAllRead()`, `notificationsViewAll()`.
Slots: `actions`.

---

## BottomNav

Phone-only thumb-zone navigation. The top of a phone screen is the hardest place to reach
one-handed, and burying every primary destination behind a hamburger costs a tap each time.

| Prop | Type | Notes |
|---|---|---|
| `items` | `BottomNavItem[]` | **Required.** Capped at 5, or 4 when `showMore` is set |
| `activeId` | `string` | |
| `showMore` | `boolean` | Appends a "More" button that opens the nav drawer |

Events: `navigate(id)`.

The cap is real: beyond five, each target drops below a comfortable thumb width. Overflow belongs
in the drawer.

---

## UserMenu

The topbar account menu — avatar and name, opening account actions. Rendered by `AppTopbar`.

| Prop | Type | Default |
|---|---|---|
| `userName` | `string` | — |
| `userEmail` | `string` | — |
| `items` | `UserMenuItem[]` | Settings + Sign out |
| `showName` | `boolean` | `true` |

Events: `select(id)`.

Keyboard contract (shared with `NotificationsMenu` via `useMenuButton`): focus lands on the first
item, arrows wrap, Escape closes and restores focus to the trigger, Tab closes without stealing
focus, an outside click dismisses. **No focus trap and no `aria-modal`** — a menu is not a dialog
and must not claim the page behind it is inert.

---

## NotificationsMenu

The topbar bell: unread indicator plus a dropdown of recent items. Rendered by `AppTopbar`.

| Prop | Type | Default |
|---|---|---|
| `items` | `NotificationItem[]` | `[]` |
| `count` | `number` | counted from `items` where `unread` |
| `emptyText` | `string` | `"You're all caught up."` |

Events: `select(id)`, `markAllRead()`, `viewAll()`.

The shell never fetches, never marks anything read, and never decides what a click means — it
emits an id. The unread count is announced, not just shown as a dot, because a red dot alone tells
a screen-reader user nothing.

---

## TweaksPanel

Live theme editor — a drawer exposing all four axes. It ships in the **library**, not the docs
app, because an admin product usually wants to give its own users theme control. Mount it once
beside the layout. It is also the fastest way to QA a change.

| Prop | Type |
|---|---|
| `open` | `boolean` — **required** |

Events: `close()`.

```vue
<TweaksPanel :open="tweaksOpen" @close="tweaksOpen = false" />
```

---

## Dialog

One dialog for the three things an admin actually asks: confirm something, collect a short answer,
or show a form. Focus trap, Escape and focus restore are wired in so a consumer cannot forget
them.

| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | `boolean` | — | **Required** |
| `title` | `string` | — | **Required** |
| `description` | `string` | — | Under the title |
| `mode` | `'plain' \| 'confirm' \| 'prompt'` | `'plain'` | `plain` renders the default slot |
| `tone` | `'primary' \| 'danger'` | `'primary'` | Colours the confirming button only |
| `confirmLabel` | `string` | `'Confirm'` | |
| `cancelLabel` | `string` | `'Cancel'` | |
| `busy` | `boolean` | `false` | Work in flight: cannot be dismissed by accident |
| `error` | `string` | `''` | Server message, shown above the content verbatim |
| `label` | `string` | `''` | **prompt only** — field label |
| `placeholder` | `string` | `''` | prompt only |
| `hint` | `string` | `''` | prompt only |
| `initialValue` | `string` | `''` | prompt only |
| `multiline` | `boolean` | `false` | prompt only — textarea instead of input |
| `minLength` | `number` | `0` | prompt only |
| `maxLength` | `number` | `255` | prompt only |

Events: `confirm(value: string)` — the text for a prompt, empty for a confirm — and `close()`.
Slots: default (plain mode content), `actions` (replaces the footer buttons).

```vue
<Dialog
  :open="confirmOpen"
  mode="confirm"
  tone="danger"
  title="Delete this invoice?"
  description="This cannot be undone."
  confirm-label="Delete"
  :busy="deleting"
  :error="deleteError"
  @confirm="remove"
  @close="confirmOpen = false"
/>
```

`mode="confirm"` renders as `role="alertdialog"`; the others as `role="dialog"`. Screen readers
announce the two differently, so the distinction is not cosmetic. In `prompt` mode initial focus
goes to the field, not the close button.

Use this rather than hand-rolling `.modal` markup, and never use `window.confirm` / `window.prompt`
— the browser's own dialogs cannot be styled, ignore the theme, and freeze the page.

---

## Icon

| Prop | Type | Default | Notes |
|---|---|---|---|
| `name` | `IconName \| string` | — | **Required.** See [icon names](#icon-names) |
| `size` | `number \| string` | `18` | Pixels; always square |
| `stroke` | `number` | `1.75` | |
| `label` | `string` | — | Accessible name |

Icons are **decorative by default** — hidden from assistive tech, because an icon next to a
visible label would otherwise be read twice. Pass `label` only when the icon *is* the only
content, such as an icon-only button.

```vue
<Icon name="search" />
<Icon name="trash" :size="16" label="Delete" />
```

An unknown name renders nothing rather than throwing.

---

## KitSection / KitBlock

Style-guide scaffolding, used by the kit pages.

- `KitSection` — props `title`, `hint?`; default slot.
- `KitBlock` — prop `label`; default slot.

You will not usually need these in an application.

---

## useTheme

Singleton theme state, persisted to `localStorage` under `lm-theme` and applied to `<html>`.

```ts
const {
  theme, skin, density, radius, accentHue, resolvedTheme,
  setTheme, setSkin, setDensity, setRadius, setAccentHue,
  toggleDark, reset,
} = useTheme()
```

| Member | Type | Notes |
|---|---|---|
| `theme` | `ComputedRef<ThemePreference>` | Includes `'system'` |
| `resolvedTheme` | `ComputedRef<Theme>` | `'system'` resolved to light or dark |
| `skin` / `density` / `radius` | `ComputedRef<…>` | |
| `accentHue` | `ComputedRef<number \| null>` | `null` means the skin's own hue |
| `setTheme(v)` | `ThemePreference` | `'light' \| 'dark' \| 'sepia' \| 'system'` |
| `setSkin(v)` | `Skin` | |
| `setDensity(v)` | `Density` | |
| `setRadius(v)` | `Radius` | |
| `setAccentHue(hue \| null)` | `number \| null` | Arbitrary brand hue — also computes the correct chroma |
| `toggleDark()` | — | |
| `reset()` | — | Back to defaults |

`setAccentHue` is the per-tenant entry point: give it a hue from a database row and the whole
palette re-derives at runtime, with contrast preserved by construction. It calls
`maxChromaForHue()` internally, because sRGB's gamut is strongly hue-dependent — at the solid
lightness violet reaches chroma 0.29 while teal tops out at 0.083, so a single shared chroma
either washes out one or clips the other.

---

## useSidebar

Singleton shell state. `collapsed` (desktop rail collapsed to icons) and `drawerOpen` (mobile
off-canvas) are **separate pieces of state** — conflating them is the classic responsive-admin
bug. Only `collapsed` is persisted; a drawer that survived a reload would land the user on a page
with the nav covering the content.

```ts
const {
  collapsed, drawerOpen, openGroup,
  toggleCollapsed, setCollapsed,
  openDrawer, closeDrawer, toggleDrawer,
  toggleGroup, setOpenGroup,
} = useSidebar()
```

Handled for you: the drawer closes when the viewport grows into desktop (otherwise it lingers as
an invisible focus trap), body scroll locks while it is open, and collapsing the rail clears the
expanded group.

`setOpenGroup(id)` is the one you will reach for in an app — call it on route change so a deep
link does not land on a page whose nav parent is collapsed.

---

## useFocusTrap

```ts
useFocusTrap(active: Ref<boolean>, container: Ref<HTMLElement | null>, options?: FocusTrapOptions)
```

| Option | Type | Default | Notes |
|---|---|---|---|
| `initialFocus` | `() => HTMLElement \| null` | first focusable | Focus this instead |
| `restoreFocus` | `boolean` | `true` | Only disable when the trigger is gone |

While `active`, Tab and Shift+Tab wrap at both ends and focus that escapes is pulled back; on
close, focus returns to the trigger.

**Any element carrying `aria-modal="true"` must use this.** Without it the attribute is a lie:
the screen-reader user is told the rest of the page is inert while Tab walks them through it.
Restoring focus is the half people forget — without it, dismissing a dialog drops focus onto
`<body>` and the next Tab restarts from the top of the document.

---

## useMenuButton

The shared keyboard contract for a button that opens a menu — used by `UserMenu` and
`NotificationsMenu`.

```ts
const { open, openMenu, closeMenu, toggle, focusItem,
        onTriggerKeydown, onMenuKeydown, onMenuFocusOut } =
  useMenuButton({ root, trigger, menu })   // three element refs
```

Gives you: focus on the first item when opened by keyboard, arrow-key movement that wraps, Escape
to close and restore focus, Tab closes without stealing focus, outside click dismisses.

Use this for a menu, and `useFocusTrap` for a dialog. A menu must not trap focus or claim
`aria-modal`.

---

## useBreakpoint

```ts
import { useBreakpoint, useIsDesktop, useIsTouch, BREAKPOINTS } from '@iamsaeed/admin-ui'

const isMd = useBreakpoint('md')   // reactive min-width match
const isDesktop = useIsDesktop()   // >= lg
const isTouch = useIsTouch()       // pointer: coarse
```

`BREAKPOINTS`: `xs` 360, `sm` 640, `md` 768, `lg` 1024, `xl` 1280, `2xl` 1536.

These mirror the CSS. **Prefer a CSS media query when a CSS media query will do** — this exists
for the cases where layout genuinely depends on JS, such as which element to teleport or whether
to trap focus.

---

## Types

```ts
import type {
  NavItem, NavSection, NavSchema, BottomNavItem, UserMenuItem,
  NotificationItem, IconName,
  Theme, Skin, Density, Radius, ThemePreference, ThemeState,
  BreakpointKey, FocusTrapOptions,
} from '@iamsaeed/admin-ui'
```

```ts
interface NavItem {
  id: string
  label: string
  icon?: IconName | string
  to?: string          // vue-router route NAME, never a path
  badge?: string | number
  children?: NavItem[] // a parent with children renders as an expandable group
  visible?: boolean    // hide behind a permission the app resolves
}

interface NavSection { id: string; label?: string; items: NavItem[] }
type NavSchema = NavSection[]

interface BottomNavItem { id: string; label: string; icon: IconName | string; to?: string; badge?: string | number }

interface UserMenuItem {
  id: string
  label: string
  icon?: IconName | string
  danger?: boolean     // destructive styling; sign-out is the usual one
  separated?: boolean  // separator ABOVE this item
}

interface NotificationItem {
  id: string
  title: string
  body?: string
  time?: string        // pre-formatted ("2h ago") — only the app knows the locale
  icon?: IconName | string
  unread?: boolean
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger'
}
```

---

## Theme constants

```ts
import {
  THEMES, SKINS, DENSITIES, RADII,
  SKIN_HUES, SKIN_CHROMA, SKIN_LABELS,
  DEFAULT_THEME_STATE, STORAGE_KEY, themeInitScript,
} from '@iamsaeed/admin-ui'
```

| Constant | Value |
|---|---|
| `THEMES` | `light` `dark` `sepia` |
| `SKINS` | `violet` `indigo` `blue` `teal` `green` `amber` `rose` `slate` |
| `DENSITIES` | `compact` `regular` `comfy` |
| `RADII` | `sharp` `regular` `round` |
| `DEFAULT_THEME_STATE` | theme `system`, skin `violet`, density `regular`, radius `regular`, accentHue `null` |
| `STORAGE_KEY` | `'lm-theme'` |
| `themeInitScript` | The FOUC guard — see [INTEGRATION.md](./INTEGRATION.md) |

Each axis is an attribute on `<html>`: `data-theme`, `data-skin`, `data-density`, `data-radius`.
They are independent and compose freely — 3 × 8 × 3 × 3 = 216 configurations from one stylesheet.

---

## Colour helpers

```ts
import { maxChromaForHue, oklchToRgb, contrastRatio, isInGamut } from '@iamsaeed/admin-ui'
```

Exported mainly so a host app can validate a tenant's brand colour before saving it. The colour
maths is pinned against ground truth captured from Chrome's own engine, because every contrast
number downstream depends on it being right.

---

## Icon names

67 Lucide-style stroke icons, all `currentColor`. `ICON_NAMES` and `ICON_PATHS` are exported; the
`IconName` type gives you autocomplete.

```
alert-triangle archive arrow-left arrow-right arrow-up bar-chart bell calendar check
check-circle chevron-down chevron-left chevron-right code copy credit-card download edit
eye eye-off file-text filter flask folder globe help history home image inbox info layers
layout-grid lock log-out mail menu message-square moon more network palette panel-left play
plug plus receipt refresh search send settings shield sliders sparkles star sun tag target
trash trend-down trend-up upload user users video x zap
```

---

## Views

37 ported screens on a **separate entry point**, so an app that never imports one does not ship
them:

```ts
import { DashboardView, SignInView } from '@iamsaeed/admin-ui/views'
```

They are **starting points carrying demo data**, not part of the design system. Typical use is to
copy one into your app and replace its data source, or mount it directly while the real screen is
being built.

| Group | Views |
|---|---|
| Dashboard | `DashboardView` |
| Auth | `SignInView` `SignUpView` `ForgotPasswordView` |
| Content | `ContentListView` `PostsView` `PagesView` `DraftsView` `ArchiveView` `CommentsView` `TaxonomiesView` |
| Media | `MediaGridView` `ImagesView` `VideosView` `DocumentsView` |
| Users | `AllUsersView` `RolesView` `InvitationsView` |
| Settings | `SettingsLayout` `GeneralView` `AppearanceView` `IntegrationsView` `BillingView` |
| Other | `AnalyticsView` `HelpView` |
| Style guide | `KitFoundationsView` `KitButtonsView` `KitInputsView` `KitControlsView` `KitDataView` `KitChartsView` `KitFeedbackView` `KitNavigationView` `KitOverlaysView` `KitMediaView` `KitTypographyView` `KitMarketingView` |

The `Kit*` views are the living style guide — mount them in your own app if you want an in-house
component gallery that tracks the version you actually depend on.
