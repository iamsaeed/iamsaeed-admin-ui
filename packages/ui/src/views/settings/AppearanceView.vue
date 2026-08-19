<script setup lang="ts">
/**
 * Appearance is the settings screen that actually WRITES the theme state —
 * proof the axes are a product feature, not a developer toggle.
 */
import SettingsLayout from './SettingsLayout.vue'
import Icon from '../../components/ui/Icon.vue'
import { useTheme } from '../../composables/useTheme'
import { DENSITIES, RADII, SKINS, SKIN_HUES, SKIN_LABELS, type Density, type Radius } from '../../theme/config'

const emit = defineEmits<{ navigate: [id: string] }>()
const { theme, skin, density, radius, accentHue, setTheme, setSkin, setDensity, setRadius, setAccentHue } = useTheme()

const themes = [
  { value: 'system', label: 'System', icon: 'globe' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'sepia', label: 'Sepia', icon: 'archive' },
] as const
</script>

<template>
  <SettingsLayout active="settings.appearance" title="Appearance"
                  subtitle="These controls write to the same state your whole app reads."
                  @navigate="emit('navigate', $event)">
    <div class="card card-p flex flex-col !items-stretch gap-6">
      <section>
        <div class="section-label mb-3">Theme</div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button v-for="t in themes" :key="t.value" class="btn btn-secondary"
                  :class="theme === t.value ? '!border-accent !text-accent !bg-accent-soft' : ''"
                  @click="setTheme(t.value)">
            <Icon :name="t.icon" :size="15" /> {{ t.label }}
          </button>
        </div>
      </section>

      <section>
        <div class="section-label mb-3">Brand colour</div>
        <div class="grid grid-cols-4 sm:grid-cols-8 gap-2 mb-4">
          <button v-for="s in SKINS" :key="s" class="flex flex-col items-center gap-1.5 p-2 rounded-sm border"
                  :class="skin === s && accentHue == null ? 'border-accent bg-accent-soft' : 'border-border hover:bg-sunken'"
                  :title="SKIN_LABELS[s]" @click="setSkin(s)">
            <span class="w-6 h-6 rounded-pill" :data-skin="s"
                  :style="{ background: 'var(--lm-accent)' }" aria-hidden="true" />
            <span class="text-[0.5625rem] text-muted truncate max-w-full">{{ SKIN_LABELS[s] }}</span>
          </button>
        </div>
        <label class="form-label" for="hue">Custom hue</label>
        <div class="flex items-center gap-3">
          <input id="hue" type="range" min="0" max="360" class="flex-1"
                 :value="accentHue ?? SKIN_HUES[skin]"
                 @input="setAccentHue(Number(($event.target as HTMLInputElement).value))" />
          <span class="tnum text-xs text-muted w-10 text-right">{{ accentHue ?? SKIN_HUES[skin] }}°</span>
        </div>
      </section>

      <section>
        <div class="section-label mb-3">Density</div>
        <div class="btn-group w-full max-w-sm">
          <button v-for="d in DENSITIES" :key="d" class="btn flex-1 capitalize"
                  :aria-pressed="density === d" @click="setDensity(d as Density)">{{ d }}</button>
        </div>
      </section>

      <section>
        <div class="section-label mb-3">Corners</div>
        <div class="btn-group w-full max-w-sm">
          <button v-for="r in RADII" :key="r" class="btn flex-1 capitalize"
                  :aria-pressed="radius === r" @click="setRadius(r as Radius)">{{ r }}</button>
        </div>
      </section>
    </div>
  </SettingsLayout>
</template>
