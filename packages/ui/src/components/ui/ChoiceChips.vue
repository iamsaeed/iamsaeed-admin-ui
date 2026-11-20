<script setup lang="ts">
/** A row of named choices shown as buttons: pick one (or several with `multiple`). Use it instead of a dropdown when there are a handful of options worth seeing together. */
const props = withDefaults(defineProps<{ modelValue: string | string[]; options: readonly { value: string; label: string; hint?: string }[]; label: string; multiple?: boolean; disabled?: boolean; id?: string }>(), { id: 'chips' })
const emit = defineEmits<{ 'update:modelValue': [value: string | string[]] }>()
const on = (v: string): boolean => (Array.isArray(props.modelValue) ? props.modelValue.includes(v) : props.modelValue === v)
function pick(v: string) {
  if (!props.multiple) { emit('update:modelValue', v); return }
  const cur = Array.isArray(props.modelValue) ? props.modelValue : []
  emit('update:modelValue', cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v])
}
</script>

<template>
  <div class="chip-choice" :role="multiple ? 'group' : 'radiogroup'" :aria-label="label">
    <button v-for="o in options" :key="o.value" type="button" class="chip-option" :role="multiple ? undefined : 'radio'" :aria-checked="multiple ? undefined : on(o.value)" :aria-pressed="multiple ? on(o.value) : undefined"
            :title="o.hint" :disabled="disabled" :data-testid="`${id}:${o.value}`" @click="pick(o.value)">{{ o.label }}</button>
  </div>
</template>
