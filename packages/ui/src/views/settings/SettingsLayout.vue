<script setup lang="ts">
/**
 * Settings sub-shell.
 *
 * Mobile-first: the section switcher is a horizontally-scrolling tab strip on
 * phones and a vertical rail from md — a nested vertical sidebar inside an
 * already-narrow viewport would leave no room for the form.
 */
import Icon from '../../components/ui/Icon.vue'

defineProps<{ active: string; title: string; subtitle?: string }>()
const emit = defineEmits<{ navigate: [id: string] }>()

const sections = [
  { id: 'settings.general', label: 'General', icon: 'settings' },
  { id: 'settings.appearance', label: 'Appearance', icon: 'sparkles' },
  { id: 'settings.integrations', label: 'Integrations', icon: 'plug' },
  { id: 'settings.billing', label: 'Billing', icon: 'credit-card' },
]
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Settings</h1>
      <p class="page-sub">Workspace configuration.</p>
    </div>
  </div>

  <div class="md:grid md:grid-cols-[13rem_1fr] md:gap-8">
    <!-- Phone: tab strip. Desktop: vertical rail. -->
    <nav class="tabs md:!border-0 md:flex-col md:gap-1 md:overflow-visible mb-5 md:mb-0" aria-label="Settings sections">
      <button
        v-for="s in sections"
        :key="s.id"
        class="tab md:!hidden"
        :class="active === s.id ? 'is-active' : ''"
        @click="emit('navigate', s.id)"
      >
        {{ s.label }}
      </button>
      <button
        v-for="s in sections"
        :key="`d-${s.id}`"
        class="nav-item !hidden md:!flex w-full"
        :class="active === s.id ? 'is-active' : ''"
        @click="emit('navigate', s.id)"
      >
        <Icon :name="s.icon" :size="16" /> {{ s.label }}
      </button>
    </nav>

    <div class="min-w-0">
      <div class="mb-5">
        <h2 class="font-display text-lg font-semibold">{{ title }}</h2>
        <p v-if="subtitle" class="text-xs text-muted mt-0.5">{{ subtitle }}</p>
      </div>
      <slot />
    </div>
  </div>
</template>
