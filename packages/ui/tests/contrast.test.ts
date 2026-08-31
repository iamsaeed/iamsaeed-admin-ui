import { describe, expect, it } from 'vitest'
import { SKINS, SKIN_CHROMA, SKIN_HUES, THEMES } from '../src/theme/config'
import { contrastRatio, isInGamut, maxChromaForHue, over, relativeLuminance } from './helpers/oklch'
import { assertParsedShape, resolveColor, resolveLch, resolveTokens } from './helpers/resolveTokens'

/**
 * The design system's central claim is that a brand change cannot produce an
 * unreadable UI — because only hue moves and lightness/chroma are fixed.
 *
 * This suite is what makes that a guarantee rather than an assertion in a
 * README. It walks EVERY theme × skin combination (3 × 8 = 24) and checks the
 * pairs a user actually reads.
 *
 * If you add a skin or a theme, you do not touch this file — it enumerates
 * from `src/theme/config.ts`, so a new value is covered automatically and
 * fails here if it is not accessible.
 */

const AA_NORMAL = 4.5 // WCAG 2.2 §1.4.3, body text
const AA_LARGE = 3.0 // large / bold text
const AA_NON_TEXT = 3.0 // WCAG 2.2 §1.4.11, UI component boundaries

const COMBOS = THEMES.flatMap((theme) => SKINS.map((skin) => ({ theme, skin })))

describe('resolver sanity', () => {
  it('is actually reading and applying the stylesheets', () => {
    expect(() => assertParsedShape()).not.toThrow()
  })

  /**
   * `SKIN_HUES` / `SKIN_CHROMA` in config.ts exist so UI can render a swatch
   * without measuring the DOM — which means they duplicate skins.css, which
   * means they can drift. This is the guard.
   */
  it.each(SKINS)('config values for %s match skins.css', (skin) => {
    const t = resolveTokens('light', skin)
    expect(Number(t['--lm-accent-h']), 'hue').toBe(SKIN_HUES[skin])
    expect(Number(t['--lm-skin-c']), 'chroma').toBe(SKIN_CHROMA[skin])
  })

  /**
   * `maxChromaForHue()` is what `setAccentHue()` uses for a runtime brand
   * colour. If it disagreed with the hand-tuned skins, an arbitrary hue would
   * behave differently from a named one that happens to share it.
   */
  it.each(SKINS)('maxChromaForHue agrees with the %s skin', (skin) => {
    expect(maxChromaForHue(SKIN_HUES[skin])).toBeCloseTo(SKIN_CHROMA[skin], 2)
  })

  it('covers every declared theme and skin', () => {
    expect(COMBOS).toHaveLength(THEMES.length * SKINS.length)
    expect(COMBOS.length).toBeGreaterThanOrEqual(24)
  })
})

describe.each(COMBOS)('$theme · $skin', ({ theme, skin }) => {
  const c = (token: string) => resolveColor(theme, skin, token)

  /* ── Text ─────────────────────────────────────────────────────────────
     The three foreground roles against the three surfaces they sit on. */

  it('body text on every surface meets AA', () => {
    for (const surface of ['--lm-bg', '--lm-surface', '--lm-surface-2', '--lm-sunken']) {
      expect(contrastRatio(c('--lm-fg'), c(surface)), `--lm-fg on ${surface}`).toBeGreaterThanOrEqual(
        AA_NORMAL,
      )
    }
  })

  it('muted text on every surface meets AA', () => {
    // Muted carries real information (timestamps, counts, hints) and must be
    // held to the body-text bar, not waved through as decorative.
    for (const surface of ['--lm-bg', '--lm-surface', '--lm-surface-2', '--lm-sunken']) {
      expect(
        contrastRatio(c('--lm-muted'), c(surface)),
        `--lm-muted on ${surface}`,
      ).toBeGreaterThanOrEqual(AA_NORMAL)
    }
  })

  it('subtle text meets AA on every surface', () => {
    // This used to be held to AA-LARGE on the stated assumption that
    // `--lm-subtle` was 'only overlines, captions and placeholders — never
    // body copy'. An axe-core audit of the rendered DOM (2026-08-19) found it
    // on 10px and 11px text in .text-subtle and .nav-section, which is normal
    // text by WCAG 1.4.3 and owes 4.5:1. The token was not wrong; the bar was.
    //
    // The lesson is general: this file tests TOKENS, and a token can only be
    // exempted from the normal-text bar if the markup provably never uses it
    // at normal-text size. Nothing here can prove that, so it does not try —
    // `npm run test:a11y` audits the rendered pages instead.
    for (const surface of ['--lm-bg', '--lm-surface', '--lm-surface-2', '--lm-sunken']) {
      expect(
        contrastRatio(c('--lm-subtle'), c(surface)),
        `--lm-subtle on ${surface}`,
      ).toBeGreaterThanOrEqual(AA_NORMAL)
    }
  })

  /* ── Accent ───────────────────────────────────────────────────────────
     This is the claim under test: hue moves, readability does not. */

  it('primary button text is readable on the accent', () => {
    expect(contrastRatio(c('--lm-on-accent'), c('--lm-accent'))).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('primary button text stays readable on accent-hover', () => {
    expect(contrastRatio(c('--lm-on-accent'), c('--lm-accent-hover'))).toBeGreaterThanOrEqual(
      AA_NORMAL,
    )
  })

  it('muted text on soft accent meets AA', () => {
    // The soft accent is a PANEL as well as a badge — the marketing callout
    // and the appearance preview both print --lm-muted on it. That pair was
    // never asserted, and the rendered-DOM audit caught it failing at 4.44:1
    // in sepia while every assertion in this file was green.
    expect(contrastRatio(c('--lm-muted'), c('--lm-accent-soft'))).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('accent text on soft accent (badges, soft buttons) meets AA', () => {
    expect(contrastRatio(c('--lm-accent'), c('--lm-accent-soft'))).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  it('the accent is distinguishable from the surface it sits on', () => {
    // Non-text contrast: a filled button or an active nav item has to have a
    // visible boundary against the page, independent of its label.
    expect(contrastRatio(c('--lm-accent'), c('--lm-surface'))).toBeGreaterThanOrEqual(AA_NON_TEXT)
  })

  it('a link (accent on surface) is readable as text', () => {
    expect(contrastRatio(c('--lm-accent'), c('--lm-surface'))).toBeGreaterThanOrEqual(AA_LARGE)
  })

  /* ── Status ───────────────────────────────────────────────────────────
     Status colours are NOT skinned, so these should hold identically across
     every skin — which is exactly why they are asserted per-combination. */

  it.each(['success', 'warn', 'danger', 'info'])('%s text on its soft background meets AA', (name) => {
    expect(
      contrastRatio(c(`--lm-${name}`), c(`--lm-${name}-soft`)),
      `--lm-${name} on --lm-${name}-soft`,
    ).toBeGreaterThanOrEqual(AA_NORMAL)
  })

  /* ── Structure ────────────────────────────────────────────────────────── */

  it('borders are perceptible against their surface', () => {
    // 1.4.11 does not strictly cover decorative hairlines, so this is a lower
    // bar — but a border that is literally invisible is a bug, not a style.
    expect(contrastRatio(c('--lm-border'), c('--lm-surface'))).toBeGreaterThan(1.15)
    expect(contrastRatio(c('--lm-border-strong'), c('--lm-surface'))).toBeGreaterThan(1.5)
  })

  it('the focus ring is visible against every surface', () => {
    // The ring is drawn in solid --lm-accent (see base.css :focus-visible),
    // and a focus indicator that fails 1.4.11 is a keyboard-accessibility
    // defect, not a cosmetic one.
    for (const surface of ['--lm-bg', '--lm-surface', '--lm-sunken']) {
      expect(
        contrastRatio(c('--lm-accent'), c(surface)),
        `focus ring on ${surface}`,
      ).toBeGreaterThanOrEqual(AA_NON_TEXT)
    }
  })

  /* ── Gamut ────────────────────────────────────────────────────────────
     A clipped colour is not the colour the tokens describe: the ramp stops
     being perceptually uniform and two skins can collapse onto each other. */

  it('every accent shade is inside the sRGB gamut', () => {
    for (const token of [
      '--lm-accent',
      '--lm-accent-hover',
      '--lm-accent-soft',
      '--lm-accent-soft-2',
      '--lm-on-accent',
    ]) {
      const [L, C, H] = resolveLch(theme, skin, token)
      expect(isInGamut(L, C, H), `${token} = oklch(${L} ${C} ${H})`).toBe(true)
    }
  })

  /* ── Contract ─────────────────────────────────────────────────────────── */

  it('the theme never sets the accent hue (axes stay orthogonal)', () => {
    // If a theme block ever sets --lm-accent-h, theme and skin stop being
    // independent and the 216-configuration claim quietly becomes false.
    const hues = THEMES.map((t) => resolveTokens(t, skin)['--lm-accent-h'])
    expect(new Set(hues).size, `hue differs by theme for skin=${skin}: ${hues.join(', ')}`).toBe(1)
  })

  it('the skin never sets a surface colour', () => {
    const bgs = SKINS.map((s) => resolveTokens(theme, s)['--lm-bg'])
    expect(new Set(bgs).size, `background differs by skin in theme=${theme}`).toBe(1)
  })
})

describe('scrim', () => {
  /**
   * Measured as a LUMINANCE REDUCTION, not a contrast ratio.
   *
   * WCAG contrast ratio is built for text legibility and carries a +0.05
   * constant that dominates when both colours are near black. In dark mode a
   * scrim that genuinely removes 61% of the backdrop's luminance scores just
   * 1.05:1 by that formula — which says nothing about whether it dims, only
   * that the formula is the wrong instrument here.
   *
   * Reduction is the property we actually care about, and it is comparable
   * across themes: light 64%, dark 61%, sepia 59%.
   */
  it.each(THEMES)('%s scrim removes most of the backdrop luminance', (theme) => {
    const scrim = resolveColor(theme, 'violet', '--lm-scrim')
    const bg = resolveColor(theme, 'violet', '--lm-bg')
    const dimmed = over(scrim, bg, scrim.alpha)
    const reduction = 1 - relativeLuminance(dimmed) / relativeLuminance(bg)
    expect(reduction).toBeGreaterThan(0.5)
  })

  it.each(THEMES)('%s overlay surface stays lighter than the dimmed page', (theme) => {
    // Directional check: catches an inverted or missing scrim, which a pure
    // magnitude assertion would not. In dark mode the margin is small, which
    // is exactly why the drawer and modal also carry a border and shadow.
    const scrim = resolveColor(theme, 'violet', '--lm-scrim')
    const bg = resolveColor(theme, 'violet', '--lm-bg')
    const surface = resolveColor(theme, 'violet', '--lm-surface')
    const dimmed = over(scrim, bg, scrim.alpha)
    expect(relativeLuminance(surface)).toBeGreaterThan(relativeLuminance(dimmed))
  })
})
