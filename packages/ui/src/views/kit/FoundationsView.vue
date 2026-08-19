<script setup lang="ts">
/**
 * The page that proves the system: every semantic token, rendered live.
 * Flip any axis in the Tweaks panel and every swatch here re-derives.
 */
import Icon from '../../components/ui/Icon.vue'
import { ICON_NAMES } from '../../components/ui/icon-paths'
import { SKINS, SKIN_CHROMA, SKIN_HUES, SKIN_LABELS } from '../../theme/config'
import { useTheme } from '../../composables/useTheme'
import KitBlock from '../../components/kit/KitBlock.vue'

const { resolvedTheme, skin, density, radius, accentHue } = useTheme()


const surfaces = ['bg', 'surface', 'surface-2', 'sunken'] as const
const text = ['fg', 'muted', 'subtle'] as const
const accents = ['accent', 'accent-hover', 'accent-soft', 'accent-soft-2', 'on-accent'] as const
const status = [
  'success', 'success-soft',
  'warn', 'warn-soft',
  'danger', 'danger-soft',
  'info', 'info-soft',
] as const
const charts = ['c1', 'c2', 'c3', 'c4', 'c5'] as const
const radii = ['xs', 'sm', 'DEFAULT', 'lg', 'xl'] as const
const shadows = ['xs', 'sm', 'DEFAULT', 'lg'] as const
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Foundations</h1>
      <p class="page-sub">
        Every value below is a semantic token. Nothing here is a hex literal — change an axis and
        the whole page re-derives.
      </p>
    </div>
    <div class="page-actions">
      <span class="badge badge-neutral">theme: {{ resolvedTheme }}</span>
      <span class="badge badge-accent">skin: {{ accentHue != null ? `hue ${accentHue}` : skin }}</span>
      <span class="badge badge-neutral">density: {{ density }}</span>
      <span class="badge badge-neutral">radius: {{ radius }}</span>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Surfaces">
      <div v-for="t in surfaces" :key="t" class="text-center">
        <div
          class="w-24 h-16 rounded-sm border border-border mb-1.5"
          :style="{ background: `var(--lm-${t})` }"
        />
        <code class="text-[0.625rem] text-muted font-mono">--lm-{{ t }}</code>
      </div>
    </KitBlock>

    <KitBlock label="Text">
      <div v-for="t in text" :key="t" class="text-center">
        <div
          class="w-24 h-16 rounded-sm border border-border mb-1.5"
          :style="{ background: `var(--lm-${t})` }"
        />
        <code class="text-[0.625rem] text-muted font-mono">--lm-{{ t }}</code>
      </div>
    </KitBlock>

    <KitBlock label="Accent — all five shades derived from one hue">
      <div v-for="t in accents" :key="t" class="text-center">
        <div
          class="w-24 h-16 rounded-sm border border-border mb-1.5"
          :style="{ background: `var(--lm-${t})` }"
        />
        <code class="text-[0.625rem] text-muted font-mono">--lm-{{ t }}</code>
      </div>
    </KitBlock>

    <KitBlock label="Status — deliberately NOT skinned, so danger always reads as danger">
      <div v-for="t in status" :key="t" class="text-center">
        <div
          class="w-24 h-16 rounded-sm border border-border mb-1.5"
          :style="{ background: `var(--lm-${t})` }"
        />
        <code class="text-[0.625rem] text-muted font-mono">--lm-{{ t }}</code>
      </div>
    </KitBlock>

    <KitBlock label="Chart series">
      <div v-for="t in charts" :key="t" class="text-center">
        <div class="w-16 h-16 rounded-sm mb-1.5" :style="{ background: `var(--lm-${t})` }" />
        <code class="text-[0.625rem] text-muted font-mono">--lm-{{ t }}</code>
      </div>
    </KitBlock>
  </div>

  <h2 class="font-display text-base font-semibold mt-8 mb-1">Skins</h2>
  <p class="text-xs text-muted mb-4 max-w-2xl">
    A skin is two numbers: a hue and a chroma. <strong class="text-fg">Lightness</strong> is what
    holds constant — and lightness is what carries contrast, so every skin clears WCAG AA by
    construction rather than by hand-checking each shade. Chroma has to vary because sRGB's gamut
    is hue-dependent: violet reaches 0.216 here, teal only 0.076. Asserted for all 24 theme × skin
    pairs in <code class="font-mono">tests/contrast.test.ts</code>.
  </p>
  <div class="card card-p">
    <div class="grid-auto w-full">
      <div v-for="s in SKINS" :key="s" :data-skin="s" class="panel p-3">
        <div class="flex items-center gap-2 mb-3">
          <span class="w-5 h-5 rounded-pill bg-accent" aria-hidden="true" />
          <span class="text-xs font-medium">{{ SKIN_LABELS[s] }}</span>
          <code class="ml-auto text-[0.625rem] text-subtle font-mono">{{ SKIN_HUES[s] }}°</code>
        </div>
        <div class="flex gap-1">
          <span class="h-6 flex-1 rounded-xs bg-accent" />
          <span class="h-6 flex-1 rounded-xs bg-accent-hover" />
          <span class="h-6 flex-1 rounded-xs bg-accent-soft-2" />
          <span class="h-6 flex-1 rounded-xs bg-accent-soft" />
        </div>
        <button type="button" class="btn btn-primary btn-sm btn-block mt-3">Button</button>
        <div class="mt-2 text-[0.5625rem] text-subtle font-mono text-center">
          hue {{ SKIN_HUES[s] }}° · chroma {{ SKIN_CHROMA[s] }}
        </div>
      </div>
    </div>
  </div>

  <h2 class="font-display text-base font-semibold mt-8 mb-1">Geometry & elevation</h2>
  <div class="card card-p">
    <KitBlock label="Radius — follows data-radius">
      <div v-for="r in radii" :key="r" class="text-center">
        <div
          class="w-20 h-20 bg-accent-soft border border-accent-soft-2 mb-1.5"
          :style="{ borderRadius: `var(--lm-radius${r === 'DEFAULT' ? '' : '-' + r})` }"
        />
        <code class="text-[0.625rem] text-muted font-mono">{{ r }}</code>
      </div>
    </KitBlock>

    <KitBlock label="Elevation">
      <div v-for="s in shadows" :key="s" class="text-center">
        <div
          class="w-24 h-16 bg-surface rounded-sm mb-1.5"
          :style="{ boxShadow: `var(--lm-shadow${s === 'DEFAULT' ? '' : '-' + s})` }"
        />
        <code class="text-[0.625rem] text-muted font-mono">{{ s }}</code>
      </div>
    </KitBlock>
  </div>

  <h2 class="font-display text-base font-semibold mt-8 mb-1">Typography</h2>
  <div class="card card-p flex flex-col !items-start gap-3">
    <p class="font-display text-3xl font-semibold tracking-tight">Display / Inter Tight 600</p>
    <p class="text-xl font-semibold">Heading / Inter 600</p>
    <p class="text-base">Body — the quick brown fox jumps over the lazy dog.</p>
    <p class="text-xs text-muted">Muted small — supporting copy and hints.</p>
    <code class="font-mono text-xs bg-sunken px-2 py-1 rounded-xs">--lm-font-mono: JetBrains Mono</code>
  </div>

  <h2 class="font-display text-base font-semibold mt-8 mb-1">Icons</h2>
  <p class="text-xs text-muted mb-4">{{ ICON_NAMES.length }} stroke icons, all inheriting currentColor.</p>
  <div class="card card-p">
    <div class="grid grid-cols-[repeat(auto-fill,minmax(5rem,1fr))] gap-3 w-full">
      <div
        v-for="n in ICON_NAMES"
        :key="n"
        class="flex flex-col items-center gap-1.5 p-2 rounded-sm hover:bg-sunken"
        :title="n"
      >
        <Icon :name="n" :size="20" />
        <span class="text-[0.5625rem] text-subtle truncate max-w-full">{{ n }}</span>
      </div>
    </div>
  </div>
</template>
