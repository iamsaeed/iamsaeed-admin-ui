<script setup lang="ts">
import { computed } from 'vue'
import { ICON_PATHS, type IconName } from './icon-paths'

const props = withDefaults(
  defineProps<{
    name: IconName | string
    /** Pixel size; the icon is always square. */
    size?: number | string
    stroke?: number
    /**
     * Decorative by default — hidden from assistive tech, because an icon
     * next to a visible label would otherwise be read twice. Pass a label
     * only when the icon IS the only content (e.g. an icon-only button).
     */
    label?: string
  }>(),
  { size: 18, stroke: 1.75 },
)

const paths = computed(() => ICON_PATHS[props.name as IconName] ?? '')
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    :aria-hidden="label ? undefined : true"
    :aria-label="label"
    :role="label ? 'img' : undefined"
    class="shrink-0"
    v-html="paths"
  />
</template>
