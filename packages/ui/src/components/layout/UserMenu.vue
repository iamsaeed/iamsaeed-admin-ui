<script setup lang="ts">
/**
 * The topbar account menu — avatar + name, opening a menu of account actions.
 *
 * The keyboard contract lives in `useMenuButton`, shared with the other
 * topbar menus: focus lands on the first item, arrows wrap, Escape closes and
 * restores focus to the trigger, Tab closes without stealing it, a click
 * outside dismisses. No focus trap and no `aria-modal` — a menu is not a
 * dialog and must not claim the page behind it is inert.
 *
 * The items are DATA, like the sidebar nav. The library does not decide
 * whether an app has a profile page or a workspace switcher; it emits an id
 * and the app routes it.
 */
import { computed, ref } from 'vue'
import Icon from '../ui/Icon.vue'
import { useMenuButton } from '../../composables/useMenuButton'
import type { UserMenuItem } from '../../types/nav'

const props = withDefaults(
  defineProps<{
    userName?: string
    userEmail?: string
    items?: UserMenuItem[]
    /** Hide the name beside the avatar; the avatar alone stays the trigger. */
    showName?: boolean
  }>(),
  { showName: true },
)

const emit = defineEmits<{ select: [id: string] }>()

/** Settings and sign-out are what every admin has; anything else is the app's. */
const DEFAULT_ITEMS: UserMenuItem[] = [
  { id: 'settings', label: 'Settings', icon: 'settings' },
  { id: 'sign-out', label: 'Sign out', icon: 'log-out', danger: true, separated: true },
]

const entries = computed<UserMenuItem[]>(() => props.items ?? DEFAULT_ITEMS)
const initial = computed(() => (props.userName || 'U').slice(0, 1).toUpperCase())

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
</script>

<template>
  <div ref="rootEl" class="relative">
    <button
      ref="triggerEl"
      type="button"
      class="btn btn-ghost gap-2 px-1.5 sm:px-2"
      :aria-expanded="open"
      aria-haspopup="menu"
      :aria-label="userName ? `Account menu for ${userName}` : 'Account menu'"
      @click="toggle()"
      @keydown="onTriggerKeydown"
    >
      <span class="avatar avatar-sm">{{ initial }}</span>
      <span v-if="showName && userName" class="hidden sm:block max-w-32 truncate text-sm font-medium">
        {{ userName }}
      </span>
      <Icon
        name="chevron-down"
        :size="14"
        class="hidden sm:block transition-transform duration-(--lm-dur)"
        :class="open ? 'rotate-180' : ''"
      />
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
        class="menu absolute right-0 top-full mt-2 z-(--lm-z-dropdown)"
        role="menu"
        :aria-label="userName ? `${userName} account` : 'Account'"
        @keydown="onMenuKeydown"
        @focusout="onMenuFocusOut"
      >
        <div v-if="userName || userEmail" class="px-3 py-2">
          <p v-if="userName" class="text-sm font-medium truncate">{{ userName }}</p>
          <p v-if="userEmail" class="muted text-xs truncate">{{ userEmail }}</p>
        </div>
        <div v-if="userName || userEmail" class="menu-sep" />

        <template v-for="item in entries" :key="item.id">
          <div v-if="item.separated" class="menu-sep" />
          <button
            type="button"
            class="menu-item"
            :class="item.danger ? 'menu-item-danger' : ''"
            role="menuitem"
            tabindex="-1"
            @click="onSelect(item.id)"
          >
            <Icon v-if="item.icon" :name="item.icon" :size="15" />
            <span>{{ item.label }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </div>
</template>
