import { describe, expect, it } from 'vitest'
import { contrastRatio, isInGamut, oklchToRgb } from './helpers/oklch'

/**
 * Pins the hand-rolled colour maths against ground truth taken from Chrome's
 * own engine (canvas 2d rasterisation of `oklch(...)`, 2026-08-19).
 *
 * These fixtures are real token values from tokens.css and skins.css. If this
 * file fails, the conversion is wrong and every contrast assertion downstream
 * is meaningless — fix it here before trusting anything else.
 */

/** [L, C, H, r, g, b] — rgb as Chrome rasterised it, 0–255. */
const CHROME: [number, number, number, number, number, number][] = [
  [0.62, 0.18, 290, 136, 109, 233],
  [0.56, 0.2, 290, 120, 85, 223],
  [0.95, 0.04, 290, 237, 235, 255],
  [0.9, 0.06, 290, 221, 216, 255],
  [0.99, 0.005, 290, 251, 251, 255],
  [0.72, 0.16, 250, 73, 169, 255],
  [0.62, 0.18, 195, 0, 164, 167],
  [0.62, 0.18, 155, 0, 164, 82],
  [0.62, 0.18, 75, 195, 112, 0],
  [0.62, 0.18, 20, 221, 77, 87],
  [0.42, 0.02, 265, 72, 77, 88],
  [0.22, 0.01, 270, 25, 26, 31],
  [0.99, 0.003, 270, 251, 252, 254],
  [1, 0, 0, 255, 255, 255],
  [0.16, 0.012, 270, 11, 13, 19],
  [0.7, 0.14, 155, 71, 184, 119],
  [0.78, 0.14, 75, 235, 169, 65],
  [0.62, 0.2, 25, 230, 67, 67],
  [0.7, 0.13, 230, 40, 172, 223],
  [0.26, 0.04, 50, 52, 30, 18],
]

describe('oklch → sRGB', () => {
  it.each(CHROME)('oklch(%s %s %s) matches Chrome', (L, C, H, r, g, b) => {
    const got = oklchToRgb(L, C, H)
    const to255 = (v: number) => Math.round(v * 255)

    // ±2/255 tolerance absorbs rounding and gamut-mapping differences on the
    // few saturated fixtures; it is far tighter than anything that could mask
    // a wrong matrix (which would be off by tens).
    expect(Math.abs(to255(got.r) - r)).toBeLessThanOrEqual(2)
    expect(Math.abs(to255(got.g) - g)).toBeLessThanOrEqual(2)
    expect(Math.abs(to255(got.b) - b)).toBeLessThanOrEqual(2)
  })
})

describe('contrastRatio', () => {
  const white = { r: 1, g: 1, b: 1 }
  const black = { r: 0, g: 0, b: 0 }

  it('is 21 for black on white', () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5)
  })

  it('is 1 for a colour against itself', () => {
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5)
  })

  it('is symmetric', () => {
    const a = oklchToRgb(0.62, 0.18, 290)
    expect(contrastRatio(a, white)).toBeCloseTo(contrastRatio(white, a), 10)
  })

  it('matches the known ratio for #767676 on white (WCAG AA boundary)', () => {
    const grey = { r: 0x76 / 255, g: 0x76 / 255, b: 0x76 / 255 }
    expect(contrastRatio(grey, white)).toBeCloseTo(4.54, 1)
  })
})

describe('isInGamut', () => {
  it('accepts a plain mid grey', () => {
    expect(isInGamut(0.5, 0, 0)).toBe(true)
  })

  it('rejects an impossible chroma', () => {
    expect(isInGamut(0.5, 0.9, 140)).toBe(false)
  })
})
