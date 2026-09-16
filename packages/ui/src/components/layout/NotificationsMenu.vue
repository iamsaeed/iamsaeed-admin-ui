<script setup lang="ts">
/**
 * The topbar bell — unread indicator plus a dropdown of recent notifications.
 *
 * The bell carried a red dot and did nothing when clicked, which is worse than
 * having no bell: it reports that something happened and then refuses to say
 * what. This makes the dot an affordance.
 *
 * Shares its keyboard contract with the account menu through `useMenuButton`.
 * The list is DATA — the shell never fetches, never marks anything read, and
 * never decides what a click means. It emits an id.
 */
import { computed, ref } from 'vue'
import Icon from '../ui/Icon.vue'
import { useMenuButton } from '../../composables/useMenuButton'
import type { NotificationItem } from '../../types/notifications'

const props = withDefaults(
  defineProps<{
    items?: NotificationItem[]
    /** Overrides the unread count. Omitted, it is counted from `items`. */
    count?: number
    emptyText?: string
  }>(),
  { emptyText: "You're all caught up." },
)

const emit = defineEmits<{
  select: [id: string]
  markAllRead: []
  viewAll: []
}>()

const entries = computed<NotificationItem[]>(() => props.items ?? [])

const unread = computed(() =>
  props.count ?? entries.value.filter((item) => item.unread).length,
)

/* Announced rather than shown as a bare number: a red dot alone tells a
   screen-reader user nothing at all. */
const label = computed(() =>
  unread.value > 0 ? `Notifications, ${unread.value} unread` : 'Notifications',
)

const rootEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)

const { open, closeMenu, toggle, onTriggerKeydown, onMenuKeydown, onMenuFocusOut } = useMenuButton({
  root: rootEl,
  trigger: triggerEl,
  menu: menuEl,
})

function onSelect(id: string) {
  closeMenu()
  emit('select', id)
}

function onViewAll() {
  closeMenu()
  emit('viewAll')
}

</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      ref="triggerEl"
      type="button"
      class="btn btn-ghost btn-icon relative"
      :aria-expanded="open"
      aria-haspopup="menu"
      :aria-label="label"
      @click="toggle()"
      @keydown="onTriggerKeydown"
    >
      <Icon name="bell" :size="18" />
      <span v-if="unread > 0" class="absolute top-1.5 right-1.5 dot bg-danger" aria-hidden="true" />
    </button>

    <Transition
      enter-active-class="transition duration-(--lm-dur) ease-(--lm-ease)"
      leave-active-class="transition duration-(--lm-dur) ease-(--lm-ease)"
      enter-from-class="opacity-0 -translate-y-1"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <div
        v-if="open"
        ref="menuEl"
        class="menu absolute right-0 top-full mt-2 z-(--lm-z-dropdown)
               w-[min(22rem,calc(100vw-1.5rem))]"
        role="menu"
        aria-label="Notifications"
        @keydown="onMenuKeydown"
        @focusout="onMenuFocusOut"
      >
        <div class="flex items-center justify-between gap-3 px-3 py-2">
          <span class="text-sm font-medium">Notifications</span>
          <button
            v-if="unread > 0"
            type="button"
            class="btn btn-link text-xs"
            role="menuitem"
            tabindex="-1"
            @click="emit('markAllRead')"
          >
            Mark all read
          </button>
        </div>
        <div class="menu-sep" />

        <p v-if="entries.length === 0" class="px-3 py-6 text-center text-sm text-subtle">
          {{ emptyText }}
        </p>

        <!-- Capped height so a long list scrolls inside the menu instead of
             running off the bottom of the viewport on a phone. -->
        <div v-else class="max-h-80 overflow-y-auto">
          <button
            v-for="item in entries"
            :key="item.id"
            type="button"
            class="menu-item items-start text-left"
            role="menuitem"
            tabindex="-1"
            @click="onSelect(item.id)"
          >
            <span class="avatar avatar-sm mt-0.5" :class="`badge-${item.tone ?? 'neutral'}`">
              <Icon :name="item.icon ?? 'bell'" :size="13" />
            </span>
            <span class="min-w-0 flex-1">
              <span class="flex items-center gap-2">
                <span class="truncate text-sm" :class="item.unread ? 'font-medium' : ''">
                  {{ item.title }}
                </span>
                <span v-if="item.unread" class="dot bg-accent shrink-0" aria-hidden="true" />
              </span>
              <span v-if="item.body" class="block truncate text-xs text-subtle">{{ item.body }}</span>
              <span v-if="item.time" class="block text-[0.6875rem] text-subtle">{{ item.time }}</span>
            </span>
          </button>
        </div>

        <div class="menu-sep" />
        <button type="button" class="menu-item justify-center" role="menuitem" tabindex="-1" @click="onViewAll">
          View all notifications
        </button>
      </div>
    </Transition>
  </div>
</template>
