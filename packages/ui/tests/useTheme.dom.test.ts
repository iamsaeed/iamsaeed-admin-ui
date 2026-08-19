// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { SKIN_CHROMA, SKIN_HUES, STORAGE_KEY } from '../src/theme/config'

/**
 * `useTheme` is a module-scoped singleton, so each test needs a fresh module
 * registry — otherwise state leaks between cases and the suite lies.
 */
async function freshUseTheme() {
  vi.resetModules()
  const mod = await import('../src/composables/useTheme')
  return mod.useTheme()
}

/**
 * A minimal in-memory Storage. jsdom's own implementation is inconsistent
 * across versions, and stubbing it keeps these tests about `useTheme` rather
 * than about the test environment.
 */
function memoryStorage(): Storage {
  let data: Record<string, string> = {}
  return {
    get length() {
      return Object.keys(data).length
    },
    key: (i: number) => Object.keys(data)[i] ?? null,
    getItem: (k: string) => (k in data ? data[k]! : null),
    setItem: (k: string, v: string) => {
      data[k] = String(v)
    },
    removeItem: (k: string) => {
      delete data[k]
    },
    clear: () => {
      data = {}
    },
  } as Storage
}

beforeEach(() => {
  vi.stubGlobal('localStorage', memoryStorage())
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.removeAttribute('data-skin')
  document.documentElement.style.cssText = ''
  // jsdom has no matchMedia; the composable must not care.
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  )
})

describe('useTheme — applying axes', () => {
  it('writes all four axes onto <html>', async () => {
    const t = await freshUseTheme()
    t.setTheme('dark')
    t.setSkin('teal')
    t.setDensity('compact')
    t.setRadius('sharp')
    await nextTick()

    const el = document.documentElement
    expect(el.getAttribute('data-theme')).toBe('dark')
    expect(el.getAttribute('data-skin')).toBe('teal')
    expect(el.getAttribute('data-density')).toBe('compact')
    expect(el.getAttribute('data-radius')).toBe('sharp')
  })

  it('resolves `system` to a concrete theme rather than writing "system"', async () => {
    const t = await freshUseTheme()
    t.setTheme('system')
    await nextTick()
    // The attribute must always be a real theme — skins.css and tokens.css
    // have no [data-theme='system'] block to match.
    expect(['light', 'dark']).toContain(document.documentElement.getAttribute('data-theme'))
    expect(t.resolvedTheme.value).not.toBe('system')
  })
})

describe('useTheme — custom brand hue', () => {
  it('sets a gamut-safe chroma alongside the hue', async () => {
    const t = await freshUseTheme()
    t.setAccentHue(SKIN_HUES.teal)
    await nextTick()

    const style = document.documentElement.style
    expect(style.getPropertyValue('--lm-accent-h')).toBe(String(SKIN_HUES.teal))
    // Without this the hue would inherit the previous skin's chroma, which a
    // narrow-gamut hue like teal cannot reach — the colour would clip.
    expect(Number(style.getPropertyValue('--lm-skin-c'))).toBeCloseTo(SKIN_CHROMA.teal, 2)
  })

  it('clears both custom properties when the hue is cleared', async () => {
    const t = await freshUseTheme()
    t.setAccentHue(200)
    await nextTick()
    t.setAccentHue(null)
    await nextTick()

    const style = document.documentElement.style
    expect(style.getPropertyValue('--lm-accent-h')).toBe('')
    // Leaving a stale chroma behind would silently mis-render the next skin.
    expect(style.getPropertyValue('--lm-skin-c')).toBe('')
  })

  it('clamps out-of-range hues instead of emitting invalid CSS', async () => {
    const t = await freshUseTheme()
    t.setAccentHue(999)
    await nextTick()
    expect(t.accentHue.value).toBe(360)

    t.setAccentHue(-40)
    await nextTick()
    expect(t.accentHue.value).toBe(0)
  })

  it('choosing a named skin discards a custom hue', async () => {
    const t = await freshUseTheme()
    t.setAccentHue(12)
    await nextTick()
    t.setSkin('rose')
    await nextTick()

    // Otherwise the inline hue keeps winning and the skin picker looks broken.
    expect(t.accentHue.value).toBeNull()
    expect(document.documentElement.style.getPropertyValue('--lm-accent-h')).toBe('')
  })
})

describe('useTheme — persistence', () => {
  it('round-trips through localStorage', async () => {
    const a = await freshUseTheme()
    a.setTheme('sepia')
    a.setSkin('amber')
    await nextTick()

    const b = await freshUseTheme()
    expect(b.theme.value).toBe('sepia')
    expect(b.skin.value).toBe('amber')
  })

  it('ignores a corrupt stored value rather than throwing', async () => {
    localStorage.setItem(STORAGE_KEY, '{not json')
    const t = await freshUseTheme()
    // A broken preference must never take the app down with it.
    expect(t.theme.value).toBe('system')
    expect(t.skin.value).toBe('violet')
  })

  it('rejects unknown axis values from storage', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ theme: 'neon', skin: 'chartreuse', density: 'huge', radius: 'blobby' }),
    )
    const t = await freshUseTheme()
    // Stored data is untrusted input: a stale or hand-edited value must fall
    // back, not end up as an attribute with no matching CSS.
    expect(t.theme.value).toBe('system')
    expect(t.skin.value).toBe('violet')
    expect(t.density.value).toBe('regular')
    expect(t.radius.value).toBe('regular')
  })

  it('rejects an out-of-range stored hue', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accentHue: 5000 }))
    const t = await freshUseTheme()
    expect(t.accentHue.value).toBeNull()
  })
})

describe('useTheme — toggles', () => {
  it('cycles light → dark → sepia → light', async () => {
    const t = await freshUseTheme()
    t.setTheme('light')
    await nextTick()

    t.cycleTheme(); await nextTick()
    expect(t.resolvedTheme.value).toBe('dark')
    t.cycleTheme(); await nextTick()
    expect(t.resolvedTheme.value).toBe('sepia')
    t.cycleTheme(); await nextTick()
    expect(t.resolvedTheme.value).toBe('light')
  })

  it('reset returns every axis to its default', async () => {
    const t = await freshUseTheme()
    t.setTheme('dark'); t.setSkin('rose'); t.setDensity('comfy'); t.setAccentHue(99)
    await nextTick()

    t.reset()
    await nextTick()
    expect(t.theme.value).toBe('system')
    expect(t.skin.value).toBe('violet')
    expect(t.density.value).toBe('regular')
    expect(t.accentHue.value).toBeNull()
  })
})
