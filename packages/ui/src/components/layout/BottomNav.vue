<script setup lang="ts">
/**
 * Phone-only bottom navigation.
 *
 * Why it exists: on a phone the top of the screen is the hardest place to
 * reach one-handed, and burying every primary destination behind a hamburger
 * costs a tap each time. Four or five thumb-zone destinations remove that.
 *
 * Capped at 5 — beyond that each target drops under a comfortable thumb
 * width. Overflow belongs in the drawer, which is what the `more` slot is.
 */
import { useSidebar } from '../../composables/useSidebar'
import type { BottomNavItem } from '../../types/nav'
import Icon from '../ui/Icon.vue'

const props = defineProps<{
  items: BottomNavItem[]
  activeId?: string
  /** Append a "More" button that opens the full nav drawer. */
  showMore?: boolean
}>()

const emit = defineEmits<{ navigate: [id: string] }>()
const { openDrawer } = useSidebar()

const shown = () => props.items.slice(0, props.showMore ? 4 : 5)
</script>

<template>
  <nav
    class="lg:hidden fixed bottom-0 inset-x-0 z-(--lm-z-sticky) flex items-stretch
           bg-surface/90 backdrop-blur-md border-t border-border"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Primary"
  >
    <button
      v-for="item in shown()"
      :key="item.id"
      type="button"
      class="relative flex flex-1 flex-col items-center justify-center gap-1 h-(--lm-bottomnav-h)
             text-[0.625rem] font-medium transition-colors duration-(--lm-dur-fast)"
      :class="activeId === item.id ? 'text-accent' : 'text-muted'"
      :aria-current="activeId === item.id ? 'page' : undefined"
      @click="emit('navigate', item.id)"
    >
      <Icon :name="item.icon" :size="20" />
      <span class="truncate max-w-full px-1">{{ item.label }}</span>
      <span
        v-if="item.badge"
        class="absolute top-1.5 right-[28%] dot bg-danger"
        aria-hidden="true"
      />
    </button>

    <button
      v-if="showMore"
      type="button"
      class="flex flex-1 flex-col items-center justify-center gap-1 h-(--lm-bottomnav-h)
             text-[0.625rem] font-medium text-muted"
      @click="openDrawer()"
    >
      <Icon name="menu" :size="20" />
      <span>More</span>
    </button>
  </nav>
</template>
