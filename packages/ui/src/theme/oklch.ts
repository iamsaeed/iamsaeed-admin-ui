/**
 * oklch → sRGB → WCAG contrast.
 *
 * Lives in the library, not just the tests, because `useTheme().setAccentHue()`
 * needs it at runtime: picking an arbitrary brand hue also has to pick a
 * chroma that hue can actually reach in sRGB, or the colour silently clips.
 *
 * Hand-rolled rather than pulled from a colour library so the code asserting
 * the design system's central claim is readable in place. The transform is
 * Björn Ottosson's published oklab matrix; `tests/oklch.test.ts` pins it
 * against values taken from Chrome's own engine.
 *
 * Caveat: out-of-gamut colours are handled by naive per-channel clipping,
 * whereas CSS Color 4 gamut-maps by reducing chroma. The two agree for
 * in-gamut colours and diverge for saturated ones — which is exactly why
 * `maxChromaForHue()` exists, to keep us in the agreeing region.
 */

export interface Rgb {
  r: number
  g: number
  b: number
}

/** oklch → linear sRGB. Channels may fall outside [0,1] when out of gamut. */
function oklchToLinearSrgb(L: number, C: number, H: number): Rgb {
  const h = (H * Math.PI) / 180
  const a = C * Math.cos(h)
  const bb = C * Math.sin(h)

  const l_ = L + 0.3963377774 * a + 0.2158037573 * bb
  const m_ = L - 0.1055613458 * a - 0.0638541728 * bb
  const s_ = L - 0.0894841775 * a - 1.291485548 * bb

  const l = l_ * l_ * l_
  const m = m_ * m_ * m_
  const s = s_ * s_ * s_

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  }
}

/** Linear → gamma-encoded sRGB (the sRGB transfer function). */
function encodeGamma(x: number): number {
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055
}

/** Gamma-encoded sRGB → linear. Used by the WCAG luminance formula. */
function decodeGamma(x: number): number {
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4)
}

/** True when the colour needs no clipping — i.e. it is genuinely displayable. */
export function isInGamut(L: number, C: number, H: number, epsilon = 0.001): boolean {
  const { r, g, b } = oklchToLinearSrgb(L, C, H)
  return [r, g, b].every((v) => v >= -epsilon && v <= 1 + epsilon)
}

/** oklch → sRGB in [0,1] per channel, clipped. */
export function oklchToRgb(L: number, C: number, H: number): Rgb {
  const lin = oklchToLinearSrgb(L, C, H)
  const clamp = (v: number) => Math.min(1, Math.max(0, encodeGamma(v)))
  return { r: clamp(lin.r), g: clamp(lin.g), b: clamp(lin.b) }
}

export function toHex(c: Rgb): string {
  const h = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`
}

/** WCAG 2.x relative luminance. */
export function relativeLuminance(c: Rgb): number {
  return 0.2126 * decodeGamma(c.r) + 0.7152 * decodeGamma(c.g) + 0.0722 * decodeGamma(c.b)
}

/** WCAG 2.x contrast ratio, 1–21. Order of arguments does not matter. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Composite a partially transparent colour over an opaque backdrop.
 * Needed for the soft/scrim tokens, which carry an alpha.
 */
export function over(fg: Rgb, bg: Rgb, alpha: number): Rgb {
  return {
    r: fg.r * alpha + bg.r * (1 - alpha),
    g: fg.g * alpha + bg.g * (1 - alpha),
    b: fg.b * alpha + bg.b * (1 - alpha),
  }
}

/**
 * The role lightnesses that scale with the skin's chroma, across all themes.
 * Mirrors the `--lm-accent-*-l` values in tokens.css — if you change one
 * there, change it here, and `tests/contrast.test.ts` will catch it if you
 * do not.
 */
const SKIN_SCALED_ROLES: [number, number][] = [
  [0.52, 1.0], // light  accent
  [0.45, 0.92], // light  accent-hover
  [0.72, 0.62], // dark   accent
  [0.78, 0.52], // dark   accent-hover
  [0.48, 0.95], // sepia  accent
  [0.42, 0.88], // sepia  accent-hover
]

/**
 * Largest chroma a hue can carry at EVERY skin-scaled role lightness without
 * leaving sRGB — i.e. the correct `--lm-skin-c` for an arbitrary brand hue.
 *
 * Returned with a small safety margin, because gamut clipping is a cliff: one
 * step past the ceiling and the colour stops being the colour the tokens
 * describe, and two different hues can collapse onto the same rendered pixel.
 */
export function maxChromaForHue(hue: number, margin = 0.94): number {
  let ceiling = Infinity
  for (const [L, frac] of SKIN_SCALED_ROLES) {
    let maxC = 0
    for (let c = 0.32; c >= 0; c -= 0.002) {
      if (isInGamut(L, c, hue)) {
        maxC = c
        break
      }
    }
    ceiling = Math.min(ceiling, maxC / frac)
  }
  return Math.max(0.02, Math.floor(ceiling * margin * 1000) / 1000)
}
