<script setup lang="ts">
/**
 * One dialog for the three things an admin panel actually asks: confirm something, collect a short
 * answer, or show a form.
 *
 * WHY IT EXISTS: this library shipped `.modal` styles and no component, so every consumer either
 * hand-rolled the markup — scrim, Teleport, handle, header, body, footer, five times over, as the
 * Overlays guide itself did — or gave up and called `window.prompt`. The browser's own dialogs
 * cannot be styled, ignore the theme, and freeze the page while they are open.
 *
 * Hand-rolled copies also drop the parts that are invisible until someone needs them: none of them
 * trapped focus or closed on Escape, while still claiming `aria-modal="true"`. That attribute tells
 * a screen reader everything behind is inert; if Tab walks out into the page, the promise is a lie.
 * `useFocusTrap` and the Escape handler are wired in here so a consumer cannot forget them.
 */
import { computed, nextTick, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import Icon from './Icon.vue'
import { useFocusTrap } from '../../composables/useFocusTrap'

type DialogMode = 'plain' | 'confirm' | 'prompt'
type DialogTone = 'primary' | 'danger'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    description?: string
    /** `confirm` asks yes/no, `prompt` collects a line of text, `plain` renders the default slot. */
    mode?: DialogMode
    /** `danger` for anything destructive; it colours the confirming button only. */
    tone?: DialogTone
    confirmLabel?: string
    cancelLabel?: string
    /** Work is in flight: the dialog stays put and cannot be dismissed by accident. */
    busy?: boolean
    /** A message from the server, shown above the content exactly as it was given. */
    error?: string
    /* ── prompt only ─────────────────────────────────────────────────────── */
    label?: string
    placeholder?: string
    hint?: string
    initialValue?: string
    multiline?: boolean
    minLength?: number
    maxLength?: number
  }>(),
  {
    mode: 'plain',
    tone: 'primary',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    busy: false,
    error: '',
    label: '',
    placeholder: '',
    hint: '',
    initialValue: '',
    multiline: false,
    minLength: 0,
    maxLength: 255,
  },
)

const emit = defineEmits<{
  /** The text for a prompt; nothing for a confirm. */
  confirm: [value: string]
  close: []
}>()

const panel = ref<HTMLElement | null>(null)
const field = ref<HTMLInputElement | HTMLTextAreaElement | null>(null)
const value = ref(props.initialValue)
const touched = ref(false)

useFocusTrap(toRef(props, 'open'), panel, {
  /* The text box, not the close button: a prompt that opens with focus on "×" makes the
     person Tab to the one control they came here to use. */
  initialFocus: () => field.value,
})

const isPrompt = computed(() => props.mode === 'prompt')

/* A confirm is an alertdialog: it interrupts to ask something whose answer matters. A form is
   an ordinary dialog. Screen readers announce the two differently, so the distinction is not
   cosmetic. */
const role = computed(() => (props.mode === 'confirm' ? 'alertdialog' : 'dialog'))

const tooShort = computed(
  () => isPrompt.value && value.value.trim().length < props.minLength,
)

const titleId = `dlg-title-${Math.random().toString(36).slice(2, 9)}`
const fieldId = `${titleId}-field`
const hintId = `${titleId}-hint`

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    value.value = props.initialValue
    touched.value = false
    await nextTick()
  },
)

function close() {
  if (!props.busy) emit('close')
}

function submit() {
  touched.value = true
  if (props.busy || tooShort.value) return
  emit('confirm', value.value.trim())
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) close()
}

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-(--lm-dur) ease-(--lm-ease)"
      leave-active-class="transition-opacity duration-(--lm-dur) ease-(--lm-ease)"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div v-if="open" class="scrim" @click="close" />
    </Transition>

    <Transition
      enter-active-class="transition-transform duration-(--lm-dur) ease-(--lm-ease)"
      leave-active-class="transition-transform duration-(--lm-dur) ease-(--lm-ease)"
      enter-from-class="translate-y-full sm:translate-y-0"
      leave-to-class="translate-y-full sm:translate-y-0"
    >
      <div v-if="open" ref="panel" class="modal" :role="role" aria-modal="true" :aria-labelledby="titleId">
        <div class="modal-handle" />

        <div class="modal-hd flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div :id="titleId" class="card-title">{{ title }}</div>
            <div v-if="description" class="card-sub">{{ description }}</div>
          </div>
          <button
            type="button"
            class="btn btn-ghost btn-icon btn-sm shrink-0"
            :disabled="busy"
            @click="close"
          >
            <Icon name="x" label="Close" :size="15" />
          </button>
        </div>

        <div class="modal-body flex flex-col gap-3">
          <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

          <form v-if="isPrompt" :id="`${titleId}-form`" class="form-group" @submit.prevent="submit">
            <label v-if="label" class="form-label" :for="fieldId">{{ label }}</label>
            <textarea
              v-if="multiline"
              :id="fieldId"
              ref="field"
              v-model="value"
              class="form-textarea"
              rows="3"
              :placeholder="placeholder"
              :maxlength="maxLength"
              :aria-describedby="hint ? hintId : undefined"
              :aria-invalid="touched && tooShort ? 'true' : undefined"
              @blur="touched = true"
            />
            <input
              v-else
              :id="fieldId"
              ref="field"
              v-model="value"
              type="text"
              class="form-input"
              :placeholder="placeholder"
              :maxlength="maxLength"
              :aria-describedby="hint ? hintId : undefined"
              :aria-invalid="touched && tooShort ? 'true' : undefined"
              @blur="touched = true"
            />
            <p v-if="touched && tooShort" class="form-error">
              Please write at least {{ minLength }} characters.
            </p>
            <p v-else-if="hint" :id="hintId" class="form-hint">{{ hint }}</p>
          </form>

          <slot />
        </div>

        <div class="modal-ft">
          <slot name="actions">
            <button type="button" class="btn btn-secondary" :disabled="busy" @click="close">
              {{ cancelLabel }}
            </button>
            <button
              :type="isPrompt ? 'submit' : 'button'"
              :form="isPrompt ? `${titleId}-form` : undefined"
              class="btn"
              :class="tone === 'danger' ? 'btn-danger' : 'btn-primary'"
              :disabled="busy"
              @click="isPrompt ? undefined : submit()"
            >
              {{ confirmLabel }}
            </button>
          </slot>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
