# `@iamsaeed/admin-ui`

A mobile-first, runtime-skinnable Vue 3 admin design system. Install it as a dependency instead
of porting the same theme into a fifth project.

```
packages/ui     @iamsaeed/admin-ui  — the library
apps/docs       living style guide — every component, in every axis
```

## Quick start

```bash
npm install                 # workspaces
npm run dev                 # style guide on http://127.0.0.1:5200
npm run build               # library + docs
```

## Using it in an app

```bash
npm install "file:../../themes/admin-panel/packages/ui"    # or a git URL
```

```css
/* app.css — one import brings tokens, base styles and component classes */
@import '@iamsaeed/admin-ui/styles';
@source "./resources/js";   /* so Tailwind scans YOUR templates too */
```

```ts
import { AdminLayout, TweaksPanel, useTheme } from '@iamsaeed/admin-ui'
```

Add the FOUC guard to your HTML `<head>`, **before** the stylesheet — without it every cold load
flashes the default theme before your saved one applies:

```ts
import { themeInitScript } from '@iamsaeed/admin-ui'
// Blade: <script>{!! $adminUiInitScript !!}</script>
```

## The four axes

Set on `<html>`. They are **independent** and compose freely.

| Axis | Attribute | Values | Controls |
|------|-----------|--------|----------|
| Theme | `data-theme` | `light` `dark` `sepia` | surface + text lightness |
| Skin | `data-skin` | `violet` `indigo` `blue` `teal` `green` `amber` `rose` `slate` | accent hue + chroma |
| Density | `data-density` | `compact` `regular` `comfy` | control sizing, rhythm, sidebar width |
| Radius | `data-radius` | `sharp` `regular` `round` | corner scale |

3 × 8 × 3 × 3 = **216 configurations from one stylesheet**, all switchable at runtime.

```ts
const { setTheme, setSkin, setDensity, setRadius, setAccentHue } = useTheme()
setSkin('teal')          // persisted, applied immediately
setAccentHue(12)         // arbitrary brand hue — no rebuild, no CSS
```

`setAccentHue` also computes the right **chroma** for that hue, because sRGB's
gamut is not hue-uniform — see "Adding a brand skin" below.

## Why not Sass variables?

The brief for this repo was "bootstrap-sass: change a variable, get a new theme". This does
something strictly better, because the palette is **oklch** and every accent shade derives from
the skin's hue at a lightness the contrast suite governs:

```css
--lm-accent-h: 290;
--lm-skin-c: 0.216;
--lm-accent: oklch(var(--lm-accent-l) var(--lm-accent-c) var(--lm-accent-h));
```

|  | bootstrap-sass | this |
|---|---|---|
| Change a theme | recompile | one CSS variable |
| Switch at runtime | ✗ | ✓ |
| Per-tenant colour from a DB row | ✗ | ✓ |
| Ship N themes in one bundle | N stylesheets | 1 stylesheet |
| Arbitrary brand colour | edit + rebuild | `setAccentHue(12)` |
| Contrast when the brand changes | re-check every shade by hand | preserved by construction |

That last row is the real argument. **Lightness** is fixed in `tokens.css`, and lightness is what
carries contrast — so a new brand cannot silently produce an unreadable button. `tests/contrast.test.ts`
enforces this for all 24 theme × skin combinations on every run.

## Adding a brand skin

```css
[data-skin='acme'] { --lm-accent-h: 12; --lm-skin-c: 0.18; }
```

Then add `'acme'` to `SKINS` in `src/theme/config.ts` so the pickers and types know about it, and
run `npm test` — the suite will fail if that chroma is out of gamut or the result misses AA.

**Why a skin is two numbers, not one.** sRGB's gamut is strongly hue-dependent: at the solid
lightness, violet reaches chroma 0.29 while teal tops out at 0.083. A single shared chroma either
washes out violet or silently clips teal. The Lumen theme this was derived from used `0.18` for
everything and was clipping four of its own skins — teal, green, blue and amber were not the
colours their tokens claimed. `--lm-skin-c` is each skin's measured ceiling, so every skin is as
vivid as sRGB actually allows and none of them clip.

You do not have to compute it for a runtime colour — `setAccentHue(hue)` calls `maxChromaForHue()`
and sets both.

## Accessibility is tested, not asserted

```bash
npm test          # 480 assertions
```

The suite covers the palette, the colour maths, the focus trap and the theme composable.

`tests/contrast.test.ts` walks **every** theme × skin pair and checks the pairs a user actually
reads — body and muted text on all four surfaces, button labels on the accent and on hover, badge
text on soft backgrounds, every status colour on its own soft background, focus-ring visibility,
and sRGB gamut for every accent shade. It parses the real `tokens.css`, so it cannot drift from
the stylesheet, and `assertParsedShape()` fails loudly if the parser stops finding what it expects
rather than degrading into vacuous success.

Writing it was worth it immediately — it found that the inherited palette had **warning text at
1.78:1**, success at 2.21:1, info at 2.25:1, primary button labels at 2.97:1 and accent badges at
2.67:1, all far below the 4.5:1 required. Every lightness in `tokens.css` is now solved rather
than eyeballed.

The colour maths is pinned against ground truth captured from Chrome's own engine
(`tests/oklch.test.ts`), because every contrast number downstream depends on it being right.

## Token layers

```
Layer 1  primitives   --lm-accent-h, --lm-accent-l/-c   (raw inputs, private)
Layer 2  semantic     --lm-surface, --lm-fg, --lm-accent (what components use)
Layer 3  component    --lm-sidebar-w, --lm-control-h     (derived, overridable)
```

**Components read Layer 2 only.** Grep `src/styles/components.css` for `#` or `rgb(` — there are
no hits, and that property is what keeps a skin a one-line change.

One subtlety worth knowing before you edit `tokens.css`: the accent ramp is composed in a rule
matching `:root, [data-skin]`, not in `:root` alone. A custom property substitutes its `var()`
references on the element where it is *declared*, so a ramp declared only on `:root` could never
be re-derived by a descendant — nested per-tenant theming would silently do nothing. Matching
`[data-skin]` too makes `<div data-skin="teal">` work at any depth, inside any theme.

## Mobile-first

The unprefixed rule is the phone; `md:` / `lg:` are the enhancement.

- **Shell** — off-canvas drawer below `lg`, permanent collapsible rail above it; optional bottom
  nav for thumb-zone destinations
- **Touch targets** — a hard 44px floor under `@media (pointer: coarse)` that no density setting
  can undercut
- **Forms** — 16px inputs on phones, because anything smaller makes iOS Safari zoom on focus and
  strands the user mid-form
- **Tables** — re-flow to stacked rows via `.data-table-stack`, labelled from `data-label`; a
  horizontally-scrolling table is a usability failure, not responsiveness
- **Dialogs** — bottom sheets on phones, centred dialogs from `sm`
- **Units** — `dvh` not `vh`; `env(safe-area-inset-*)` for notches and home indicators

## Accessibility

Not optional extras — these are in `base.css` and apply to everything:

- **Contrast is enforced by tests**, not asserted here — see above
- `:focus-visible` ring on every interactive element, keyboard-only
- `prefers-reduced-motion` zeroes the motion tokens at source, so every component complies
  without writing its own media query
- `forced-colors` (Windows high contrast) respected
- Status colours are deliberately **not** skinned — danger must read as danger in every brand
- Skip link as the first focusable element in the shell
- **Overlays genuinely trap focus** (`useFocusTrap`): Tab and Shift+Tab wrap at both ends, focus
  that escapes is pulled back, Escape closes, and focus is **restored to the trigger** on close.
  Body scroll locks behind the drawer.
- Tables that re-flow on mobile keep their `<th>` elements in the accessibility tree
- Toasts and error alerts carry `role="status"` / `role="alert"` so they are announced

### On `aria-modal`

If a dialog carries `aria-modal="true"`, it is telling assistive technology that the rest of the
page is inert. Shipping that attribute without a real trap is a false promise — the screen-reader
user is told they are in a modal while Tab quietly walks them into content they cannot see. This
library shipped exactly that bug in its first pass (the drawer only *moved* focus in; the Tweaks
panel had the attribute and no focus handling at all). `tests/focusTrap.dom.test.ts` is what stops
it coming back.

Restoring focus on close is the half people forget more often. Without it, dismissing a dialog
drops focus onto `<body>` and the next Tab restarts from the top of the document — a keyboard user
loses their place every single time.

## What's in the box

| | |
|---|---|
| Layouts | `AdminLayout`, `AuthLayout` |
| Shell | `AppSidebar`, `AppTopbar`, `BottomNav`, `TweaksPanel`, `UserMenu`, `NotificationsMenu` |
| Composables | `useTheme`, `useSidebar`, `useBreakpoint`, `useIsDesktop`, `useIsTouch`, `useFocusTrap`, `useMenuButton` |
| Primitives | `Dialog` — one overlay for a form, a confirm or a question, focus trap and Escape included |
| Icons | 60 Lucide-style stroke icons, `currentColor` throughout |
| Component classes | ~60 named classes — `.card` `.btn` `.form-*` `.data-table` `.badge` `.alert` `.modal` `.menu` `.nav-item` `.kpi` … |
| Views | 34 ported screens under `@iamsaeed/admin-ui/views`, incl. a 12-page style guide |

Views are **starting points carrying demo data**, exported from a separate entry so an app that
never imports one doesn't ship it.

## Conventions

- Routes are referenced by **name**, never by path — nav data holds route names
- Recurring utility runs become **named classes** in `components.css`, not copy-pasted strings
- Raw colour values live **only** in `tokens.css` and `skins.css`
- The library never reaches into `$route` or requires Pinia — state is passed in or held in
  module-scoped singletons, so a Blade-hosted or router-less app can use the shell

## Origin

Derived from the "Lumen Admin" theme, which had been hand-ported five times across the estate
(`workforce-v2`, `cortexai/platform`, `campaign-saas`, `aptire-projects/full-stack-app`,
`codewithus-portal-ui`) with every copy diverging. See `plans/` for the full design record.
