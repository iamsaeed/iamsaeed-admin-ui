<script setup lang="ts">
/** A labelled slider with its value shown beside it, for a number the person can see changing instead of typing. Native range input, so keys and touch work. */
import { computed } from 'vue'

const props = withDefaults(defineProps<{ modelValue: number | null; min: number; max: number; step?: number; label: string; id: string; unit?: string; hint?: string; fallback?: number; disabled?: boolean; minLabel?: string; maxLabel?: string; decimals?: number }>(), { step: 1, unit: '', decimals: 0 })
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()
/** The slider shows the real value, else the default the maker would use (`fallback`), else its minimum. */
const value = computed(() => { const v = props.modelValue === null || Number.isNaN(props.modelValue) ? (props.fallback ?? props.min) : props.modelValue; return Math.min(props.max, Math.max(props.min, v)) })
const shown = computed(() => `${value.value.toFixed(props.decimals)}${props.unit}`)
const pct = computed(() => (props.max === props.min ? 0 : ((value.value - props.min) / (props.max - props.min)) * 100))
</script>

<template>
  <div class="slider-field">
    <div class="slider-head"><label v-if="label" class="form-label m-0" :for="id">{{ label }}</label><span v-else /><output class="slider-value" :for="id">{{ shown }}</output></div>
    <input :id="id" class="slider-input" type="range" :min="min" :max="max" :step="step" :value="value" :disabled="disabled" :aria-valuetext="shown" :style="{ '--slider-pct': `${pct}%` }" :data-testid="`slider:${id}`"
           @input="emit('update:modelValue', Number(($event.target as HTMLInputElement).value))" />
    <div v-if="minLabel || maxLabel" class="slider-ends"><span>{{ minLabel }}</span><span>{{ maxLabel }}</span></div>
    <p v-if="hint" class="text-xs text-muted m-0">{{ hint }}</p>
  </div>
</template>
