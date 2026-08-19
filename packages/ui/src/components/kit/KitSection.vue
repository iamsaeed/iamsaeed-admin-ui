<script setup lang="ts">
defineProps<{ title: string; hint?: string }>()
</script>

<template>
  <section class="mb-8">
    <h2 class="font-display text-base font-semibold mb-1">{{ title }}</h2>
    <p v-if="hint" class="text-xs text-muted mb-4 max-w-2xl">{{ hint }}</p>
    <div class="card card-p flex flex-wrap items-center gap-3"><slot /></div>
  </section>
</template>
