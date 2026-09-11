<script setup lang="ts">
/**
 * The topbar account menu — avatar + name, opening a menu of account actions.
 *
 * It implements the WAI-ARIA **menu button** pattern, which is deliberately
 * NOT the modal pattern used by the drawer and the tweaks panel:
 *
 *   - the trigger carries `aria-haspopup="menu"` and `aria-expanded`
 *   - opening moves focus to the first item (last, if opened with ArrowUp)
 *   - Arrow keys, Home and End move a roving focus inside the menu
 *   - Escape closes and gives focus back to the trigger
 *   - Tab closes it and lets focus continue through the page
 *
 * A focus TRAP would be wrong here. A menu is not modal: the rest of the page
 * stays reachable, so trapping would contradict what the markup promises. The
 * `aria-modal` rule in CLAUDE.md applies to overlays that claim inertness -
 * this one does not claim it and must not have it.
 *
 * The items are DATA, like the sidebar nav. The library does not decide
 * whether an app has a profile page or a workspace switcher; it emits an id
 * and the app routes it.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import Icon from '../ui/Icon.vue'
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

const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)
const triggerEl = ref<HTMLButtonElement | null>(null)
const menuEl = ref<HTMLElement | null>(null)

function itemButtons(): HTMLButtonElement[] {
  return menuEl.value ? Array.from(menuEl.value.querySelectorAll('button')) : []
}

function focusItem(index: number) {
  const buttons = itemButtons()
  if (buttons.length === 0) return

  // Wrap at both ends — a menu that stops dead at the last item makes a
  // keyboard user reverse all the way back.
  const wrapped = (index + buttons.length) % buttons.length
  buttons[wrapped]?.focus()
}

function currentIndex(): number {
  return itemButtons().indexOf(document.activeElement as HTMLButtonElement)
}

async function openMenu(focus: 'first' | 'last' = 'first') {
  open.value = true
  await nextTick()
  focusItem(focus === 'first' ? 0 : itemButtons().length - 1)
}

function closeMenu(restoreFocus = true) {
  if (!open.value) return
  open.value = false
  if (restoreFocus) triggerEl.value?.focus()
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    void openMenu('first')
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    void openMenu('last')
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  switch (event.key) {
    case 'Escape':
      event.preventDefault()
      closeMenu()
      break
    case 'ArrowDown':
      event.preventDefault()
      focusItem(currentIndex() + 1)
      break
    case 'ArrowUp':
      event.preventDefault()
      focusItem(currentIndex() - 1)
      break
    case 'Home':
      event.preventDefault()
      focusItem(0)
      break
    case 'End':
      event.preventDefault()
      focusItem(itemButtons().length - 1)
      break
    case 'Tab':
      // Close, but let the browser move focus onward as it normally would.
      closeMenu(false)
      break
  }
}

function onSelect(id: string) {
  closeMenu()
  emit('select', id)
}

/* A click anywhere else dismisses it. Pointerdown rather than click so the
   menu is gone before the next element reacts. */
function onDocumentPointerDown(event: PointerEvent) {
  if (!open.value) return
  if (rootEl.value?.contains(event.target as Node)) return
  closeMenu(false)
}

onMounted(() => document.addEventListener('pointerdown', onDocumentPointerDown))
onBeforeUnmount(() => document.removeEventListener('pointerdown', onDocumentPointerDown))
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
      @click="open ? closeMenu(false) : openMenu('first')"
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
