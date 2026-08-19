# Plan: `@iamsaeed/admin-ui` — the reusable admin theme

**Status:** v1 complete (2026-08-19). Type-check clean, build green, all 34 routes
mount with zero runtime errors. Not yet committed; not yet adopted by a consumer.
**Goal:** One professionally-designed, mobile-first, runtime-skinnable Vue 3 admin theme,
installed as an npm dependency by every future app — so the Lumen template is never
hand-ported a fifth time.

## Why this exists

The "Lumen Admin" theme has been ported by hand **five times** across the estate:

| Port | Where | What it kept |
|------|-------|--------------|
| 1 | `~/www/workforce-v2/packages/ui` | 229-line `theme.css`, 47 components |
| 2 | `~/www/cortexai/platform/resources/js/shared` | 36 views + 12 kit pages, `.lumen`-scoped CSS |
| 3 | `~/www/campaign-saas` | 231-line `theme.css` |
| 4 | `~/www/aptire-projects/full-stack-app` | 955-line `theme.css`, 3 themes, productionised |
| 5 | `~/www/codewithus-projects/codewithus-portal-ui` | token demo only |

Every port diverged. A fix in one never reached the others. This repo ends that: the theme
becomes a **versioned dependency**, not a copy-paste.

## Architectural decisions (2026-08-19)

### 1. Tokens are CSS custom properties, NOT Sass variables

The brief asked for "bootstrap-sass, change the variables and get a new theme". We are
deliberately doing something **better**, because the Lumen source already proves the mechanism
(`temp/Admin Panel/styles.css:22`):

```css
--accent-h: 290;                              /* hue is the single source of truth */
--accent:       oklch(0.62 0.18 var(--accent-h));
--accent-hover: oklch(0.56 0.20 var(--accent-h));
--accent-soft:  oklch(0.95 0.04 var(--accent-h));
```

Because the palette is **oklch**, an entire perceptually-uniform accent ramp derives from one
scalar. Consequences:

| | bootstrap-sass | this |
|---|---|---|
| Change a theme | recompile | one CSS variable |
| Switch at runtime | ✗ | ✓ |
| Per-tenant theme from a DB row | ✗ | ✓ |
| Ship N themes in one bundle | N stylesheets | 1 stylesheet |
| Arbitrary brand colour | edit + rebuild | `style="--accent-h: 12"` |

### 2. Four orthogonal axes, not one "theme" blob

Conflating dark mode with brand colour is what makes theme systems collapse. They are
independent attributes on `<html>`:

| Axis | Attribute | Values | Changes |
|------|-----------|--------|---------|
| Theme | `data-theme` | `light` `dark` `sepia` | surface + text lightness |
| Skin | `data-skin` | `violet` `indigo` `blue` `teal` `green` `amber` `rose` `slate` | `--lm-accent-h` only |
| Density | `data-density` | `compact` `regular` `comfy` | spacing + control heights |
| Radius | `data-radius` | `sharp` `regular` `round` | corner scale |

3 × 8 × 3 × 3 = **216 configurations from one stylesheet**, all switchable at runtime.

### 3. Three token layers — components never touch a primitive

```
Layer 1  primitives   --lm-accent-h, --lm-accent-l/-c   (raw inputs, private)
Layer 2  semantic     --lm-surface, --lm-fg, --lm-accent  (what components consume)
Layer 3  component    --lm-sidebar-w, --lm-control-h      (derived, overridable)
```

A skin is a Layer-1 diff. This is what keeps a new brand a ~10-line file instead of a fork.

### 4. Mobile-first is a rewrite, not a media query

The Lumen source is desktop-first: a fixed 264px sidebar, hover-only affordances, sub-44px
targets. v1 designs the small screen first — off-canvas drawer, ≥44px touch targets, optional
bottom nav, `dvh` units, safe-area insets — and treats the desktop sidebar as the enhancement.

### 5. Tailwind v4 `@theme` mapped onto our variables

`@theme` binds Tailwind's scale to our semantic tokens, so `bg-surface` and `var(--color-surface)`
are the same value. Layout uses utilities; recurring patterns are hand-authored semantic classes
(`.card`, `.btn`, `.data-table`) in `@layer components` — satisfying the house rule that theme
colours and repeated utilities live in named classes, never scattered hex.

## Shape

```
~/www/themes/admin-panel/
├── packages/ui/          @iamsaeed/admin-ui — the published library
│   └── src/
│       ├── styles/       tokens · skins · base · components (the design system)
│       ├── components/   layout · ui · dashboard · auth
│       ├── layouts/      AdminLayout · AuthLayout
│       ├── composables/  useTheme · useSidebar · useBreakpoint (singletons, NOT Pinia)
│       └── views/        the 34 ported pages, as importable scaffolding
└── apps/docs/            living style guide — browse/QA every component in every axis
```

Consumers install the package and import `@iamsaeed/admin-ui/styles`. No copy-paste.

## Phases

- [x] **P0** Repo scaffold — npm workspaces, TS, Vite lib mode, CLAUDE.md, TODO.md
- [x] **P1** Token architecture — 3 layers, 4 axes, Tailwind v4 `@theme`, base + component CSS
- [x] **P2** Runtime — `useTheme`/`useSidebar`/`useBreakpoint`, persistence, FOUC guard.
      Built as module-scoped singleton composables, **not** Pinia stores as originally sketched:
      the theme must be settable before an app mounts (and from plain script in a Blade page),
      so depending on Pinia's install order would be a liability for a library.
- [x] **P3** Responsive shell — AppShell, AppSidebar, AppDrawer, AppTopbar, BottomNav, AdminLayout, AuthLayout
- [x] **P4** UI primitives — delivered as ~60 named CSS classes in `components.css` rather
      than Vue wrapper components. Reason: a `.btn` class works in Blade, in a view, and in a
      consumer's own markup; a `<Btn>` wrapper only works in Vue and adds a layer to maintain.
- [x] **P5** Dashboard widgets — built as inline SVG against `--lm-c1…c5` instead of a chart
      library, so there is no second hard-coded palette to keep in sync with the tokens.
- [x] **P6** Kit — the 12-page living style guide
- [x] **P7** Views — 34 screens (content · media · users · settings · auth · kit). Four
      near-identical content screens collapsed onto one `ContentListView`, and three media
      screens onto one `MediaGridView`, so a fix reaches all of them.
- [x] **P8** Build + verify in browser across all four axes
- [x] **P9** Register in cortexai `brain/PROJECTS.md` + `REUSE.md`

## Discovered during the build — worth keeping

**The accent ramp cannot live in `:root` alone.** A custom property substitutes its `var()`
references at computed-value time **on the element where it is declared**. A ramp declared only
on `:root` therefore resolves there, and descendants inherit the finished colour — so setting
`--lm-accent-h` on a child does nothing whatsoever. This is invisible in the normal case (all
four axes sit on `<html>`, so they resolve together) and silently breaks the moment anyone tries
per-section or per-tenant theming.

Fixed by composing the ramp in a rule matching **`:root, [data-skin]`**, with themes overriding
only the lightness/chroma *inputs*. Hue and theme now compose at any depth. Caught because the
style guide's own skin swatches all rendered violet.

Two smaller ones, both caught in the browser rather than by types:

- The shared scrim was stacked **above** the drawer (`--lm-z-scrim: 45` > `--lm-z-drawer: 40`),
  so opening the mobile nav dimmed the nav itself. The scrim must sit under every surface it
  backs.
- `.card` is not a flex container, so `card card-p flex-col gap-6` silently produced no gap in
  four views.

## What the contrast suite found (2026-08-19, after v1)

Writing `tests/contrast.test.ts` was the highest-value hour of this build. The palette inherited
from Lumen — carried through all five previous ports unexamined — failed WCAG AA broadly:

| Pair | Was | Required |
|------|-----|----------|
| warn text on warn-soft | **1.78:1** | 4.5:1 |
| success text on success-soft | 2.21:1 | 4.5:1 |
| info text on info-soft | 2.25:1 | 4.5:1 |
| accent text on accent-soft (badges, soft buttons) | 2.67:1 | 4.5:1 |
| white label on accent (primary buttons) | 2.97:1 | 4.5:1 |
| danger text on danger-soft | 3.49:1 | 4.5:1 |

120 of 413 assertions failed on the first run. Every accent and status lightness in `tokens.css`
is now **solved** rather than eyeballed, and all 445 assertions pass.

It also found that the "a skin is one number" promise was not quite true. sRGB's gamut is strongly
hue-dependent — at the solid lightness violet reaches chroma 0.29, teal only 0.083 — so the single
shared `0.18` was silently clipping teal, green, blue and amber. Those four skins were not the
colours their own tokens described. A skin is now **two** numbers, hue and chroma, and
`maxChromaForHue()` computes the second one for arbitrary runtime brand colours.

Two smaller corrections came out of the same pass: the scrim assertion was using WCAG contrast
ratio, which is the wrong instrument near black (a dark scrim that removes 61% of backdrop
luminance scores 1.05:1), and `slate` had been overriding the whole lightness ramp — quietly
opting itself out of every guarantee the suite enforces.

## Accessibility audit (2026-08-19, after the contrast work)

Auditing the README's own claims against the code found three real defects — one of which the
documentation actively asserted was already handled:

| Claim / attribute | Reality | Fix |
|---|---|---|
| README: "Drawer traps focus" | It only *moved* focus in; Tab walked out to the page behind | `useFocusTrap` |
| `TweaksPanel` had `aria-modal="true"` | No focus management and no Escape handler at all | `useFocusTrap` + Escape |
| Overlays closing | Focus dropped to `<body>`; next Tab restarted from the top of the document | focus restore |
| `.data-table-stack thead { display: none }` | Removed `<th>` from the a11y tree — mobile screen-reader users lost all column context | visually-hidden instead |
| Toasts | No live region; silent to a screen reader | `role="status"` / `role="alert"` |

Writing the trap's tests then caught a bug in the trap itself: it had no `onScopeDispose`, so a
component unmounting while its overlay was open (a route change with the drawer open, say) leaked
the keydown listener and trapped the **entire page** with no escape short of a reload.

Verified in a real browser as well as jsdom: focus starts inside, wraps at both ends, is pulled
back when it escapes, Escape closes, and focus returns to the trigger.

## Verification

Every phase ends with `npm run build` green, `vue-tsc` clean, and the docs app rendering the
new surface in **light + dark + sepia** at **375px and 1440px** with zero console errors.

## Non-goals for v1

- Publishing to a public npm registry (consumed via `file:`/git dependency first)
- RTL (token architecture must not preclude it; implementation deferred)
- Server-side rendering (the shell is SPA-only for now)
