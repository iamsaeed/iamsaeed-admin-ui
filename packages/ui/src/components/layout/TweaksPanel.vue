<script setup lang="ts">
/**
 * Live theme editor — a drawer exposing all four axes.
 *
 * Ships in the LIBRARY, not the docs app, on purpose: an admin product
 * usually wants to give its own users theme control, and this is that
 * control. Mount it once next to the layout.
 *
 * It also happens to be the fastest way to QA a change — flip every axis
 * without touching a config file.
 */
import { onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import { useFocusTrap } from '../../composables/useFocusTrap'
import {
  DENSITIES,
  RADII,
  SKINS,
  SKIN_HUES,
  SKIN_LABELS,
  type Density,
  type Radius,
  type ThemePreference,
} from '../../theme/config'
import { useTheme } from '../../composables/useTheme'
import Icon from '../ui/Icon.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ close: [] }>()

/* This panel carried aria-modal="true" with no focus management and no
   Escape handler — the attribute claimed a containment that did not exist.
   Both are now real. */
const panelEl = ref<HTMLElement | null>(null)
useFocusTrap(toRef(props, 'open'), panelEl)

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

const { theme, skin, density, radius, accentHue, setTheme, setSkin, setDensity, setRadius, setAccentHue, reset } =
  useTheme()

const themeOptions: { value: ThemePreference; label: string; icon: string }[] = [
  { value: 'system', label: 'System', icon: 'globe' },
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'sepia', label: 'Sepia', icon: 'archive' },
]

/*
 * Swatches carry no colour of their own: each one sets `data-skin` and paints
 * `var(--lm-accent)`, so CSS derives the shade exactly as it would anywhere
 * else. Recomputing the oklch expression in JS here would duplicate the
 * lightness/chroma values and silently drift the moment tokens.css changes.
 * This works at this depth because the ramp is composed on `[data-skin]` too.
 */
</script>

<template>
  <Transition
    enter-active-class="transition-opacity duration-(--lm-dur)"
    leave-active-class="transition-opacity duration-(--lm-dur)"
    enter-from-class="opacity-0"
    leave-to-class="opacity-0"
  >
    <div v-if="open" class="scrim" @click="emit('close')" />
  </Transition>

  <Transition
    enter-active-class="transition-transform duration-(--lm-dur) ease-(--lm-ease)"
    leave-active-class="transition-transform duration-(--lm-dur) ease-(--lm-ease)"
    enter-from-class="translate-x-full"
    leave-to-class="translate-x-full"
  >
    <aside
      v-if="open"
      ref="panelEl"
      class="fixed inset-y-0 right-0 z-(--lm-z-modal) w-[min(20rem,90vw)] flex flex-col
             bg-surface border-l border-border shadow-lg"
      role="dialog"
      aria-modal="true"
      aria-label="Theme settings"
    >
      <header class="flex items-center justify-between px-4 h-(--lm-topbar-h) border-b border-border shrink-0">
        <div>
          <div class="font-display font-semibold">Theme</div>
          <div class="text-[0.6875rem] text-subtle">Four independent axes</div>
        </div>
        <button type="button" class="btn btn-ghost btn-icon btn-sm" @click="emit('close')">
          <Icon name="x" label="Close" />
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        <!-- Theme -->
        <section>
          <div class="section-label mb-2">Theme</div>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="opt in themeOptions"
              :key="opt.value"
              type="button"
              class="btn btn-secondary justify-start"
              :class="theme === opt.value ? '!border-accent !text-accent !bg-accent-soft' : ''"
              @click="setTheme(opt.value)"
            >
              <Icon :name="opt.icon" :size="15" />
              {{ opt.label }}
            </button>
          </div>
        </section>

        <!-- Skin -->
        <section>
          <div class="section-label mb-2">Skin</div>
          <p class="text-[0.6875rem] text-subtle mb-3">
            Each skin sets one variable — <code class="font-mono">--lm-accent-h</code>. Every accent
            shade re-derives from it.
          </p>
          <div class="grid grid-cols-4 gap-2">
            <button
              v-for="s in SKINS"
              :key="s"
              type="button"
              class="flex flex-col items-center gap-1.5 p-2 rounded-sm border transition-colors"
              :class="skin === s && accentHue == null
                ? 'border-accent bg-accent-soft'
                : 'border-border hover:bg-sunken'"
              :title="`${SKIN_LABELS[s]} — hue ${SKIN_HUES[s]}`"
              @click="setSkin(s)"
            >
              <span
                class="w-6 h-6 rounded-pill shrink-0 bg-accent"
                :data-skin="s"
                aria-hidden="true"
              />
              <span class="text-[0.5625rem] text-muted truncate max-w-full">{{ SKIN_LABELS[s] }}</span>
            </button>
          </div>
        </section>

        <!-- Custom hue -->
        <section>
          <div class="section-label mb-2">Custom brand hue</div>
          <p class="text-[0.6875rem] text-subtle mb-3">
            Any hue, no rebuild. This is the per-tenant path — feed it a value from your own API.
          </p>
          <div class="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="360"
              class="flex-1 accent-[var(--lm-accent)]"
              :value="accentHue ?? SKIN_HUES[skin]"
              @input="setAccentHue(Number(($event.target as HTMLInputElement).value))"
            />
            <span class="tnum text-xs text-muted w-8 text-right">{{ accentHue ?? SKIN_HUES[skin] }}</span>
          </div>
        </section>

        <!-- Density -->
        <section>
          <div class="section-label mb-2">Density</div>
          <div class="btn-group w-full">
            <button
              v-for="d in DENSITIES"
              :key="d"
              type="button"
              class="btn flex-1 capitalize"
              :aria-pressed="density === d"
              @click="setDensity(d as Density)"
            >
              {{ d }}
            </button>
          </div>
        </section>

        <!-- Radius -->
        <section>
          <div class="section-label mb-2">Corners</div>
          <div class="btn-group w-full">
            <button
              v-for="r in RADII"
              :key="r"
              type="button"
              class="btn flex-1 capitalize"
              :aria-pressed="radius === r"
              @click="setRadius(r as Radius)"
            >
              {{ r }}
            </button>
          </div>
        </section>

        <div class="mt-auto pt-2">
          <button type="button" class="btn btn-ghost btn-block" @click="reset()">
            <Icon name="refresh" :size="15" /> Reset to defaults
          </button>
        </div>
      </div>
    </aside>
  </Transition>
</template>
