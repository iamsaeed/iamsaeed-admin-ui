/**
 * The four theme axes, as typed constants.
 *
 * These are the single source of truth for what values are legal — the
 * composable validates against them, the docs app renders pickers from them,
 * and a consumer adding a brand skin registers it here so both follow.
 */

export const THEMES = ['light', 'dark', 'sepia'] as const
export const SKINS = ['violet', 'indigo', 'blue', 'teal', 'green', 'amber', 'rose', 'slate'] as const
export const DENSITIES = ['compact', 'regular', 'comfy'] as const
export const RADII = ['sharp', 'regular', 'round'] as const

export type Theme = (typeof THEMES)[number]
export type Skin = (typeof SKINS)[number]
export type Density = (typeof DENSITIES)[number]
export type Radius = (typeof RADII)[number]

/** `system` follows the OS; the three concrete themes are explicit choices. */
export type ThemePreference = Theme | 'system'

export interface ThemeState {
  theme: ThemePreference
  skin: Skin
  density: Density
  radius: Radius
  /** Arbitrary brand hue (0–360). Overrides `skin` when set. */
  accentHue: number | null
}

export const DEFAULT_THEME_STATE: ThemeState = {
  theme: 'system',
  skin: 'violet',
  density: 'regular',
  radius: 'regular',
  accentHue: null,
}

/**
 * Hue per skin — mirrors skins.css. Kept here so UI (swatches, previews) can
 * render a skin without reading computed styles off the DOM.
 *
 * If you add a skin, add it in BOTH places; the pair is asserted by
 * `assertSkinsMatchCss()` in the docs app's foundations page.
 */
export const SKIN_HUES: Record<Skin, number> = {
  violet: 290,
  indigo: 275,
  blue: 250,
  teal: 195,
  green: 155,
  amber: 75,
  rose: 20,
  slate: 265,
}

/**
 * Chroma per skin — mirrors `--lm-skin-c` in skins.css.
 *
 * A skin needs a chroma as well as a hue because sRGB's gamut is strongly
 * hue-dependent: at the solid lightness violet reaches 0.216 while teal tops
 * out at 0.076. One shared value would either wash out violet or clip teal.
 * `maxChromaForHue()` in `theme/oklch.ts` computes these; the contrast suite
 * fails if a value here is out of gamut.
 */
export const SKIN_CHROMA: Record<Skin, number> = {
  violet: 0.216,
  indigo: 0.202,
  blue: 0.128,
  teal: 0.076,
  green: 0.112,
  amber: 0.096,
  rose: 0.181,
  slate: 0.2,
}

export const SKIN_LABELS: Record<Skin, string> = {
  violet: 'Violet',
  indigo: 'Indigo',
  blue: 'Blue',
  teal: 'Teal',
  green: 'Green',
  amber: 'Amber',
  rose: 'Rose',
  slate: 'Slate',
}

export const STORAGE_KEY = 'lm-theme'

/**
 * Inline script for the consumer's `<head>`, BEFORE any stylesheet.
 *
 * Without it there is a flash of the default theme on every cold load: the
 * app's JS restores the saved theme only after hydration, by which point the
 * light palette has already painted. This runs synchronously and sets the
 * attributes before first paint.
 *
 * Blade:  <?php echo '<script>' . \AdminUi::initScript() . '</script>'; ?>
 * Vite:   inject via a transformIndexHtml plugin, or paste it literally.
 */
export const themeInitScript = `(function(){try{
var s=JSON.parse(localStorage.getItem('${STORAGE_KEY}')||'{}');
var d=document.documentElement;
var t=s.theme||'system';
if(t==='system'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}
d.setAttribute('data-theme',t);
d.setAttribute('data-skin',s.skin||'violet');
d.setAttribute('data-density',s.density||'regular');
d.setAttribute('data-radius',s.radius||'regular');
if(s.accentHue!=null){d.style.setProperty('--lm-accent-h',String(s.accentHue))}
}catch(e){}})();`
