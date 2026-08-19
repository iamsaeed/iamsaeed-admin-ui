import { computed, reactive, readonly, watch } from 'vue'
import { maxChromaForHue } from '../theme/oklch'
import {
  DEFAULT_THEME_STATE,
  DENSITIES,
  RADII,
  SKINS,
  STORAGE_KEY,
  THEMES,
  type Density,
  type Radius,
  type Skin,
  type Theme,
  type ThemePreference,
  type ThemeState,
} from '../theme/config'

/**
 * Module-scoped singleton — deliberately NOT a Pinia store.
 *
 * The theme has to be settable before an app mounts (and from plain script in
 * a Blade page), so making it depend on Pinia's install order would be a
 * liability for a library. Any number of components calling useTheme() share
 * this one reactive object.
 */
const state = reactive<ThemeState>({ ...DEFAULT_THEME_STATE })

let initialised = false
let mediaQuery: MediaQueryList | null = null

const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined'

function oneOf<T extends readonly string[]>(list: T, v: unknown, fallback: T[number]): T[number] {
  return typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T[number]) : fallback
}

function load(): void {
  if (!isBrowser) return
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const saved = JSON.parse(raw) as Partial<ThemeState>
    state.theme = oneOf([...THEMES, 'system'] as const, saved.theme, DEFAULT_THEME_STATE.theme)
    state.skin = oneOf(SKINS, saved.skin, DEFAULT_THEME_STATE.skin)
    state.density = oneOf(DENSITIES, saved.density, DEFAULT_THEME_STATE.density)
    state.radius = oneOf(RADII, saved.radius, DEFAULT_THEME_STATE.radius)
    state.accentHue =
      typeof saved.accentHue === 'number' && saved.accentHue >= 0 && saved.accentHue <= 360
        ? saved.accentHue
        : null
  } catch {
    /* Corrupt or unavailable storage must never break the app — defaults win. */
  }
}

function persist(): void {
  if (!isBrowser) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* Private mode / quota — theme still works for this session. */
  }
}

/** The concrete theme actually painted, resolving `system` against the OS. */
function resolveTheme(pref: ThemePreference): Theme {
  if (pref !== 'system') return pref
  if (!isBrowser) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function apply(): void {
  if (!isBrowser) return
  const el = document.documentElement
  el.setAttribute('data-theme', resolveTheme(state.theme))
  el.setAttribute('data-skin', state.skin)
  el.setAttribute('data-density', state.density)
  el.setAttribute('data-radius', state.radius)

  if (state.accentHue != null) {
    el.style.setProperty('--lm-accent-h', String(state.accentHue))
    // A custom hue must bring its own chroma. Without this it inherits the
    // previously-selected skin's chroma, which another hue may not be able to
    // reach in sRGB — the colour then clips and stops matching the token.
    el.style.setProperty('--lm-skin-c', String(maxChromaForHue(state.accentHue)))
  } else {
    el.style.removeProperty('--lm-accent-h')
    el.style.removeProperty('--lm-skin-c')
  }
}

function init(): void {
  if (initialised || !isBrowser) return
  initialised = true

  load()
  apply()

  // Track the OS setting, but only while the user is on `system`.
  mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', () => {
    if (state.theme === 'system') apply()
  })

  // Keep other tabs of the same app in sync.
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      load()
      apply()
    }
  })

  watch(
    () => ({ ...state }),
    () => {
      apply()
      persist()
    },
    { deep: true },
  )
}

export function useTheme() {
  init()

  return {
    state: readonly(state),

    /** The theme actually painted right now (`system` already resolved). */
    resolvedTheme: computed<Theme>(() => resolveTheme(state.theme)),
    isDark: computed(() => resolveTheme(state.theme) === 'dark'),

    theme: computed(() => state.theme),
    skin: computed(() => state.skin),
    density: computed(() => state.density),
    radius: computed(() => state.radius),
    accentHue: computed(() => state.accentHue),

    setTheme: (v: ThemePreference) => {
      state.theme = v
    },
    setSkin: (v: Skin) => {
      state.skin = v
      // An explicit skin supersedes a custom hue, otherwise the picker looks broken.
      state.accentHue = null
    },
    setDensity: (v: Density) => {
      state.density = v
    },
    setRadius: (v: Radius) => {
      state.radius = v
    },

    /**
     * Arbitrary brand hue, 0–360 — the per-tenant path. Feed it a value from
     * your own API and every accent shade re-derives with no rebuild.
     *
     * The matching chroma is computed for you (`maxChromaForHue`), so the
     * result is as vivid as sRGB allows for that hue and never clipped.
     */
    setAccentHue: (hue: number | null) => {
      state.accentHue = hue == null ? null : Math.max(0, Math.min(360, Math.round(hue)))
    },

    /** Cycle light → dark → sepia. What a topbar toggle button calls. */
    cycleTheme: () => {
      const order: ThemePreference[] = ['light', 'dark', 'sepia']
      const current = resolveTheme(state.theme)
      state.theme = order[(order.indexOf(current) + 1) % order.length]!
    },

    toggleDark: () => {
      state.theme = resolveTheme(state.theme) === 'dark' ? 'light' : 'dark'
    },

    reset: () => {
      Object.assign(state, DEFAULT_THEME_STATE)
    },
  }
}
