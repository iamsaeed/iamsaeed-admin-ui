# Integration guide

How to put `@iamsaeed/admin-ui` into an application that is not this repo.

If you want the shortest possible path, read [Prerequisites](#prerequisites) and
[Install](#install), then jump to [FIRST-SCREEN.md](./FIRST-SCREEN.md).

---

## Prerequisites

| Requirement | Why |
|---|---|
| **Tailwind CSS 4** | The stylesheet's first line is `@import 'tailwindcss'`. Tailwind 3 will not work — v4 moved to CSS-first config and `@theme`, which this package relies on |
| **A CSS pipeline that resolves `@import` from `node_modules`** | Vite with `@tailwindcss/vite`, or the Tailwind CLI. PostCSS-only setups need `postcss-import` ahead of Tailwind |
| **Vue 3.5+** | Only if you use the components. Declared as a peer dependency — the package never bundles its own Vue |
| **Node 20+** | Build tooling (Vite 7, Tailwind 4) |

**No Vue Router requirement.** The library is genuinely router-free: it takes an `activeId` and
emits ids. Router names appear in nav *data*, which your app interprets.

**Fonts are optional but intended.** The tokens ask for `Inter`, `Inter Tight` and
`JetBrains Mono`, each with a full system fallback stack. Without them the design degrades to
system fonts rather than breaking. To match the style guide, add:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" />
```

---

## Install

> **This package is not on the public npm registry**, and its repository is private. `npm install
> @iamsaeed/admin-ui` will 404. Pick one of the three routes below until it is published.

### A. Local path (development, sibling checkouts)

Best when the consuming app lives beside this repo and you want edits to show up immediately.

```bash
npm install "file:../../themes/admin-panel/packages/ui"
```

The path points at `packages/ui`, **not** the repo root — the root is a private workspace anchor
and is not the package.

### B. Tarball (the portable option today)

```bash
# in this repo
cd packages/ui
npm run build          # dist/ must exist; `files` ships dist + src
npm pack               # → iamsaeed-admin-ui-0.4.0.tgz

# in the consuming app
npm install /path/to/iamsaeed-admin-ui-0.4.0.tgz
```

Commit the tarball to your app, or host it, and you have a reproducible install with no registry.

### C. Publish (the real fix)

Publish `packages/ui` to npm or a private registry such as GitHub Packages, then install by name.
Note that `npm install <git-url>` is **not** a workaround: npm cannot install a subdirectory of a
git repository, and this repo's root is a workspace container, not the package.

Before publishing, add `repository`, `license` and (for a scoped private registry)
`publishConfig` to `packages/ui/package.json` — none are currently set.

---

## Wire it up

Four steps. Only the first two are strictly required.

### 1. Import the stylesheet — once

```css
/* app.css */
@import '@iamsaeed/admin-ui/styles';

/* Tailwind must also scan YOUR templates, or classes you write are not generated. */
@source "./resources/js";
```

That single import pulls Tailwind, the tokens, the skins, the `@theme` bindings, the base layer
and every component class, **in that order** — the order matters, so do not split it up.

The package scans its own source internally, so its classes are always generated. The `@source`
line is about *your* files. Point it at wherever your templates live: `./src`, `./resources/js`,
`./app`, or several lines.

### 2. Add the FOUC guard

Without it, every cold load flashes the default theme before the saved one applies — the app's JS
only restores the theme after hydration, by which point the wrong palette has already painted.

The script must run **before the stylesheet**, in `<head>`. The package exports it as a string:

```ts
import { themeInitScript } from '@iamsaeed/admin-ui'
```

Inline it directly if your host is a static `index.html`:

```html
<script>
  (function () {
    try {
      var s = JSON.parse(localStorage.getItem('lm-theme') || '{}')
      var d = document.documentElement
      var t = s.theme || 'system'
      if (t === 'system') t = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      d.setAttribute('data-theme', t)
      d.setAttribute('data-skin', s.skin || 'violet')
      d.setAttribute('data-density', s.density || 'regular')
      d.setAttribute('data-radius', s.radius || 'regular')
      if (s.accentHue != null) d.style.setProperty('--lm-accent-h', String(s.accentHue))
    } catch (e) {}
  })()
</script>
```

Also set the viewport with `viewport-fit=cover`, or the safe-area padding the components use for
notches and home indicators does nothing:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

### 3. Mount the shell

See [FIRST-SCREEN.md](./FIRST-SCREEN.md) for a complete working file.

### 4. Offer theme control (optional)

```vue
<TweaksPanel :open="tweaksOpen" @close="tweaksOpen = false" />
```

Mount it once beside the layout. Omit it entirely if your app does not let users change the theme
— `AdminLayout` does not render it for you, so you pay nothing.

---

## Per-host recipes

### Vite + Vue (SPA)

```bash
npm install @tailwindcss/vite tailwindcss
```

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({ plugins: [vue(), tailwindcss()] })
```

```css
/* src/styles.css */
@import '@iamsaeed/admin-ui/styles';
@source "./";
```

`main.ts` imports `./styles.css`; `index.html` carries the FOUC guard and the viewport meta.

### Laravel + Vite + Vue

```css
/* resources/css/app.css */
@import '@iamsaeed/admin-ui/styles';
@source "../js";
@source "../views";   /* if Blade templates also use the classes */
```

```php
// vite.config.js plugins: laravel(...), vue(), tailwindcss()
```

The FOUC guard goes in your layout Blade, **before** `@vite`:

```blade
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <script>{!! $adminUiInitScript !!}</script>
  @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
```

Expose `$adminUiInitScript` from a view composer or a service provider, reading the exported
constant at build time or pasting the inline version above.

### Nuxt

Add the stylesheet in `nuxt.config.ts` (`css: ['~/assets/app.css']`) with the Tailwind Vite plugin
in `vite.plugins`. The FOUC guard goes in `app.head.script` with `tagPosition: 'head'` and
`innerHTML` set to `themeInitScript` — mark it `tagPriority` high so it precedes the stylesheet.
Components are client-safe: theme and sidebar state both guard `typeof window`.

### CSS only — Blade, React, Django, plain HTML

The **stylesheet is framework-neutral**. Every class in [CLASSES.md](./CLASSES.md) works in any
markup; only the Vue components need Vue.

```css
@import '@iamsaeed/admin-ui/styles';
@source "./templates";
```

You get: the full token system, all four runtime axes, every component class, the base
accessibility layer. You do not get: the shell, the focus traps, `Dialog`, the composables. If you
build your own overlay this way, read the `aria-modal` warning in
[CLASSES.md → Overlays](./CLASSES.md#overlays) — it is the one thing that is easy to get
dangerously wrong.

Switch axes from plain JS:

```js
document.documentElement.setAttribute('data-skin', 'teal')
document.documentElement.style.setProperty('--lm-accent-h', '12')
```

Persisting them is your app's job; the format is the JSON blob under `localStorage['lm-theme']`
shown in the FOUC guard above.

---

## Per-tenant branding

```ts
const { setAccentHue } = useTheme()
setAccentHue(tenant.brandHue)   // 0–360, no rebuild, no extra CSS
```

Contrast is preserved by construction: **lightness** is fixed in the tokens and lightness is what
carries contrast, so a new brand colour cannot silently produce an unreadable button.
`setAccentHue` also computes the correct chroma for that hue, because sRGB's gamut is not
hue-uniform.

If you need a *named* skin rather than a runtime hue, add one line of CSS in your app:

```css
[data-skin='acme'] { --lm-accent-h: 12; --lm-skin-c: 0.18; }
```

Do not guess the chroma — `maxChromaForHue(12)` gives you the value that is as vivid as sRGB
allows without clipping.

**Nested theming works**: `<div data-skin="teal">` re-derives the whole accent ramp at any depth,
inside any theme, because the ramp is composed in a rule matching `:root, [data-skin]`.

---

## Troubleshooting

| Symptom | Cause |
|---|---|
| Nothing is styled | Tailwind 3 instead of 4, or the pipeline cannot resolve `@import` from `node_modules` |
| Component classes work, your own utilities do not | Missing or wrong `@source` — it must point at your templates |
| A flash of the wrong theme on load | The FOUC guard is missing, or placed after the stylesheet |
| Theme switches but nothing changes | The axis attributes are not on `<html>`. They must be on the root element, not `<body>` |
| Content sits under the notch or home indicator | `viewport-fit=cover` missing from the viewport meta |
| Two Vue instances / "inject() can only be used inside setup" | Vue got bundled twice. It is a peer dependency and external in the build; make sure the app has exactly one copy |
| Dark mode always on in headless tests | The default theme is `system`, and headless Chrome resolves `prefers-color-scheme` to dark. Stamp `data-theme` explicitly in tests |
| A hand-rolled modal traps nothing | Use `Dialog`, or wire `useFocusTrap` yourself. `aria-modal` without a trap is worse than no modal |

---

## Upgrading

The package is at **0.4.0** and has no changelog yet. Until one exists, pin an exact version (or a
specific tarball) rather than a range, and re-run your own visual check after bumping. The
library's own suite — `npm test`, 546 assertions across contrast, gamut, colour maths, focus trap,
menus, dialogs and theme state, plus an axe-core audit over 35 routes × 3 themes × 2 viewports — runs in this
repo, not in yours.
