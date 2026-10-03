# AGENTS.md — using `@iamsaeed/admin-ui` in an application

**For an AI agent building an app that *consumes* this package.** If you are editing the package
itself, read [`CLAUDE.md`](./CLAUDE.md) instead — its rules are about changing the library and
will mislead you here.

`@iamsaeed/admin-ui` is a runtime-skinnable Vue 3 admin design system: tokens, an app shell, a
handful of components, ~110 component classes, and 37 ready-made screens.

---

## Read these before writing code

| Doc | Read it when |
|---|---|
| [`docs/CLASSES.md`](./docs/CLASSES.md) | **Before writing any markup.** The classes are the main API |
| [`docs/COMPONENTS.md`](./docs/COMPONENTS.md) | Before using a component or composable — real props, events, slots |
| [`docs/INTEGRATION.md`](./docs/INTEGRATION.md) | Setting the package up in an app |
| [`docs/FIRST-SCREEN.md`](./docs/FIRST-SCREEN.md) | A complete working example to copy |

If the package is installed, its TypeScript declarations are authoritative and worth reading
directly: `node_modules/@iamsaeed/admin-ui/dist/index.d.ts` and `dist/views.d.ts`. The `.vue`
source ships too, under `node_modules/@iamsaeed/admin-ui/src/`.

---

## The ten rules

1. **Never invent a class name.** Every class is listed in `docs/CLASSES.md`, with a table of
   plausible-but-wrong names. A wrong class fails **silently** — no error, no style — so guessing
   produces a page that looks broken with nothing to debug. `.card-hd` not `.card-header`,
   `.btn-secondary` not `.btn-outline`, `.data-table` not `.table`, `.muted` not `.text-muted`.

2. **Never write a raw colour.** No hex, no `rgb()`, no `oklch()` literal, anywhere near this
   design system. Colours come from tokens; that is what makes a theme or a tenant's brand a
   one-line change. If you need a colour that does not exist, you need a token, not a literal.

3. **Reach for a class before a utility string.** If you find yourself writing the same run of 8
   Tailwind utilities a third time, it is a class — check `docs/CLASSES.md` first, then add one to
   your own app's stylesheet in the same shape.

4. **Routes are referenced by name, never by path** — in nav data, in links, everywhere.

5. **Mobile-first.** The unprefixed rule is the phone; `md:` / `lg:` are the enhancement. Never
   write a desktop rule and then a `max-width` override to undo it.

6. **Do not shrink form controls on phones.** Inputs are 16px below 640px on purpose — anything
   smaller makes iOS Safari zoom on focus and strands the user mid-form. The stylesheet already
   steps down to 13px on larger screens.

7. **Anything with `aria-modal="true"` must trap focus.** The attribute tells assistive tech the
   rest of the page is inert; without a real trap that is a false promise and a screen-reader user
   is walked into content they cannot see. Use the `Dialog` component, or wire `useFocusTrap`
   yourself. Also restore focus to the trigger on close.

8. **`.data-table-stack` requires explicit ARIA roles** — `role="table"`, `role="row"`,
   `role="columnheader"`, `role="cell"` — plus a `data-label` on each `<td>`. Changing `display`
   on table elements strips their implicit roles in every browser, so without these the table
   stops being a table at phone width. Copy the pattern in `docs/FIRST-SCREEN.md`.

9. **Never use `window.alert` / `confirm` / `prompt`.** They cannot be styled, ignore the theme,
   and freeze the page. Use `Dialog` with `mode="confirm"` or `mode="prompt"`.

10. **State goes in, events come out.** The library never reads `$route`, never requires Pinia,
    never fetches, and never decides what a click means. Pass `activeId`, `nav`, `notifications`;
    handle the emitted id. Do not try to make it read your router.

---

## Quick facts

- **Import surface:** `@iamsaeed/admin-ui` (design system), `@iamsaeed/admin-ui/views` (the 37
  screens, separate entry so you do not ship them unless you use them),
  `@iamsaeed/admin-ui/styles` (the one CSS import).
- **Requires Tailwind CSS 4.** Not 3 — the stylesheet opens with `@import 'tailwindcss'` and
  relies on v4's `@theme`.
- **Vue is a peer dependency** (`^3.5.0`). The library is **router-free** — Vue Router is not
  required.
- **Four runtime axes** on `<html>`, independent and composable: `data-theme`
  (light/dark/sepia) × `data-skin` (8 hues) × `data-density` (compact/regular/comfy) ×
  `data-radius` (sharp/regular/round).
- **Per-tenant brand colour:** `useTheme().setAccentHue(hue)` — any hue 0–360, no rebuild, and
  contrast holds because lightness is fixed in the tokens.
- **FOUC guard is required** in `<head>` before the stylesheet, or every cold load flashes the
  default theme. Exported as `themeInitScript`.
- **67 icons**, via `<Icon name="…" />`. Decorative by default; pass `label` only when the icon is
  the only content.

---

## Common tasks

| Task | Do this |
|---|---|
| Build a screen | `.page` > `.page-header` (+ `.page-title`, `.page-actions`) > content. See `docs/FIRST-SCREEN.md` |
| A metric tile | `.card.kpi` with `.kpi-label`, `.kpi-value`, `.kpi-delta.kpi-delta-up`/`-down` |
| A tile grid | `.grid-auto` — two-up on phones, auto-fill from md |
| A table | `.data-table.data-table-stack` + explicit roles + `data-label` |
| A form | `.form-group` inside `.form-row` (`.form-row-2` for two columns from md) |
| Field error | Set `aria-invalid="true"` on the control and add `.form-error` text. No error class |
| A toggle | `<button class="switch" role="switch" aria-checked="…">`. No checked class |
| A confirm | `<Dialog mode="confirm" tone="danger" …>` |
| A dropdown | `.menu` + `.menu-item`; for the keyboard contract use `useMenuButton` |
| A toast | `.toast` inside `.toast-region`, with `role="status"` — the ARIA is what makes it exist |
| Mark the current item | `.is-active` (nav, tabs) or `aria-pressed="true"` (button group) |
| Start from a ready screen | Copy from `@iamsaeed/admin-ui/views` and swap the data source |

---

## Do not

- Do not copy the package's source into the app. It is a dependency; copying is the exact failure
  this library exists to end — the theme it came from was hand-ported five times and every copy
  diverged.
- Do not override component classes with `!important`. If a class is wrong for your case, compose
  a new one from tokens.
- Do not set the axis attributes on `<body>`. They belong on `<html>`.
- Do not add a second Vue. It is external in the build and a peer dependency for a reason.
- Do not assume a class exists because the framework you know has it. Check the list.
