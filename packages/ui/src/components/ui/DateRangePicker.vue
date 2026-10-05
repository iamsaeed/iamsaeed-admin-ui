<script setup lang="ts">
/**
 * A date-range filter: one trigger, a panel of quick ranges, a calendar, typed dates.
 *
 * WHY IT EXISTS: every list that grows without bound needs "show me these days", and the first
 * consumer (SSB's Entries, 2026-10-05) built it from a <select> and two native date inputs. Those
 * follow the browser's locale rather than the app's (17/09 on one machine, 09/17 on the next),
 * ignore the theme, cannot show a span, and take four steps per range. Plan and the reasoning for
 * each feature: plans/2026-10-05-date-range-picker-plan.md.
 *
 * The model is a pair of `YYYY-MM-DD` strings (`v-model:from`, `v-model:to`), never `Date`s: that
 * is what list endpoints take and what URL state stores, and a calendar day has no timezone to get
 * wrong. Both ends are inclusive and either may be empty (an open-ended range).
 *
 * Desktop: a NON-modal popover under the trigger — the page stays reachable, so it does not claim
 * `aria-modal` and does not trap focus. Phone: a bottom sheet over a scrim, which IS modal, so it
 * traps focus (hard rule 8). Edits are a draft until Apply; a preset applies at once.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import Icon from './Icon.vue'
import { useFocusTrap } from '../../composables/useFocusTrap'
import { useBreakpoint } from '../../composables/useBreakpoint'
import {
  addDays,
  addMonths,
  dateOrderFor,
  defaultDatePresets,
  formatDayLong,
  formatRangeLabel,
  formatSpan,
  formatTyped,
  isIsoDay,
  matchPreset,
  monthMatrix,
  monthNames,
  parseTyped,
  relativeRange,
  spanDays,
  startOfMonth,
  toDate,
  todayIn,
  typedPlaceholder,
  weekdayNames,
  type DatePreset,
  type IsoDay,
  type RelativeUnit,
} from '../../utils/dateRange'

type View = 'days' | 'months' | 'years'

const props = withDefaults(
  defineProps<{
    /** Quick ranges. Defaults to `defaultDatePresets({ fiscalYearStart })`; `[]` hides the rail. */
    presets?: DatePreset[]
    /** Show the "Last N days/weeks/months/years" row. */
    relative?: boolean
    /** Earliest and latest selectable day, inclusive. */
    min?: IsoDay
    max?: IsoDay
    /** Block individual days (a holiday, a day with no data). */
    isDateDisabled?: (day: IsoDay) => boolean
    /** Longest allowed span in days, inclusive. */
    maxDays?: number
    /** 0 Sunday … 6 Saturday. */
    weekStartsOn?: number
    /** Names months and weekdays, formats labels, and sets the typed-date order (DD/MM vs MM/DD). */
    locale?: string
    /** What "today" means. Defaults to the browser's own zone. */
    timeZone?: string
    /** First month of the financial year, 1-based. April (4) for India. */
    fiscalYearStart?: number
    placeholder?: string
    /** Accessible name, prefixed to the value: "Decided: Last 7 days". */
    label?: string
    /** ‹ › on the trigger move the whole range by its own length. */
    shiftable?: boolean
    /** Emits hidden `name[from]` / `name[to]` inputs for a plain form post. */
    name?: string
    required?: boolean
    disabled?: boolean
    invalid?: boolean
    /** Shown under the trigger, as a form error. */
    error?: string
    /**
     * Which edge of the trigger the desktop panel lines up with. The panel flips to the other edge
     * on its own when the preferred one would run it off the screen.
     */
    align?: 'start' | 'end'
  }>(),
  {
    presets: undefined,
    relative: true,
    min: undefined,
    max: undefined,
    isDateDisabled: undefined,
    maxDays: undefined,
    weekStartsOn: 1,
    locale: 'en-IN',
    timeZone: undefined,
    fiscalYearStart: 4,
    placeholder: 'Any date',
    label: 'Dates',
    shiftable: false,
    name: undefined,
    required: false,
    disabled: false,
    invalid: false,
    error: '',
    align: 'start',
  },
)

const from = defineModel<string>('from', { default: '' })
const to = defineModel<string>('to', { default: '' })

const emit = defineEmits<{
  /** Once per applied change, with both ends — for a consumer that wants one event, not two. */
  change: [range: { from: string; to: string }]
}>()

defineSlots<{
  /** Extra content inside a day cell, under the number (a dot, a count). */
  day?: (props: { day: IsoDay; inRange: boolean; disabled: boolean }) => unknown
  /** Replaces the panel footer's left side (the typed dates). */
  footer?: (props: { from: string; to: string; apply: () => void; clear: () => void }) => unknown
}>()

const uid = `drp-${Math.random().toString(36).slice(2, 9)}`

/* ── environment ─────────────────────────────────────────────────────────── */

const isWide = useBreakpoint('md')
const isPhone = computed(() => !isWide.value)
const monthsShown = computed(() => (isPhone.value ? 1 : 2))
const today = computed(() => todayIn(props.timeZone))
const order = computed(() => dateOrderFor(props.locale))
const presetList = computed(() => props.presets ?? defaultDatePresets({ fiscalYearStart: props.fiscalYearStart }))
const weekdays = computed(() => weekdayNames(props.locale, props.weekStartsOn, 'short'))
const longMonths = computed(() => monthNames(props.locale, 'long'))
const shortMonths = computed(() => monthNames(props.locale, 'short'))

function blocked(day: IsoDay): boolean {
  if (props.min && day < props.min) return true
  if (props.max && day > props.max) return true
  return props.isDateDisabled?.(day) ?? false
}

/* ── state ───────────────────────────────────────────────────────────────── */

const open = ref(false)
const placement = ref<'start' | 'end'>(props.align)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLElement | null>(null)

const draftFrom = ref('')
const draftTo = ref('')
const picking = ref(false)
const hover = ref<IsoDay | null>(null)
const view = ref<View>('days')
/** First day of the first month on screen. */
const cursor = ref<IsoDay>(startOfMonth(today.value))
const yearPageStart = ref(0)
const focusDay = ref<IsoDay>(today.value)

const typedFrom = ref('')
const typedTo = ref('')
const typedFromError = ref('')
const typedToError = ref('')

const relN = ref(7)
const relUnit = ref<RelativeUnit>('days')

/* ── trigger ─────────────────────────────────────────────────────────────── */

const applied = computed(() => ({ from: from.value || '', to: to.value || '' }))
const hasValue = computed(() => !!(applied.value.from || applied.value.to))
const triggerLabel = computed(() =>
  formatRangeLabel(applied.value, {
    locale: props.locale,
    presets: presetList.value,
    today: today.value,
    placeholder: props.placeholder,
  }),
)
const triggerName = computed(() => `${props.label}: ${hasValue.value ? triggerLabel.value : props.placeholder}`)

const canShift = computed(() => props.shiftable && !!applied.value.from && !!applied.value.to && !props.disabled)
const shiftLength = computed(() => (canShift.value ? spanDays(applied.value.from, applied.value.to) : 0))
const canShiftBack = computed(() => {
  if (!canShift.value) return false
  return !props.min || addDays(applied.value.from, -shiftLength.value) >= props.min
})
const canShiftForward = computed(() => {
  if (!canShift.value) return false
  const limit = props.max
  return !limit || addDays(applied.value.from, shiftLength.value) <= limit
})

function commit(next: { from: string; to: string }) {
  from.value = next.from
  to.value = next.to
  emit('change', { from: next.from, to: next.to })
}

function shift(direction: -1 | 1) {
  if (direction === -1 ? !canShiftBack.value : !canShiftForward.value) return
  const n = shiftLength.value * direction
  let nextTo = addDays(applied.value.to, n)
  if (props.max && nextTo > props.max) nextTo = props.max
  commit({ from: addDays(applied.value.from, n), to: nextTo })
}

function clearApplied() {
  commit({ from: '', to: '' })
  trigger.value?.focus()
}

/* ── open / close ────────────────────────────────────────────────────────── */

function setDraft(nextFrom: string, nextTo: string) {
  draftFrom.value = nextFrom
  draftTo.value = nextTo
  typedFrom.value = formatTyped(nextFrom, order.value)
  typedTo.value = formatTyped(nextTo, order.value)
  typedFromError.value = ''
  typedToError.value = ''
  picking.value = false
  hover.value = null
}

/** Put a day's month on screen: in the first column, or the last when it is today's month. */
function reveal(day: IsoDay) {
  const month = startOfMonth(day)
  const last = addMonths(cursor.value, monthsShown.value - 1)
  if (month >= cursor.value && month <= last) return
  cursor.value = monthsShown.value > 1 && month >= startOfMonth(today.value) ? addMonths(month, -1) : month
}

async function openPanel() {
  if (props.disabled || open.value) return
  setDraft(applied.value.from, applied.value.to)
  view.value = 'days'
  const anchor = applied.value.from || applied.value.to || today.value
  cursor.value = startOfMonth(anchor)
  reveal(anchor)
  if (!applied.value.from && monthsShown.value > 1) cursor.value = addMonths(startOfMonth(today.value), -1)
  focusDay.value = anchor
  placement.value = props.align
  open.value = true
  await nextTick()
  fitToViewport()
  focusGridDay()
}

/*
 * A filter bar puts the picker wherever the row wraps it — often at the right end, where a panel
 * opening rightwards runs off the screen and drags the whole page sideways. Measure once on open
 * and line it up with whichever edge of the trigger keeps it on screen.
 */
const EDGE = 8
function fitToViewport() {
  if (isPhone.value || !panel.value) return
  const rect = panel.value.getBoundingClientRect()
  const width = document.documentElement.clientWidth || window.innerWidth
  if (placement.value === 'start' && rect.right > width - EDGE) placement.value = 'end'
  else if (placement.value === 'end' && rect.left < EDGE) placement.value = 'start'
}

function closePanel(restoreFocus = true) {
  if (!open.value) return
  open.value = false
  if (restoreFocus) trigger.value?.focus()
}

function toggle() {
  if (open.value) closePanel(false)
  else void openPanel()
}

/* ── the draft ───────────────────────────────────────────────────────────── */

const orderError = computed(() =>
  draftFrom.value && draftTo.value && draftFrom.value > draftTo.value ? 'The end date is before the start date.' : '',
)
const lengthError = computed(() => {
  if (!props.maxDays || !draftFrom.value || !draftTo.value || orderError.value) return ''
  return spanDays(draftFrom.value, draftTo.value) > props.maxDays ? `Choose ${props.maxDays} days or fewer.` : ''
})
const draftError = computed(() => typedFromError.value || typedToError.value || orderError.value || lengthError.value)
const canApply = computed(() => !picking.value && !draftError.value)
const spanText = computed(() =>
  draftFrom.value && draftTo.value && !draftError.value && !picking.value
    ? formatSpan(draftFrom.value, draftTo.value, props.locale)
    : '',
)

function apply() {
  if (!canApply.value) return
  commit({ from: draftFrom.value, to: draftTo.value })
  closePanel()
}

function clearDraft() {
  setDraft('', '')
}

function choosePreset(preset: DatePreset) {
  const range = preset.range(today.value)
  commit(range)
  closePanel()
}

const activePresetKey = computed(() => {
  if (picking.value) return null
  return matchPreset({ from: draftFrom.value, to: draftTo.value }, presetList.value, today.value)?.key ?? null
})

function applyRelative() {
  const range = relativeRange(Number(relN.value) || 1, relUnit.value, today.value)
  const nextFrom = props.min && range.from < props.min ? props.min : range.from
  const nextTo = props.max && range.to > props.max ? props.max : range.to
  setDraft(nextFrom, nextTo)
  view.value = 'days'
  focusDay.value = nextFrom
  reveal(nextFrom)
}

/* ── days ────────────────────────────────────────────────────────────────── */

/** The range as it should be drawn right now, including the hover preview while picking. */
const shown = computed(() => {
  let lo = draftFrom.value
  let hi = picking.value ? hover.value ?? '' : draftTo.value
  if (lo && hi && hi < lo) [lo, hi] = [hi, lo]
  return { lo, hi }
})

interface DayCell {
  day: IsoDay | null
  label: string
  name: string
  disabled: boolean
  isStart: boolean
  isEnd: boolean
  inRange: boolean
  isToday: boolean
}

const calendars = computed(() =>
  Array.from({ length: monthsShown.value }, (_, i) => {
    const first = addMonths(cursor.value, i)
    const d = toDate(first)
    const { lo, hi } = shown.value
    return {
      key: first,
      year: d.getFullYear(),
      month: d.getMonth(),
      title: `${longMonths.value[d.getMonth()]} ${d.getFullYear()}`,
      weeks: monthMatrix(d.getFullYear(), d.getMonth(), props.weekStartsOn).map((week) =>
        week.map<DayCell>((day) => {
          if (!day) return { day: null, label: '', name: '', disabled: true, isStart: false, isEnd: false, inRange: false, isToday: false }
          const disabled = blocked(day)
          return {
            day,
            label: String(Number(day.slice(8))),
            name: formatDayLong(day, props.locale) + (disabled ? ', unavailable' : ''),
            disabled,
            isStart: !!lo && day === lo,
            isEnd: !!hi && day === hi,
            inRange: !!lo && !!hi && day >= lo && day <= hi,
            isToday: day === today.value,
          }
        }),
      ),
    }
  }),
)

/** The one day in the grid that takes Tab: the focused day if it is on screen, else the first. */
const tabDay = computed(() => {
  const visible = calendars.value.flatMap((c) => c.weeks.flat()).filter((c) => c.day && !c.disabled)
  return visible.find((c) => c.day === focusDay.value)?.day ?? visible[0]?.day ?? null
})

function pickDay(day: IsoDay) {
  if (blocked(day)) return
  focusDay.value = day
  if (!picking.value) {
    draftFrom.value = day
    draftTo.value = ''
    picking.value = true
    hover.value = null
  } else {
    const [a, b] = day < draftFrom.value ? [day, draftFrom.value] : [draftFrom.value, day]
    draftFrom.value = a
    draftTo.value = b
    picking.value = false
    hover.value = null
  }
  typedFrom.value = formatTyped(draftFrom.value, order.value)
  typedTo.value = formatTyped(draftTo.value, order.value)
  typedFromError.value = ''
  typedToError.value = ''
}

function hoverDay(day: IsoDay) {
  if (picking.value && !blocked(day)) hover.value = day
}

function stepMonth(n: number) {
  cursor.value = addMonths(cursor.value, n)
}

const canGoBack = computed(() => !props.min || addMonths(cursor.value, -1) >= startOfMonth(props.min))
const canGoForward = computed(() => !props.max || addMonths(cursor.value, monthsShown.value) <= startOfMonth(props.max))

async function focusGridDay() {
  await nextTick()
  const el = panel.value?.querySelector<HTMLButtonElement>(`[data-day="${tabDay.value}"]`)
  el?.focus()
}

/** The WAI-ARIA grid keyboard map. One tab stop; arrows move the focused day. */
function onGridKeydown(event: KeyboardEvent) {
  const moves: Record<string, () => IsoDay> = {
    ArrowLeft: () => addDays(focusDay.value, -1),
    ArrowRight: () => addDays(focusDay.value, 1),
    ArrowUp: () => addDays(focusDay.value, -7),
    ArrowDown: () => addDays(focusDay.value, 7),
    PageUp: () => addMonths(focusDay.value, event.shiftKey ? -12 : -1),
    PageDown: () => addMonths(focusDay.value, event.shiftKey ? 12 : 1),
    Home: () => addDays(focusDay.value, -((toDate(focusDay.value).getDay() - props.weekStartsOn + 7) % 7)),
    End: () => addDays(focusDay.value, 6 - ((toDate(focusDay.value).getDay() - props.weekStartsOn + 7) % 7)),
  }
  const move = moves[event.key]
  if (!move) return
  event.preventDefault()
  let next = move()
  if (props.min && next < props.min) next = props.min
  if (props.max && next > props.max) next = props.max
  focusDay.value = next
  reveal(next)
  hoverDay(next)
  void focusGridDay()
}

/* ── months and years ────────────────────────────────────────────────────── */

const viewYear = ref(toDate(today.value).getFullYear())

function openMonths(year: number) {
  viewYear.value = year
  view.value = 'months'
}

function openYears() {
  yearPageStart.value = viewYear.value - (viewYear.value % 12)
  view.value = 'years'
}

const minYear = computed(() => (props.min ? Number(props.min.slice(0, 4)) : -Infinity))
const maxYear = computed(() => (props.max ? Number(props.max.slice(0, 4)) : Infinity))

const monthCells = computed(() =>
  shortMonths.value.map((label, m) => {
    const first = `${viewYear.value}-${String(m + 1).padStart(2, '0')}-01`
    const last = addDays(addMonths(first, 1), -1)
    const outside = (props.max && first > props.max) || (props.min && last < props.min)
    const { lo, hi } = shown.value
    return {
      m,
      label,
      name: `${longMonths.value[m]} ${viewYear.value}`,
      disabled: !!outside,
      current: first === startOfMonth(today.value),
      inRange: !!lo && !!hi && first <= hi && last >= lo,
    }
  }),
)

const yearCells = computed(() =>
  Array.from({ length: 12 }, (_, i) => {
    const year = yearPageStart.value + i
    const { lo, hi } = shown.value
    return {
      year,
      disabled: year < minYear.value || year > maxYear.value,
      current: year === toDate(today.value).getFullYear(),
      inRange: !!lo && !!hi && String(year) >= lo.slice(0, 4) && String(year) <= hi.slice(0, 4),
    }
  }),
)

function chooseMonth(m: number) {
  const first = `${viewYear.value}-${String(m + 1).padStart(2, '0')}-01`
  cursor.value = first
  focusDay.value = props.max && first > props.max ? props.max : first
  view.value = 'days'
  void focusGridDay()
}

function chooseYear(year: number) {
  openMonths(year)
}

/* ── typed dates ─────────────────────────────────────────────────────────── */

const typedPattern = computed(() => typedPlaceholder(order.value))

function readTyped(which: 'from' | 'to', value: string, final: boolean) {
  const errorRef = which === 'from' ? typedFromError : typedToError
  const draftRef = which === 'from' ? draftFrom : draftTo
  if (which === 'from') typedFrom.value = value
  else typedTo.value = value

  if (!value.trim()) {
    draftRef.value = ''
    errorRef.value = ''
    return
  }
  const day = parseTyped(value, order.value)
  if (!day) {
    // Only complain once the person has typed enough to be wrong, or has left the field.
    errorRef.value = final || value.replace(/\D/g, '').length >= 8 ? `Enter a real date as ${typedPattern.value}.` : ''
    if (final) draftRef.value = ''
    return
  }
  if (props.min && day < props.min) {
    errorRef.value = `Choose a date on or after ${formatTyped(props.min, order.value)}.`
    return
  }
  if (props.max && day > props.max) {
    errorRef.value = `Choose a date on or before ${formatTyped(props.max, order.value)}.`
    return
  }
  if (props.isDateDisabled?.(day)) {
    errorRef.value = 'That date cannot be chosen.'
    return
  }
  errorRef.value = ''
  draftRef.value = day
  picking.value = false
  hover.value = null
  focusDay.value = day
  view.value = 'days'
  reveal(day)
}

/* ── document listeners ──────────────────────────────────────────────────── */

useFocusTrap(computed(() => open.value && isPhone.value), panel)

function onDocumentKeydown(event: KeyboardEvent) {
  if (!open.value || event.key !== 'Escape') return
  event.preventDefault()
  // Escape steps back out of the month and year views before it closes the panel.
  if (view.value !== 'days') {
    view.value = 'days'
    void focusGridDay()
    return
  }
  closePanel()
}

/* Pointerdown rather than click, so the panel is gone before whatever was clicked reacts. */
function onDocumentPointerDown(event: Event) {
  if (!open.value || isPhone.value) return
  const target = event.target as Node
  if (root.value?.contains(target) || panel.value?.contains(target)) return
  closePanel(false)
}

onMounted(() => {
  document.addEventListener('keydown', onDocumentKeydown)
  document.addEventListener('pointerdown', onDocumentPointerDown)
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onDocumentKeydown)
  document.removeEventListener('pointerdown', onDocumentPointerDown)
})

/* A model changed from outside (a Reset button, the URL) while open replaces the draft. */
watch([from, to], () => {
  if (open.value) setDraft(applied.value.from, applied.value.to)
})

/* Values from a URL are not trusted to be days: a malformed one is treated as unset. */
watch(
  [from, to],
  ([f, t]) => {
    if (f && !isIsoDay(f)) from.value = ''
    if (t && !isIsoDay(t)) to.value = ''
  },
  { immediate: true },
)

defineExpose({ open: openPanel, close: closePanel })
</script>

<template>
  <div ref="root" class="daterange" :class="{ 'is-open': open, 'is-invalid': invalid || !!error }">
    <div class="daterange-trigger" :class="{ 'is-disabled': disabled }">
      <button
        v-if="canShift"
        type="button"
        class="daterange-shift"
        :disabled="!canShiftBack"
        @click="shift(-1)"
      >
        <Icon name="chevron-left" :size="14" label="Move the range back" />
      </button>
      <button
        :id="`${uid}-trigger`"
        ref="trigger"
        type="button"
        class="daterange-button"
        :class="{ 'is-empty': !hasValue }"
        aria-haspopup="dialog"
        :aria-expanded="open"
        :aria-controls="open ? `${uid}-panel` : undefined"
        :aria-label="triggerName"
        :aria-invalid="invalid || !!error ? 'true' : undefined"
        :aria-describedby="error ? `${uid}-error` : undefined"
        :disabled="disabled"
        @click="toggle"
      >
        <Icon name="calendar" :size="15" />
        <span class="daterange-value">{{ hasValue ? triggerLabel : placeholder }}</span>
      </button>
      <button
        v-if="hasValue && !disabled && !required"
        type="button"
        class="daterange-clear"
        @click="clearApplied"
      >
        <Icon name="x" :size="14" label="Clear the dates" />
      </button>
      <button
        v-if="canShift"
        type="button"
        class="daterange-shift"
        :disabled="!canShiftForward"
        @click="shift(1)"
      >
        <Icon name="chevron-right" :size="14" label="Move the range forward" />
      </button>
    </div>

    <p v-if="error" :id="`${uid}-error`" class="form-error">{{ error }}</p>

    <template v-if="name">
      <input type="hidden" :name="`${name}[from]`" :value="applied.from" />
      <input type="hidden" :name="`${name}[to]`" :value="applied.to" />
    </template>

    <Teleport to="body" :disabled="!isPhone">
      <div v-if="open && isPhone" class="scrim" @click="closePanel()" />
      <div
        v-if="open"
        :id="`${uid}-panel`"
        ref="panel"
        role="dialog"
        :aria-modal="isPhone ? 'true' : undefined"
        :aria-label="`Choose ${label.toLowerCase()}`"
        class="daterange-panel"
        :class="isPhone ? 'modal daterange-sheet' : ['daterange-popover', `is-align-${placement}`]"
      >
        <div v-if="isPhone" class="modal-handle" />
        <div v-if="isPhone" class="daterange-sheet-hd">
          <span class="card-title">{{ label }}</span>
          <button type="button" class="btn btn-ghost btn-icon btn-sm" @click="closePanel()">
            <Icon name="x" :size="16" label="Close" />
          </button>
        </div>

        <aside v-if="presetList.length || relative" class="daterange-side">
          <div v-if="presetList.length" class="daterange-presets" role="listbox" aria-label="Quick ranges">
            <button
              v-for="preset in presetList"
              :key="preset.key"
              type="button"
              role="option"
              class="daterange-preset"
              :aria-selected="activePresetKey === preset.key"
              @click="choosePreset(preset)"
            >
              {{ preset.label }}
            </button>
          </div>

          <form v-if="relative" class="daterange-relative" @submit.prevent="applyRelative">
            <span class="daterange-relative-label">Last</span>
            <div class="daterange-relative-row">
              <input
                v-model.number="relN"
                class="form-input daterange-relative-n"
                type="number"
                min="1"
                inputmode="numeric"
                aria-label="How many"
              />
              <select v-model="relUnit" class="form-select" aria-label="Unit">
                <option value="days">days</option>
                <option value="weeks">weeks</option>
                <option value="months">months</option>
                <option value="years">years</option>
              </select>
            </div>
            <button type="submit" class="btn btn-secondary btn-sm">Show these dates</button>
          </form>
        </aside>

        <div class="daterange-main">
          <!-- Days -->
          <div v-if="view === 'days'" class="daterange-months" @keydown="onGridKeydown">
            <div v-for="(cal, i) in calendars" :key="cal.key" class="daterange-month">
              <div class="daterange-head">
                <button
                  type="button"
                  class="daterange-nav"
                  :class="{ 'is-hidden': i !== 0 }"
                  :disabled="!canGoBack"
                  :tabindex="i !== 0 ? -1 : undefined"
                  @click="stepMonth(-1)"
                >
                  <Icon name="chevron-left" :size="16" label="Previous month" />
                </button>
                <button
                  type="button"
                  class="daterange-title"
                  :aria-label="`${cal.title}, choose a month`"
                  @click="openMonths(cal.year)"
                >
                  {{ cal.title }}
                  <Icon name="chevron-down" :size="14" />
                </button>
                <button
                  type="button"
                  class="daterange-nav"
                  :class="{ 'is-hidden': i !== calendars.length - 1 }"
                  :disabled="!canGoForward"
                  :tabindex="i !== calendars.length - 1 ? -1 : undefined"
                  @click="stepMonth(1)"
                >
                  <Icon name="chevron-right" :size="16" label="Next month" />
                </button>
              </div>

              <table class="daterange-grid" role="grid" :aria-label="cal.title">
                <thead>
                  <tr>
                    <th v-for="w in weekdays" :key="w" scope="col" class="daterange-weekday" :abbr="w">{{ w }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(week, wi) in cal.weeks" :key="wi">
                    <td
                      v-for="(cell, di) in week"
                      :key="di"
                      class="daterange-cell"
                      :class="{
                        'is-in-range': cell.inRange && !(cell.isStart && cell.isEnd),
                        'is-start': cell.isStart && !cell.isEnd,
                        'is-end': cell.isEnd && !cell.isStart,
                      }"
                      :aria-selected="cell.day ? cell.inRange || cell.isStart : undefined"
                    >
                      <button
                        v-if="cell.day"
                        type="button"
                        class="daterange-day"
                        :class="{ 'is-endpoint': cell.isStart || cell.isEnd, 'is-today': cell.isToday }"
                        :data-day="cell.day"
                        :tabindex="cell.day === tabDay ? 0 : -1"
                        :aria-label="cell.name"
                        :aria-current="cell.isToday ? 'date' : undefined"
                        :disabled="cell.disabled"
                        @click="pickDay(cell.day)"
                        @mouseenter="hoverDay(cell.day)"
                        @focus="focusDay = cell.day"
                      >
                        {{ cell.label }}
                        <slot name="day" :day="cell.day" :in-range="cell.inRange" :disabled="cell.disabled" />
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Months -->
          <div v-else-if="view === 'months'" class="daterange-picker">
            <div class="daterange-head">
              <button type="button" class="daterange-nav" :disabled="viewYear - 1 < minYear" @click="viewYear--">
                <Icon name="chevron-left" :size="16" label="Previous year" />
              </button>
              <button type="button" class="daterange-title" :aria-label="`${viewYear}, choose a year`" @click="openYears">
                {{ viewYear }}
                <Icon name="chevron-down" :size="14" />
              </button>
              <button type="button" class="daterange-nav" :disabled="viewYear + 1 > maxYear" @click="viewYear++">
                <Icon name="chevron-right" :size="16" label="Next year" />
              </button>
            </div>
            <div class="daterange-picks" role="group" :aria-label="`Months of ${viewYear}`">
              <button
                v-for="cell in monthCells"
                :key="cell.m"
                type="button"
                class="daterange-pick"
                :class="{ 'is-current': cell.current, 'is-in-range': cell.inRange }"
                :aria-label="cell.name"
                :disabled="cell.disabled"
                @click="chooseMonth(cell.m)"
              >
                {{ cell.label }}
              </button>
            </div>
          </div>

          <!-- Years -->
          <div v-else class="daterange-picker">
            <div class="daterange-head">
              <button
                type="button"
                class="daterange-nav"
                :disabled="yearPageStart - 1 < minYear"
                @click="yearPageStart -= 12"
              >
                <Icon name="chevron-left" :size="16" label="Earlier years" />
              </button>
              <span class="daterange-title is-static">{{ yearPageStart }} – {{ yearPageStart + 11 }}</span>
              <button
                type="button"
                class="daterange-nav"
                :disabled="yearPageStart + 12 > maxYear"
                @click="yearPageStart += 12"
              >
                <Icon name="chevron-right" :size="16" label="Later years" />
              </button>
            </div>
            <div class="daterange-picks" role="group" aria-label="Years">
              <button
                v-for="cell in yearCells"
                :key="cell.year"
                type="button"
                class="daterange-pick"
                :class="{ 'is-current': cell.current, 'is-in-range': cell.inRange }"
                :disabled="cell.disabled"
                @click="chooseYear(cell.year)"
              >
                {{ cell.year }}
              </button>
            </div>
          </div>

          <div class="daterange-footer">
            <div class="daterange-footer-row">
              <slot name="footer" :from="draftFrom" :to="draftTo" :apply="apply" :clear="clearDraft">
                <div class="daterange-fields">
                  <label class="daterange-field">
                    <span>From</span>
                    <input
                      class="form-input"
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      :placeholder="typedPattern"
                      :value="typedFrom"
                      :aria-invalid="typedFromError || orderError ? 'true' : undefined"
                      :aria-describedby="draftError ? `${uid}-draft-error` : undefined"
                      @input="readTyped('from', ($event.target as HTMLInputElement).value, false)"
                      @change="readTyped('from', ($event.target as HTMLInputElement).value, true)"
                      @keydown.enter.prevent="readTyped('from', ($event.target as HTMLInputElement).value, true)"
                    />
                  </label>
                  <Icon name="arrow-right" :size="14" class="daterange-fields-arrow" />
                  <label class="daterange-field">
                    <span>To</span>
                    <input
                      class="form-input"
                      type="text"
                      inputmode="numeric"
                      autocomplete="off"
                      :placeholder="typedPattern"
                      :value="typedTo"
                      :aria-invalid="typedToError || orderError || lengthError ? 'true' : undefined"
                      :aria-describedby="draftError ? `${uid}-draft-error` : undefined"
                      @input="readTyped('to', ($event.target as HTMLInputElement).value, false)"
                      @change="readTyped('to', ($event.target as HTMLInputElement).value, true)"
                      @keydown.enter.prevent="readTyped('to', ($event.target as HTMLInputElement).value, true)"
                    />
                  </label>
                </div>
              </slot>
              <div class="daterange-actions">
                <button type="button" class="btn btn-secondary btn-sm" @click="clearDraft">Clear</button>
                <button type="button" class="btn btn-primary btn-sm" :disabled="!canApply" @click="apply">Apply</button>
              </div>
            </div>
            <p v-if="draftError" :id="`${uid}-draft-error`" class="form-error daterange-note" role="alert">{{ draftError }}</p>
            <p v-else-if="picking" class="daterange-note">Now choose the last day.</p>
            <p v-else-if="spanText" class="daterange-note">{{ spanText }}</p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
