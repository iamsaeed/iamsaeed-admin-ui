<script setup lang="ts">
/**
 * Search as you type, against a list too big to load: the field IS the search box, and choices appear
 * under it as you pause. ONLY THE LAST SEARCH COUNTS (see `useLatestSearch`): typing waits for a pause
 * before one request goes out, a request still running is aborted when a newer one starts, and a late
 * answer from an older search is dropped. Use `SearchSelect` instead when the whole list is already loaded.
 *
 * `search(text, signal)` returns the options for that text; pass `signal` to `fetch` so it really stops.
 * `v-model` is the chosen option ({ value, label }) or null; typing again after choosing starts a new search
 * and the choice stays until another is made (Escape or the clear button empties it).
 *
 * A NON-modal popover like `SearchSelect`: no `aria-modal`, no focus trap, teleported to <body>.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import Icon from './Icon.vue'
import type { SearchSelectOption } from './SearchSelect.vue'
import { useLatestSearch } from '../../composables/useLatestSearch'

const props = withDefaults(
  defineProps<{
    search: (text: string, signal: AbortSignal) => Promise<SearchSelectOption[]>
    placeholder?: string
    /** Accessible name of the field. */
    label?: string
    id?: string
    disabled?: boolean
    /** Wait after the last keystroke, in ms. */
    delay?: number
    /** Characters needed before searching. */
    minChars?: number
  }>(),
  { placeholder: 'Type to search', label: undefined, id: undefined, disabled: false, delay: 250, minChars: 2 },
)

const model = defineModel<SearchSelectOption | null>({ default: null })

const uid = useId()
const listId = `${uid}-list`
const root = useTemplateRef<HTMLElement>('root')
const input = useTemplateRef<HTMLInputElement>('input')
const dropdown = useTemplateRef<HTMLElement>('dropdown')

const text = ref(model.value?.label ?? '')
const open = ref(false)
const activeIndex = ref(-1)
const popoverStyle = ref<Record<string, string>>({})
const optionEls = new Map<number, HTMLElement>()

const finder = useLatestSearch(props.search, { delay: props.delay, minChars: props.minChars })
const { results, loading, error, settled } = finder

const activeId = computed(() => (activeIndex.value >= 0 ? `${uid}-opt-${activeIndex.value}` : undefined))
/** What the popover says when there are no options to show. */
const note = computed(() => {
  if (error.value) return error.value
  if (text.value.trim().length < props.minChars) return `Type at least ${props.minChars} characters`
  if (loading.value) return 'Searching…'
  return settled.value && !results.value.length ? 'Nothing found' : ''
})

watch(() => model.value, (m) => { text.value = m?.label ?? '' })
watch(results, () => { activeIndex.value = results.value.length ? 0 : -1; scrollActiveIntoView() })

function setOptionRef(el: unknown, index: number): void {
  if (el) optionEls.set(index, el as HTMLElement)
}
function scrollActiveIntoView(): void {
  void nextTick(() => optionEls.get(activeIndex.value)?.scrollIntoView?.({ block: 'nearest' }))
}
function positionPopover(): void {
  const box = input.value?.getBoundingClientRect()
  if (!box) return
  const viewport = window.innerHeight || document.documentElement.clientHeight
  const below = viewport - box.bottom
  const openUp = below < 220 && box.top > below
  const style: Record<string, string> = { position: 'fixed', left: `${Math.round(box.left)}px`, minWidth: `${Math.round(box.width)}px` }
  if (openUp) {
    style.bottom = `${Math.round(viewport - box.top + 4)}px`
    style.maxHeight = `${Math.round(Math.min(320, box.top - 16))}px`
  } else {
    style.top = `${Math.round(box.bottom + 4)}px`
    style.maxHeight = `${Math.round(Math.min(320, below - 16))}px`
  }
  popoverStyle.value = style
}
function onReposition(): void {
  if (open.value) positionPopover()
}
function show(): void {
  if (props.disabled || open.value) return
  open.value = true
  void nextTick(() => {
    positionPopover()
    window.addEventListener('scroll', onReposition, true)
    window.addEventListener('resize', onReposition)
  })
}
function hide(): void {
  open.value = false
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
}

function onType(event: Event): void {
  text.value = (event.target as HTMLInputElement).value
  show()
  finder.query(text.value)
}
function moveActive(delta: number): void {
  const n = results.value.length
  if (!n) return
  show()
  activeIndex.value = (activeIndex.value + delta + n) % n
  scrollActiveIntoView()
}
function pick(option: SearchSelectOption): void {
  model.value = option
  text.value = option.label
  finder.reset()
  hide()
}
function selectActive(): void {
  const o = results.value[activeIndex.value]
  if (o) pick(o)
}
function clear(): void {
  model.value = null
  text.value = ''
  finder.reset()
  hide()
  void nextTick(() => input.value?.focus())
}
function onEscape(): void {
  if (open.value) {
    hide()
    text.value = model.value?.label ?? ''   // abandon what was typed, keep the choice
    finder.reset()
  } else if (model.value) clear()
}
function onDocumentClick(event: MouseEvent): void {
  if (!open.value) return
  const target = event.target as Node
  if (!root.value?.contains(target) && !dropdown.value?.contains(target)) {
    hide()
    text.value = model.value?.label ?? ''
  }
}
onMounted(() => document.addEventListener('click', onDocumentClick, true))
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick, true)
  window.removeEventListener('scroll', onReposition, true)
  window.removeEventListener('resize', onReposition)
})
</script>

<template>
  <div ref="root" class="typeahead">
    <div class="typeahead-field">
      <input
        :id="id"
        ref="input"
        :value="text"
        type="text"
        class="form-input typeahead-input"
        :placeholder="placeholder"
        :disabled="disabled"
        :aria-label="label"
        role="combobox"
        aria-autocomplete="list"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="open ? listId : undefined"
        :aria-activedescendant="activeId"
        autocomplete="off"
        @input="onType"
        @focus="text.trim().length >= minChars && results.length && show()"
        @keydown.down.prevent="moveActive(1)"
        @keydown.up.prevent="moveActive(-1)"
        @keydown.enter="open && results.length && ($event.preventDefault(), selectActive())"
        @keydown.esc="onEscape"
      />
      <span v-if="loading" class="typeahead-busy" role="status" aria-label="Searching"><Icon name="refresh" :size="14" /></span>
      <button v-else-if="model && !disabled" type="button" class="typeahead-clear" :aria-label="label ? `Clear ${label.toLowerCase()}` : 'Clear'" @click="clear">
        <Icon name="x" :size="14" />
      </button>
    </div>

    <Teleport to="body">
      <div v-if="open" ref="dropdown" class="search-select-popover" :style="popoverStyle">
        <ul :id="listId" class="search-select-list" role="listbox" :aria-label="label">
          <li
            v-for="(o, i) in results"
            :id="`${uid}-opt-${i}`"
            :key="o.value"
            :ref="(el) => setOptionRef(el, i)"
            role="option"
            class="search-select-option"
            :class="{ 'is-active': i === activeIndex, 'is-selected': o.value === model?.value }"
            :aria-selected="o.value === model?.value ? 'true' : 'false'"
            @click="pick(o)"
            @mouseenter="activeIndex = i"
          >
            <span class="search-select-option-label">{{ o.label }}</span>
            <Icon v-if="o.value === model?.value" name="check" :size="14" />
          </li>
          <li v-if="note" class="search-select-empty" :class="{ 'is-error': error }" role="presentation">{{ note }}</li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>
