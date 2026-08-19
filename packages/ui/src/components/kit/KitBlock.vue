<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <div class="mb-6 last:mb-0 w-full">
    <div class="section-label mb-2">{{ label }}</div>
    <div class="flex flex-wrap items-center gap-3"><slot /></div>
  </div>
</template>
