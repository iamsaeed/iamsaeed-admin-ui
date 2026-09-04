<script setup lang="ts">
/**
 * Topbar.
 *
 * Mobile-first: the phone gets a hamburger, the title, and at most two icon
 * actions — search expands to a full-screen field rather than competing for
 * width. The inline search input and the collapse toggle appear from `lg`.
 */
import { ref } from 'vue'
import { useSidebar } from '../../composables/useSidebar'
import { useTheme } from '../../composables/useTheme'
import Icon from '../ui/Icon.vue'

withDefaults(
  defineProps<{
    title?: string
    searchPlaceholder?: string
    notificationCount?: number
    userName?: string
    showThemeToggle?: boolean
  }>(),
  { searchPlaceholder: 'Search…', showThemeToggle: true },
)

const emit = defineEmits<{ search: [q: string]; openTweaks: [] }>()

const { collapsed, toggleCollapsed, openDrawer } = useSidebar()
const { isDark, cycleTheme } = useTheme()

const query = ref('')
const mobileSearchOpen = ref(false)
</script>

<template>
  <header
    class="sticky top-0 z-(--lm-z-sticky) flex items-center gap-2 h-(--lm-topbar-h) px-3 lg:px-4
           bg-surface/85 backdrop-blur-md border-b border-border"
  >
    <!-- Mobile: open drawer -->
    <button type="button" class="btn btn-ghost btn-icon lg:hidden" @click="openDrawer()">
      <Icon name="menu" :size="20" label="Open navigation" />
    </button>

    <!-- Desktop: collapse the rail -->
    <button
      type="button"
      class="btn btn-ghost btn-icon hidden lg:inline-flex"
      :aria-pressed="collapsed"
      @click="toggleCollapsed()"
    >
      <Icon name="panel-left" :size="18" :label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'" />
    </button>

    <!-- Mobile title (hidden once search takes over) -->
    <h1 v-if="title && !mobileSearchOpen" class="lg:hidden font-display font-semibold truncate">
      {{ title }}
    </h1>

    <!-- Desktop search -->
    <div class="hidden lg:flex input-group max-w-md flex-1">
      <span class="input-group-icon"><Icon name="search" :size="15" /></span>
      <input
        v-model="query"
        type="search"
        class="form-input"
        :placeholder="searchPlaceholder"
        @keyup.enter="emit('search', query)"
      />
    </div>

    <!-- Mobile expanding search -->
    <div v-if="mobileSearchOpen" class="lg:hidden input-group flex-1">
      <span class="input-group-icon"><Icon name="search" :size="15" /></span>
      <input
        v-model="query"
        type="search"
        class="form-input"
        :placeholder="searchPlaceholder"
        autofocus
        @keyup.enter="emit('search', query)"
        @blur="mobileSearchOpen = false"
      />
    </div>

    <!--
      The spacer that pins the action cluster to the right edge.

      It has to grow at EVERY width, not only below `lg`. The desktop search beside it is
      `max-w-md`, so past roughly 28rem the search stops growing — and with this collapsed to
      `flex-none` above `lg`, nothing absorbed the remainder. The icons then sat stranded beside
      the search with a wide empty gap to their right, which reads as a broken layout rather
      than a deliberate one. Growing at all widths is also what already made the mobile
      arrangement correct, so this is one rule instead of two.
    -->
    <div class="flex-1" />

    <button
      v-if="!mobileSearchOpen"
      type="button"
      class="btn btn-ghost btn-icon lg:hidden"
      @click="mobileSearchOpen = true"
    >
      <Icon name="search" :size="19" label="Search" />
    </button>

    <button
      v-if="showThemeToggle"
      type="button"
      class="btn btn-ghost btn-icon"
      @click="cycleTheme()"
    >
      <Icon :name="isDark ? 'sun' : 'moon'" :size="18" label="Change theme" />
    </button>

    <button type="button" class="btn btn-ghost btn-icon relative">
      <Icon name="bell" :size="18" label="Notifications" />
      <span
        v-if="notificationCount"
        class="absolute top-1.5 right-1.5 dot bg-danger"
        aria-hidden="true"
      />
    </button>

    <slot name="actions" />

    <button type="button" class="btn btn-ghost btn-icon" @click="emit('openTweaks')">
      <Icon name="sliders" :size="18" label="Theme settings" />
    </button>

    <span class="avatar ml-1">{{ (userName || 'U').slice(0, 1).toUpperCase() }}</span>
  </header>
</template>
