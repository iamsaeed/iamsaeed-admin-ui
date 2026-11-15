<script setup lang="ts">
/**
 * A single choice from a list you can search: a button that looks like a `.form-select` and opens a
 * popover with a search box above the options. Use it where a plain <select> grows too long to scan
 * (labels, people, projects). `v-model` is the chosen option's `value`; the empty choice (value '',
 * shown as `placeholder`, e.g. "Any label") is offered first so the field can be cleared.
 *
 * The list is a NON-modal popover (the page stays reachable): it does not claim `aria-modal` and does
 * not trap focus. It is teleported to <body> so a clipping ancestor cannot hide it. Arrows move,
 * Enter takes, Escape closes and returns focus to the button.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import Icon from './Icon.vue'

export interface SearchSelectOption { value: string; label: string }

const props = withDefaults(
  defineProps<{
    options: SearchSelectOption[]
    /** The empty choice, and what the button shows when nothing is chosen ("Any label"). */
    placeholder?: string
    searchPlaceholder?: string
    /** Accessible name of the button. */
    label?: string
    id?: string
    disabled?: boolean
    /** Offer the empty choice (default). Turn off for a required field. */
    clearable?: boolean
  }>(),
  { placeholder: 'Any', searchPlaceholder: 'Search', label: undefined, id: undefined, disabled: false, clearable: true },
)

const model = defineModel<string>({ default: '' })

const uid = useId()
const listId = `${uid}-list`
const root = useTemplateRef<HTMLElement>('root')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const dropdown = useTemplateRef<HTMLElement>('dropdown')
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

const open = ref(false)
const search = ref('')
const activeIndex = ref(-1)
const popoverStyle = ref<Record<string, string>>({})
const optionEls = new Map<number, HTMLElement>()

const selected = computed(() => props.options.find((o) => o.value === model.value) ?? null)

/** What the list shows: the empty choice (only while not searching), then the matches, whole-word-start matches first. */
const shown = computed<SearchSelectOption[]>(() => {
  const q = search.value.trim().toLowerCase()
  const matches = q
    ? props.options
        .filter((o) => o.label.toLowerCase().includes(q))
        .sort((a, b) => Number(b.label.toLowerCase().startsWith(q)) - Number(a.label.toLowerCase().startsWith(q)))
    : props.options
  return !q && props.clearable ? [{ value: '', label: props.placeholder }, ...matches] : matches
})
const activeId = computed(() => (activeIndex.value >= 0 ? `${uid}-opt-${activeIndex.value}` : undefined))

function setOptionRef(el: unknown, index: number): void {
  if (el) optionEls.set(index, el as HTMLElement)
}
function scrollActiveIntoView(): void {
  void nextTick(() => optionEls.get(activeIndex.value)?.scrollIntoView?.({ block: 'nearest' }))
}
function initialIndex(): number {
  const current = shown.value.findIndex((o) => o.value === model.value)
  return current >= 0 ? current : 0
}

function positionPopover(): void {
  const box = trigger.value?.getBoundingClientRect()
  if (!box) return
  const viewport = window.innerHeight || document.documentElement.clientHeight
  const desired = 320
  const below = viewport - box.bottom
  const above = box.top
  const openUp = below < Math.min(desired, 280) && above > below
  const style: Record<string, string> = { position: 'fixed', left: `${Math.round(box.left)}px`, minWidth: `${Math.round(box.width)}px` }
  if (openUp) {
    style.bottom = `${Math.round(viewport - box.top + 4)}px`
    style.maxHeight = `${Math.round(Math.min(desired, above - 16))}px`
  } else {
    style.top = `${Math.round(box.bottom + 4)}px`
    style.maxHeight = `${Math.round(Math.min(desired, below - 16))}px`
  }
  popoverStyle.value = style
}
function onReposition(): void {
  if (open.value) positionPopover()
}

function openList(): void {
  if (props.disabled) return
  open.value = true
  search.value = ''
  activeIndex.value = initialIndex()
  void nextTick(() => {
    positionPopover()
    searchInput.value?.focus({ preventScroll: true })
    scrollActiveIntoView()
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
  })
}
function close(returnFocus = false): void {
  open.value = false
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
  if (returnFocus) void nextTick(() => trigger.value?.focus())
}
function toggle(): void {
  open.value ? close() : openList()
}
function moveActive(delta: number): void {
  const n = shown.value.length
  if (!n) return
  activeIndex.value = (activeIndex.value + delta + n) % n
  scrollActiveIntoView()
}
function pick(value: string): void {
  model.value = value
  close(true)
}
function selectActive(): void {
  const o = shown.value[activeIndex.value]
  if (o) pick(o.value)
}
function onDocumentClick(event: MouseEvent): void {
  if (!open.value) return
  const target = event.target as Node
  if (!root.value?.contains(target) && !dropdown.value?.contains(target)) close()
}

watch(search, () => {
  activeIndex.value = shown.value.length ? 0 : -1
  scrollActiveIntoView()
})

onMounted(() => document.addEventListener('click', onDocumentClick, true))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, true)
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
})
</script>

<template>
  <div ref="root" class="search-select">
    <button
      :id="id"
      ref="trigger"
      type="button"
      class="form-select search-select-trigger"
      :class="{ 'is-placeholder': !selected }"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="open ? 'true' : 'false'"
      :aria-controls="open ? listId : undefined"
      :aria-label="label ? `${label}: ${selected?.label ?? placeholder}` : undefined"
      @click="toggle"
      @keydown.down.prevent="openList"
    >
      <span class="search-select-value">{{ selected?.label ?? placeholder }}</span>
    </button>

    <Teleport to="body">
      <div v-if="open" ref="dropdown" class="search-select-popover" :style="popoverStyle">
        <div class="search-select-search">
          <Icon name="search" :size="16" />
          <input
            ref="searchInput"
            v-model="search"
            type="text"
            class="search-select-input"
            :placeholder="searchPlaceholder"
            :aria-label="label ? `Search ${label.toLowerCase()}` : searchPlaceholder"
            role="combobox"
            aria-expanded="true"
            :aria-controls="listId"
            :aria-activedescendant="activeId"
            autocomplete="off"
            @keydown.down.prevent="moveActive(1)"
            @keydown.up.prevent="moveActive(-1)"
            @keydown.enter.prevent="selectActive"
            @keydown.esc.prevent="close(true)"
          />
        </div>
        <ul :id="listId" class="search-select-list" role="listbox" :aria-label="label">
          <li
            v-for="(o, i) in shown"
            :id="`${uid}-opt-${i}`"
            :key="o.value"
            :ref="(el) => setOptionRef(el, i)"
            role="option"
            class="search-select-option"
            :class="{ 'is-active': i === activeIndex, 'is-selected': o.value === model }"
            :aria-selected="o.value === model ? 'true' : 'false'"
            @click="pick(o.value)"
            @mouseenter="activeIndex = i"
          >
            <span class="search-select-option-label">{{ o.label }}</span>
            <Icon v-if="o.value === model" name="check" :size="14" />
          </li>
          <li v-if="!shown.length" class="search-select-empty" role="presentation">Nothing matches</li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>
