<script setup lang="ts">
/**
 * A phone number with a country: a flag + calling-code button that opens a searchable country
 * list, beside the number itself. Ported from the CodeWithUs website's PhoneField (2026-10-13) so
 * every product enters numbers the same way.
 *
 * Two models: `v-model` is the NATIONAL digits as typed, `v-model:countryCode` is the ISO code.
 * Typing a full international number ("+91 98…") switches the country to match and drops the
 * calling code from the digits. `toE164` / `fromE164` in `utils/phone` turn the pair into the one
 * string a backend stores, and back.
 *
 * The list is a NON-modal popover (the page stays reachable), so it does not claim `aria-modal`
 * and does not trap focus; it is teleported to <body> so a clipping ancestor cannot hide it.
 * Flags are real sprites from `flag-icons`, not emoji (Windows draws emoji flags as letters):
 * import `@iamsaeed/admin-ui/phone.css` once to load them.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, useTemplateRef, watch } from 'vue'
import Icon from './Icon.vue'
import { phoneCountry, readTypedPhone, searchCountries, type PhoneCountry } from '../../utils/phone'

type ListItem =
  | { type: 'heading'; label: string }
  | { type: 'divider' }
  | { type: 'country'; country: PhoneCountry }

const props = withDefaults(
  defineProps<{
    id?: string
    placeholder?: string
    disabled?: boolean
    required?: boolean
    /** Shown under the field, as a form error. */
    error?: string
    /** Marks the field invalid without a message. */
    invalid?: boolean
    /** Countries pinned to the top under a "Preferred" heading. */
    preferredCountries?: string[]
    /** Accessible name of the number box when there is no <label for>. */
    label?: string
  }>(),
  {
    id: undefined,
    placeholder: 'Phone number',
    disabled: false,
    required: false,
    error: '',
    invalid: false,
    preferredCountries: () => ['US', 'GB', 'CA', 'IN'],
    label: undefined,
  },
)

/** The national digits. */
const number = defineModel<string>({ default: '' })
/** ISO 3166-1 alpha-2. */
const countryCode = defineModel<string>('countryCode', { default: 'US' })

const uid = useId()
const listId = `${uid}-list`

const root = useTemplateRef<HTMLElement>('root')
const field = useTemplateRef<HTMLElement>('field')
const trigger = useTemplateRef<HTMLButtonElement>('trigger')
const dropdown = useTemplateRef<HTMLElement>('dropdown')
const searchInput = useTemplateRef<HTMLInputElement>('searchInput')

const open = ref(false)
const search = ref('')
const activeIndex = ref(-1)
const popoverStyle = ref<Record<string, string>>({})
const optionEls = new Map<number, HTMLElement>()

const selected = computed(() => phoneCountry(countryCode.value))
const flagClass = computed(() => (selected.value ? `fi fi-${selected.value.iso.toLowerCase()}` : ''))
const calling = computed(() => (selected.value ? `+${selected.value.dialCode}` : ''))
const isInvalid = computed(() => props.invalid || props.error !== '')

const filtered = computed(() => searchCountries(search.value))

const displayList = computed<ListItem[]>(() => {
  if (search.value.trim()) return filtered.value.map((country) => ({ type: 'country', country }))
  const list: ListItem[] = []
  const preferred = props.preferredCountries
    .map((iso) => phoneCountry(iso))
    .filter((country): country is PhoneCountry => Boolean(country))
  if (preferred.length) {
    list.push({ type: 'heading', label: 'Preferred' })
    preferred.forEach((country) => list.push({ type: 'country', country }))
    list.push({ type: 'divider' })
  }
  filtered.value.forEach((country) => list.push({ type: 'country', country }))
  return list
})

const activeId = computed(() => (activeIndex.value >= 0 ? `${uid}-opt-${activeIndex.value}` : undefined))

function onNumber(event: Event): void {
  const next = readTypedPhone((event.target as HTMLInputElement).value, countryCode.value)
  if (next.iso !== countryCode.value) countryCode.value = next.iso
  number.value = next.national
  // The input is controlled; when the calling code was stripped, put the shortened digits back.
  ;(event.target as HTMLInputElement).value = next.national
}

function firstCountryIndex(): number {
  const current = displayList.value.findIndex((item) => item.type === 'country' && item.country.iso === countryCode.value)
  return current >= 0 ? current : displayList.value.findIndex((item) => item.type === 'country')
}

function setOptionRef(el: unknown, index: number): void {
  if (el) optionEls.set(index, el as HTMLElement)
}

function scrollActiveIntoView(): void {
  void nextTick(() => optionEls.get(activeIndex.value)?.scrollIntoView?.({ block: 'nearest' }))
}

function positionPopover(): void {
  const box = field.value?.getBoundingClientRect()
  if (!box) return
  const viewport = window.innerHeight || document.documentElement.clientHeight
  const desired = 320
  const below = viewport - box.bottom
  const above = box.top
  const openUp = below < Math.min(desired, 280) && above > below
  const style: Record<string, string> = {
    position: 'fixed',
    left: `${Math.round(box.left)}px`,
    width: `${Math.round(box.width)}px`,
  }
  if (openUp) {
    style.bottom = `${Math.round(viewport - box.top + 8)}px`
    style.maxHeight = `${Math.round(Math.min(desired, above - 16))}px`
  } else {
    style.top = `${Math.round(box.bottom + 8)}px`
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
  activeIndex.value = firstCountryIndex()
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
  const positions = displayList.value.map((item, index) => (item.type === 'country' ? index : -1)).filter((index) => index >= 0)
  if (!positions.length) return
  const current = positions.indexOf(activeIndex.value)
  const next = current === -1 ? 0 : (current + delta + positions.length) % positions.length
  activeIndex.value = positions[next] ?? activeIndex.value
  scrollActiveIntoView()
}

function pick(iso: string): void {
  countryCode.value = iso
  close(true)
}

function selectActive(): void {
  const item = displayList.value[activeIndex.value]
  if (item && item.type === 'country') pick(item.country.iso)
}

function onDocumentClick(event: MouseEvent): void {
  if (!open.value) return
  const target = event.target as Node
  if (!root.value?.contains(target) && !dropdown.value?.contains(target)) close()
}

watch(search, () => {
  activeIndex.value = firstCountryIndex()
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
  <div ref="root" class="phone-input">
    <div ref="field" class="phone-field" :class="{ 'is-invalid': isInvalid, 'is-disabled': disabled }">
      <button
        ref="trigger"
        type="button"
        class="phone-country"
        :disabled="disabled"
        aria-haspopup="listbox"
        :aria-expanded="open ? 'true' : 'false'"
        :aria-controls="open ? listId : undefined"
        :aria-label="`Country: ${selected?.name ?? 'none'} ${calling}`.trim()"
        @click="toggle"
        @keydown.down.prevent="openList"
      >
        <span v-if="flagClass" :class="flagClass" class="phone-flag" aria-hidden="true"></span>
        <Icon v-else name="search" :size="14" />
        <span class="phone-calling">{{ calling }}</span>
        <Icon name="chevron-down" :size="14" class="phone-chevron" :class="{ 'is-open': open }" />
      </button>

      <input
        :id="id"
        :value="number"
        type="tel"
        inputmode="tel"
        autocomplete="tel-national"
        class="phone-number"
        :placeholder="placeholder"
        :disabled="disabled"
        :required="required"
        :aria-label="label"
        :aria-invalid="isInvalid ? 'true' : undefined"
        @input="onNumber"
      />
    </div>

    <p v-if="error" class="form-error">{{ error }}</p>

    <Teleport to="body">
      <div v-if="open" ref="dropdown" class="phone-popover" :style="popoverStyle">
        <div class="phone-search">
          <Icon name="search" :size="16" />
          <input
            ref="searchInput"
            v-model="search"
            type="text"
            class="phone-search-input"
            placeholder="Search country"
            aria-label="Search country"
            role="combobox"
            aria-expanded="true"
            :aria-controls="listId"
            :aria-activedescendant="activeId"
            @keydown.down.prevent="moveActive(1)"
            @keydown.up.prevent="moveActive(-1)"
            @keydown.enter.prevent="selectActive"
            @keydown.esc.prevent="close(true)"
          />
        </div>

        <ul :id="listId" class="phone-list" role="listbox" aria-label="Countries">
          <template v-for="(item, i) in displayList" :key="i">
            <li v-if="item.type === 'heading'" class="phone-heading" role="presentation">{{ item.label }}</li>
            <li v-else-if="item.type === 'divider'" class="phone-divider" role="separator"></li>
            <li
              v-else
              :id="`${uid}-opt-${i}`"
              :ref="(el) => setOptionRef(el, i)"
              role="option"
              class="phone-option"
              :class="{ 'is-active': i === activeIndex, 'is-selected': item.country.iso === countryCode }"
              :aria-selected="item.country.iso === countryCode ? 'true' : 'false'"
              @click="pick(item.country.iso)"
              @mouseenter="activeIndex = i"
            >
              <span :class="`fi fi-${item.country.iso.toLowerCase()}`" class="phone-flag" aria-hidden="true"></span>
              <span class="phone-option-name">{{ item.country.name }}</span>
              <span class="phone-option-dial">+{{ item.country.dialCode }}</span>
            </li>
          </template>
          <li v-if="!displayList.length" class="phone-empty" role="presentation">No countries found</li>
        </ul>
      </div>
    </Teleport>
  </div>
</template>
