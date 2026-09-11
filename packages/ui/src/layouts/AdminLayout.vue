<script setup lang="ts">
/**
 * The admin shell.
 *
 * Mobile-first structure:
 *   < lg   content is full-bleed; nav lives in an off-canvas drawer, with an
 *          optional bottom bar for the top few destinations
 *   >= lg  a permanent rail sits beside the content and can collapse to icons
 *
 * The rail width is driven by `--lm-sidebar-w` / `--lm-sidebar-w-icon`, which
 * the density axis also moves — so "compact" narrows the nav without a single
 * extra rule here.
 */
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppSidebar from '../components/layout/AppSidebar.vue'
import AppTopbar from '../components/layout/AppTopbar.vue'
import BottomNav from '../components/layout/BottomNav.vue'
import { useFocusTrap } from '../composables/useFocusTrap'
import { useSidebar } from '../composables/useSidebar'
import type { BottomNavItem, NavSchema, UserMenuItem } from '../types/nav'

const props = withDefaults(
  defineProps<{
    nav: NavSchema
    bottomNav?: BottomNavItem[]
    activeId?: string
    title?: string
    productName?: string
    productTag?: string
    version?: string
    userName?: string
    userEmail?: string
    /** Account-menu entries. Omitted means Settings + Sign out. */
    userMenuItems?: UserMenuItem[]
    notificationCount?: number
  }>(),
  {},
)

const emit = defineEmits<{
  navigate: [id: string]
  search: [q: string]
  openTweaks: []
  userMenuSelect: [id: string]
}>()

const { collapsed, drawerOpen, closeDrawer } = useSidebar()
const drawerEl = ref<HTMLElement | null>(null)

/* Escape closes the drawer — expected of any overlay, and the only way out
   for a keyboard user if the close button scrolls off. */
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && drawerOpen.value) closeDrawer()
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

/* Contain focus in the drawer while it is open, and hand it back to the
   hamburger when it closes. The drawer is marked aria-modal, and that
   attribute is a promise that the rest of the page is unreachable — the trap
   is what makes it true. */
useFocusTrap(drawerOpen, drawerEl)
</script>

<template>
  <div class="min-h-dvh bg-bg text-fg">
    <a href="#lm-main" class="skip-link">Skip to content</a>

    <!-- Desktop rail -->
    <aside
      class="hidden lg:block fixed inset-y-0 left-0 z-(--lm-z-drawer)
             transition-[width] duration-(--lm-dur) ease-(--lm-ease)"
      :style="{ width: collapsed ? 'var(--lm-sidebar-w-icon)' : 'var(--lm-sidebar-w)' }"
    >
      <AppSidebar
        variant="rail"
        :nav="nav"
        :active-id="activeId"
        :product-name="productName"
        :product-tag="productTag"
        :version="version"
        :user-name="userName"
        :user-email="userEmail"
        @navigate="emit('navigate', $event)"
      >
        <template v-if="$slots.brand" #brand><slot name="brand" /></template>
      </AppSidebar>
    </aside>

    <!-- Mobile drawer -->
    <Transition
      enter-active-class="transition-opacity duration-(--lm-dur)"
      leave-active-class="transition-opacity duration-(--lm-dur)"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="drawerOpen" class="scrim lg:hidden" @click="closeDrawer()" />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-(--lm-dur) ease-(--lm-ease)"
      leave-active-class="transition-transform duration-(--lm-dur) ease-(--lm-ease)"
      enter-from-class="-translate-x-full"
      leave-to-class="-translate-x-full"
    >
      <aside
        v-if="drawerOpen"
        ref="drawerEl"
        class="lg:hidden fixed inset-y-0 left-0 z-(--lm-z-drawer) w-[min(19rem,85vw)] shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <AppSidebar
          variant="drawer"
          :nav="nav"
          :active-id="activeId"
          :product-name="productName"
          :product-tag="productTag"
          :version="version"
          :user-name="userName"
          :user-email="userEmail"
          @navigate="emit('navigate', $event)"
          @close="closeDrawer()"
        >
          <template v-if="$slots.brand" #brand><slot name="brand" /></template>
        </AppSidebar>
      </aside>
    </Transition>

    <!-- Content column.
         Padding is zero on mobile (the drawer overlays rather than pushes) and
         tracks the rail width from lg up — one custom property, set once. -->
    <div
      class="lg:pl-(--lm-rail-w) transition-[padding] duration-(--lm-dur) ease-(--lm-ease)"
      :style="{ '--lm-rail-w': collapsed ? 'var(--lm-sidebar-w-icon)' : 'var(--lm-sidebar-w)' }"
    >
      <AppTopbar
        :title="title"
        :user-name="userName"
        :user-email="userEmail"
        :user-menu-items="userMenuItems"
        :notification-count="notificationCount"
        @search="emit('search', $event)"
        @open-tweaks="emit('openTweaks')"
        @user-menu-select="emit('userMenuSelect', $event)"
      >
        <template #actions><slot name="topbar-actions" /></template>
      </AppTopbar>

      <main
        id="lm-main"
        class="page"
        :class="bottomNav?.length ? 'pb-[calc(var(--lm-bottomnav-h)+1.5rem)] lg:pb-(--lm-space-6)' : ''"
      >
        <slot />
      </main>
    </div>

    <BottomNav
      v-if="bottomNav?.length"
      :items="bottomNav"
      :active-id="activeId"
      show-more
      @navigate="emit('navigate', $event)"
    />
  </div>
</template>
