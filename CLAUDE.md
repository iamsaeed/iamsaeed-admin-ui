# CLAUDE.md

Guidance for Claude Code when working in `~/www/themes/admin-panel`.

## What This Is

`@iamsaeed/admin-ui` — a mobile-first, runtime-skinnable Vue 3 admin design system, published as
an npm package and consumed by other projects. **Not an application.** It exists to end the
five-times-hand-ported Lumen theme (see README "Origin").

npm workspaces monorepo, no Laravel, no backend:

```
packages/ui     @iamsaeed/admin-ui — the library (tokens, shell, primitives, views)
apps/docs       @iamsaeed/admin-docs — living style guide, a CONSUMER of the package
plans/          design record + TODO.md
```

## Commands

```bash
npm install                 # from the repo root — workspaces
npm run dev                 # style guide on http://127.0.0.1:5200
npm run build               # library + docs
npm run build:ui            # library only
npm run type-check          # vue-tsc across both workspaces
npm test --workspace=@iamsaeed/admin-ui   # 504 assertions (contrast, gamut, colour maths, focus trap, theme state)
npm run test:a11y           # axe-core over the BUILT docs app: 35 routes x 3 themes x 2 viewports
```

**Verification is four-layered**: `npm test` green, `npm run type-check` clean, `npm run build`
green, and the docs app rendering the changed surface in light + dark + sepia at 375px and 1440px
with zero console errors.

`npm run test:a11y` is the fourth layer, and it exists because the other three
cannot see it. `contrast.test.ts` proves the TOKENS are accessible; it cannot prove the markup
uses them at a size that earns their bar. On 2026-08-19 an external axe-core audit found 1287
WCAG 1.4.3 failures while all 480 assertions were green: `--lm-subtle` was held to the large-text
threshold on the stated assumption it was "never body copy", and the views applied it to 10px
text. Three critical `4.1.2` name failures (row checkboxes, a filter select, a switch) were
invisible to a token suite by construction.

Two rules follow from that:

1. **A token may only be exempted from the normal-text bar if the markup provably never uses it
   at normal-text size.** Nothing in a token test can prove that, so do not assert an exemption
   there — let `test:a11y` audit the rendered page instead.
2. **The audit must stamp `data-theme` explicitly.** Headless Chrome resolves
   `prefers-color-scheme` to dark and the default theme is `system`, so an audit that skips the
   stamp silently measures dark only. Dark was 44 failing nodes when light was 485.

The same audit exposed a real nesting bug the token suite structurally could not: `--lm-accent-c`
was declared in the theme block as `calc(var(--lm-skin-c) * 1)`, so its `var()` substituted at
`:root` and every nested `[data-skin]` inherited the ROOT skin's chroma with its own hue — teal
rendering as `oklch(0.52 0.216 195)` instead of `oklch(0.52 0.076 195)`. The theme now owns a
scalar `--lm-accent-c-mult`, and the chroma is composed in the `:root, [data-skin]` rule beside
the ramp, for exactly the reason the ramp lives there. The token resolver models one flattened
element, so it can never catch this class of bug — only the rendered audit can.

`tests/contrast.test.ts` is the important one. It parses the REAL `tokens.css` (so it cannot drift
from the stylesheet) and asserts WCAG AA plus sRGB gamut for every role across all 24 theme × skin
pairs. It enumerates from `src/theme/config.ts`, so adding a skin or theme is covered
automatically. `tests/oklch.test.ts` pins the colour maths against ground truth captured from
Chrome, because every contrast number depends on it.

## Hard rules

1. **No raw colour outside `tokens.css` / `skins.css`.** No hex, no `rgb()`, no `oklch()` literal
   in a component or a view. `grep -rE '#[0-9a-fA-F]{3,8}\b|rgba?\(' packages/ui/src/components
   packages/ui/src/views` must stay empty. This is what makes a skin one line.
2. **Components read Layer-2 tokens only** (`--lm-surface`, `--lm-fg`, `--lm-accent`). Never a
   Layer-1 primitive (`--lm-accent-h`, `--lm-accent-l`).
3. **Mobile-first.** The unprefixed rule is the phone; `md:`/`lg:` are enhancements. Never write
   a desktop rule and then a `max-width` override to undo it.
4. **Theme and skin stay orthogonal.** `data-theme` moves lightness/chroma; `data-skin` moves hue.
   A theme block must never set `--lm-accent-h`, and a skin must never set surface colours.
5. **Recurring utility runs become named classes** in `components.css`. If the same 8-utility
   string appears three times, it is a class.
6. **Routes by name, never by path.** Nav data holds route names.
7. **No `$route`, no required Pinia** in the library. State is passed in as props or held in
   module-scoped singleton composables, so a Blade-hosted or router-less app can use the shell.
8. **Any element carrying `aria-modal="true"` MUST use `useFocusTrap`.** The attribute promises
   assistive tech that the rest of the page is inert; without a trap that promise is false and the
   user is misled rather than merely inconvenienced. Escape-to-close and focus-restore ship with it.
9. **Never change an accent or status LIGHTNESS without re-running `npm test`.** Lightness is
   what carries contrast; the values in `tokens.css` were solved, not chosen, and the suite is
   the only thing standing between a tweak and shipping unreadable text.
10. **Never commit without explicit user confirmation**, and never add "Generated with Claude Code"
   or Co-Authored-By trailers.

## The thing most likely to trip you up

The accent ramp is composed in a rule matching **`:root, [data-skin]`**, not `:root` alone
(`tokens.css`, "ACCENT COMPOSITION"). A custom property substitutes its `var()` references on the
element where it is *declared* — so a ramp declared only on `:root` inherits down already
resolved, and setting `--lm-accent-h` on a descendant does nothing at all. Matching `[data-skin]`
re-declares the ramp on that element, where its own hue is in scope.

If you add a derived accent token, add it to **that rule**, not to `:root`. If you add a theme,
override the L/C *inputs* (`--lm-accent-l`, `--lm-accent-c`, …), never the finished colours —
overriding the finished colour breaks nested skins and is the bug this structure exists to
prevent.

## Adding things

**A skin:** one line in `skins.css` (`[data-skin='acme'] { --lm-accent-h: 12; --lm-skin-c: 0.18 }`)
plus the name in `SKINS` in `src/theme/config.ts` and `SKIN_HUES`/`SKIN_LABELS`. Then run
`npm test` — it will fail if the chroma is out of gamut or the result misses AA. Do not guess the
chroma: `maxChromaForHue(12)` from `src/theme/oklch.ts` computes it.

**Careful:** `SKIN_SCALED_ROLES` in `src/theme/oklch.ts` mirrors the `--lm-accent-*-l` values in
`tokens.css`. If you change a role lightness, change it in both — the contrast suite will catch
you if you don't, which is the point.

**A component:** `.vue` under `packages/ui/src/components/<group>/`, its recurring styles as a
named class in `components.css`, export from `src/index.ts`, and a demo block in the matching
`views/kit/*View.vue` page — the kit page is the only place a component is actually QA'd.

**A view:** under `packages/ui/src/views/`, exported from `src/views.ts`, routed in
`apps/docs/src/router/index.ts`, and listed in `apps/docs/src/data/nav.ts`.

## Task tracking

`plans/TODO.md` — tasks as `- [ ]` under a `## YYYY-MM-DD` heading. Only the user checks items off.
Implementation plans go in `plans/YYYY-MM-DD-<name>.md`.
