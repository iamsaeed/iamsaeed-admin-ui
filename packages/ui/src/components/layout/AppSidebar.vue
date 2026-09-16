<script setup lang="ts">
/**
 * The navigation rail.
 *
 * ONE component serves both shell modes — a permanent desktop rail and the
 * contents of the mobile drawer — because duplicating it is how the two
 * drift apart. `variant` only changes chrome (width behaviour, close button);
 * the nav tree itself is identical.
 */
import { computed } from 'vue'
import { useSidebar } from '../../composables/useSidebar'
import type { NavSchema } from '../../types/nav'
import Icon from '../ui/Icon.vue'

const props = withDefaults(
  defineProps<{
    nav: NavSchema
    /**
     * Id of the current destination. Passed in rather than read from
     * `$route`, so the library never hard-depends on vue-router being
     * installed — a Blade-hosted or router-less app can use the shell too.
     */
    activeId?: string
    /** `rail` = permanent desktop sidebar; `drawer` = inside the mobile drawer. */
    variant?: 'rail' | 'drawer'
    productName?: string
    productTag?: string
    version?: string
  }>(),
  { variant: 'rail', productName: 'Lumen', productTag: 'Admin' },
)

const emit = defineEmits<{ navigate: [id: string]; close: [] }>()

const { collapsed, openGroup, toggleGroup } = useSidebar()

/** Icons-only applies to the desktop rail; a drawer is never collapsed. */
const isIconOnly = computed(() => props.variant === 'rail' && collapsed.value)

const isActive = (id: string) => props.activeId === id

function onItemClick(id: string, hasChildren: boolean) {
  if (hasChildren) {
    toggleGroup(id)
    return
  }
  emit('navigate', id)
  if (props.variant === 'drawer') emit('close')
}
</script>

<template>
  <div
    class="flex h-full flex-col bg-surface border-border"
    :class="variant === 'rail' ? 'border-r' : ''"
  >
    <!-- Brand -->
    <div class="flex items-center gap-3 px-4 h-(--lm-topbar-h) shrink-0">
      <!-- The brand mark is a slot so a consuming product can render its own
           logo here. The default keeps the generic glyph, so a consumer that
           passes nothing is unchanged. -->
      <slot name="brand">
        <div
          class="grid place-items-center w-8 h-8 rounded-sm bg-accent text-on-accent shrink-0"
          aria-hidden="true"
        >
          <Icon name="layers" :size="17" />
        </div>
      </slot>
      <div v-if="!isIconOnly" class="min-w-0 flex-1">
        <div class="font-display font-semibold text-[0.9375rem] leading-tight truncate">
          {{ productName }}
        </div>
        <div v-if="productTag" class="text-[0.6875rem] text-subtle truncate">{{ productTag }}</div>
      </div>
      <button
        v-if="variant === 'drawer'"
        type="button"
        class="btn btn-ghost btn-icon btn-sm"
        @click="emit('close')"
      >
        <Icon name="x" label="Close navigation" />
      </button>
    </div>

    <!-- Nav tree -->
    <nav class="flex-1 overflow-y-auto overscroll-contain px-2 pb-4" aria-label="Main">
      <template v-for="section in nav" :key="section.id">
        <div v-if="section.label && !isIconOnly" class="nav-section">{{ section.label }}</div>
        <!-- Collapsed rail: a rule stands in for the heading so grouping survives -->
        <div v-else-if="section.label" class="mx-3 my-3 hairline" aria-hidden="true" />

        <template v-for="item in section.items" :key="item.id">
          <template v-if="item.visible !== false">
            <button
              type="button"
              class="nav-item w-full"
              :class="{ 'is-active': isActive(item.id), 'justify-center': isIconOnly }"
              :aria-expanded="item.children ? openGroup === item.id : undefined"
              :title="isIconOnly ? item.label : undefined"
              @click="onItemClick(item.id, !!item.children)"
            >
              <Icon v-if="item.icon" :name="item.icon" :size="18" />
              <template v-if="!isIconOnly">
                <span class="flex-1 text-left truncate">{{ item.label }}</span>
                <span v-if="item.badge" class="badge badge-neutral">{{ item.badge }}</span>
                <Icon
                  v-if="item.children"
                  name="chevron-down"
                  :size="14"
                  class="transition-transform duration-(--lm-dur)"
                  :class="openGroup === item.id ? 'rotate-180' : ''"
                />
              </template>
            </button>

            <!-- Children. Hidden entirely when icons-only: a flyout would be a
                 hover-dependent affordance, which fails on touch. -->
            <div
              v-if="item.children && openGroup === item.id && !isIconOnly"
              class="overflow-hidden"
            >
              <button
                v-for="child in item.children"
                :key="child.id"
                type="button"
                class="nav-item nav-item-sub w-full"
                :class="{ 'is-active': isActive(child.id) }"
                @click="onItemClick(child.id, false)"
              >
                <span class="flex-1 text-left truncate">{{ child.label }}</span>
                <span v-if="child.badge" class="badge badge-neutral">{{ child.badge }}</span>
              </button>
            </div>
          </template>
        </template>
      </template>
    </nav>

    <!-- Footer.
         The account used to sit here as well as in the topbar. Two controls
         for one thing is a question every user has to answer once ("are these
         the same account?"), so the sidebar copy is gone and UserMenu in the
         topbar is the single place an account is reached. What remains is the
         build stamp, and the whole block disappears when there is none. -->
    <div
      v-if="version && !isIconOnly"
      class="border-t border-border px-3 py-2 shrink-0 text-[0.625rem] text-subtle"
    >
      {{ version }}
    </div>
  </div>
</template>
