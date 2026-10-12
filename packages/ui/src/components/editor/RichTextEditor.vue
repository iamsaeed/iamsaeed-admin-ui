<script setup lang="ts">
/**
 * A small rich-text editor for the wording of an email or a page snippet: bold, italic, underline,
 * headings, lists, a link, a button, a picture, undo and redo, with a switch to the raw HTML for
 * anyone who wants it. v-model is an HTML string.
 *
 * WHY IT EXISTS: the first consumer asked staff to write marketing email in a bare text box
 * labelled "HTML allowed". People who cannot write HTML could not make a decent email, and the ones
 * who can had no preview while typing. This gives both groups a way in without a browser dialog:
 * the link, button and picture addresses are asked for in a row of the editor itself.
 *
 * It writes plain, semantic HTML (p, h2, h3, ul, ol, li, a, img, blockquote, hr, strong, em, u).
 * Nothing about colour or fonts is stored in the wording: how that HTML looks is for whoever shows
 * it (for email, the sender adds inline styles, because mail programs ignore style sheets). A
 * "button" is an ordinary link carrying `data-button="true"` so the consumer can dress it.
 *
 * Merge fields ("{{first_name}}") are inserted at the cursor with the exposed `insertText`; the
 * consumer owns the list of fields.
 *
 * Switching from the HTML tab to the visual one lets the editor tidy markup it does not know.
 * That is said on the tab, so nobody is surprised.
 */
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'

const props = withDefaults(
  defineProps<{
    modelValue: string
    /** Id of the field, so an outside `<label for>` reaches it. */
    id?: string
    placeholder?: string
    disabled?: boolean
    /** Height of the writing area, in rem. */
    minHeight?: number
    /** Names the editor for people who cannot see it. */
    label?: string
    /** Hide the HTML tab where raw markup should not be offered. */
    allowHtml?: boolean
  }>(),
  { id: undefined, placeholder: '', disabled: false, minHeight: 14, label: 'Message', allowHtml: true },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

/** A link that can be dressed as a button by whoever shows the HTML. */
const ButtonLink = Link.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-button': {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-button'),
        renderHTML: (attributes: Record<string, unknown>) => (attributes['data-button'] ? { 'data-button': 'true' } : {}),
      },
    }
  },
})

const mode = ref<'visual' | 'html'>('visual')
const source = ref(props.modelValue ?? '')
/** What the HTML tab shows: the same markup with line breaks between blocks, so it can be read. */
const shown = ref('')
const sourceField = ref<HTMLTextAreaElement | null>(null)

/** Line breaks between blocks - for reading only; the value is never changed by looking at it. */
function pretty(html: string): string {
  return html
    .replace(/(<\/(?:p|h2|h3|ul|ol|li|blockquote)>)/gi, '$1\n')
    .replace(/(<(?:ul|ol)[^>]*>)/gi, '$1\n')
    .replace(/(<hr\s*\/?>)/gi, '$1\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

/** An empty document is '' to the outside, never "<p></p>". */
const clean = (html: string): string => (html === '<p></p>' ? '' : html)

const editor = useEditor({
  content: props.modelValue ?? '',
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({ heading: { levels: [2, 3] }, link: false, code: false, codeBlock: false, strike: false }),
    ButtonLink.configure({ openOnClick: false, autolink: false, HTMLAttributes: { rel: 'noopener noreferrer' } }),
    Image.configure({ inline: false }),
    Placeholder.configure({ placeholder: props.placeholder }),
  ],
  editorProps: {
    attributes: { class: 'rte-content', role: 'textbox', 'aria-multiline': 'true', 'aria-label': props.label },
  },
  onUpdate: ({ editor: e }) => {
    const html = clean(e.getHTML())
    source.value = html
    emit('update:modelValue', html)
  },
})

/* A value set from outside (a template picked, a form reset) replaces the content; our own echoes do not. */
watch(
  () => props.modelValue,
  (value) => {
    const next = value ?? ''
    if (next === source.value) return
    source.value = next
    shown.value = pretty(next)
    if (mode.value === 'visual') editor.value?.commands.setContent(next, { emitUpdate: false })
  },
)

watch(
  () => props.disabled,
  (disabled) => editor.value?.setEditable(!disabled),
)

onBeforeUnmount(() => editor.value?.destroy())

/* ── The row that asks for an address ─────────────────────────────────────── */

type Pending = { kind: 'link' | 'button' | 'image'; url: string; text: string } | null
const pending = ref<Pending>(null)
const urlField = ref<HTMLInputElement | null>(null)
const urlError = ref('')

function ask(kind: 'link' | 'button' | 'image') {
  const e = editor.value
  if (!e) return
  const href = kind === 'image' ? '' : ((e.getAttributes('link').href as string | undefined) ?? '')
  const { from, to } = e.state.selection
  const selected = from === to ? '' : e.state.doc.textBetween(from, to, ' ')
  pending.value = { kind, url: href, text: kind === 'button' ? selected || 'Learn more' : selected }
  urlError.value = ''
  nextTick(() => urlField.value?.focus())
}

/** Only addresses that are safe to follow or load: web, mail and phone links, never script. */
function usable(url: string, kind: 'link' | 'button' | 'image'): boolean {
  const value = url.trim().toLowerCase()
  if (kind === 'image') return value.startsWith('https://')
  return /^(https?:\/\/|mailto:|tel:)/.test(value)
}

function apply() {
  const e = editor.value
  const p = pending.value
  if (!e || !p) return
  const url = p.url.trim()
  if (!usable(url, p.kind)) {
    urlError.value = p.kind === 'image' ? 'A picture needs an address starting with https://' : 'Use an address starting with https://, mailto: or tel:'
    return
  }
  const chain = e.chain().focus()
  if (p.kind === 'image') chain.setImage({ src: url, alt: p.text.trim() }).run()
  else if (p.kind === 'button') {
    // A button is its own line: set in the middle of a sentence it would sit awkwardly in the email.
    chain
      .insertContent({
        type: 'paragraph',
        content: [{ type: 'text', text: p.text.trim() || 'Learn more', marks: [{ type: 'link', attrs: { href: url, 'data-button': 'true' } }] }],
      })
      .run()
  } else if (e.state.selection.empty) {
    chain.insertContent({ type: 'text', text: p.text.trim() || url, marks: [{ type: 'link', attrs: { href: url } }] }).run()
  } else {
    chain.extendMarkRange('link').setLink({ href: url }).run()
  }
  pending.value = null
}

function removeLink() {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
}

/* ── Tabs ────────────────────────────────────────────────────────────────────── */

function show(next: 'visual' | 'html') {
  if (mode.value === next) return
  if (next === 'visual') {
    editor.value?.commands.setContent(source.value, { emitUpdate: false })
    // The editor tidies what it does not know; keep the outside in step with what it now holds.
    const tidy = clean(editor.value?.getHTML() ?? '')
    if (tidy !== source.value) {
      source.value = tidy
      emit('update:modelValue', tidy)
    }
  }
  if (next === 'html') shown.value = pretty(source.value)
  pending.value = null
  mode.value = next
}

function onSource(event: Event) {
  shown.value = (event.target as HTMLTextAreaElement).value
  source.value = shown.value
  emit('update:modelValue', source.value)
}

/* ── For the consumer ──────────────────────────────────────────────────────── */

/** Put text (a merge field, say) at the cursor, in whichever tab is showing. */
function insertText(text: string) {
  if (mode.value === 'html') {
    const field = sourceField.value
    const start = field?.selectionStart ?? shown.value.length
    const end = field?.selectionEnd ?? shown.value.length
    shown.value = shown.value.slice(0, start) + text + shown.value.slice(end)
    source.value = shown.value
    emit('update:modelValue', source.value)
    nextTick(() => {
      field?.focus()
      field?.setSelectionRange(start + text.length, start + text.length)
    })
    return
  }
  editor.value?.chain().focus().insertContent(text).run()
}

function focus() {
  if (mode.value === 'html') sourceField.value?.focus()
  else editor.value?.commands.focus()
}

defineExpose({ insertText, focus })

const can = computed(() => ({
  undo: editor.value?.can().undo() ?? false,
  redo: editor.value?.can().redo() ?? false,
}))

const active = (name: string, attrs?: Record<string, unknown>) => editor.value?.isActive(name, attrs) ?? false
const style = computed(() => ({ minHeight: `${props.minHeight}rem` }))

interface Tool {
  key: string
  label: string
  title: string
  on: () => boolean
  run: () => void
}

const tools = computed<Tool[]>(() => {
  const e = editor.value
  if (!e) return []
  return [
    { key: 'bold', label: 'B', title: 'Bold', on: () => active('bold'), run: () => e.chain().focus().toggleBold().run() },
    { key: 'italic', label: 'I', title: 'Italic', on: () => active('italic'), run: () => e.chain().focus().toggleItalic().run() },
    { key: 'underline', label: 'U', title: 'Underline', on: () => active('underline'), run: () => e.chain().focus().toggleUnderline().run() },
    { key: 'h2', label: 'H2', title: 'Heading', on: () => active('heading', { level: 2 }), run: () => e.chain().focus().toggleHeading({ level: 2 }).run() },
    { key: 'h3', label: 'H3', title: 'Smaller heading', on: () => active('heading', { level: 3 }), run: () => e.chain().focus().toggleHeading({ level: 3 }).run() },
    { key: 'bullets', label: '• List', title: 'Bulleted list', on: () => active('bulletList'), run: () => e.chain().focus().toggleBulletList().run() },
    { key: 'numbers', label: '1. List', title: 'Numbered list', on: () => active('orderedList'), run: () => e.chain().focus().toggleOrderedList().run() },
    { key: 'quote', label: 'Quote', title: 'Quote', on: () => active('blockquote'), run: () => e.chain().focus().toggleBlockquote().run() },
    { key: 'rule', label: 'Line', title: 'Dividing line', on: () => false, run: () => e.chain().focus().setHorizontalRule().run() },
  ]
})
</script>

<template>
  <div class="rte" :class="{ 'is-disabled': disabled }">
    <div class="rte-top">
      <div v-if="allowHtml" class="rte-tabs" role="tablist" :aria-label="`${label} view`">
        <button type="button" role="tab" class="rte-tab" :class="{ 'is-active': mode === 'visual' }" :aria-selected="mode === 'visual'" @click="show('visual')">Visual</button>
        <button type="button" role="tab" class="rte-tab" :class="{ 'is-active': mode === 'html' }" :aria-selected="mode === 'html'" @click="show('html')">HTML</button>
      </div>

      <div v-if="mode === 'visual'" class="rte-toolbar" role="toolbar" :aria-label="`${label} formatting`">
        <button
          v-for="tool in tools"
          :key="tool.key"
          type="button"
          class="rte-tool"
          :class="{ 'is-active': tool.on() }"
          :title="tool.title"
          :aria-label="tool.title"
          :aria-pressed="tool.on()"
          :disabled="disabled"
          @click="tool.run()"
        >{{ tool.label }}</button>
        <span class="rte-sep" aria-hidden="true" />
        <button type="button" class="rte-tool" :class="{ 'is-active': active('link') }" title="Link" aria-label="Link" :disabled="disabled" @click="ask('link')">Link</button>
        <button v-if="active('link')" type="button" class="rte-tool" title="Remove link" aria-label="Remove link" :disabled="disabled" @click="removeLink">Unlink</button>
        <button type="button" class="rte-tool" title="Button" aria-label="Button" :disabled="disabled" @click="ask('button')">Button</button>
        <button type="button" class="rte-tool" title="Picture" aria-label="Picture" :disabled="disabled" @click="ask('image')">Picture</button>
        <span class="rte-sep" aria-hidden="true" />
        <button type="button" class="rte-tool" title="Undo" aria-label="Undo" :disabled="disabled || !can.undo" @click="editor?.chain().focus().undo().run()">Undo</button>
        <button type="button" class="rte-tool" title="Redo" aria-label="Redo" :disabled="disabled || !can.redo" @click="editor?.chain().focus().redo().run()">Redo</button>
      </div>
    </div>

    <form v-if="pending" class="rte-ask" @submit.prevent="apply">
      <label v-if="pending.kind !== 'link'" class="rte-ask-field">
        <span>{{ pending.kind === 'button' ? 'Button words' : 'What the picture shows' }}</span>
        <input v-model="pending.text" class="form-input" type="text" maxlength="120">
      </label>
      <label class="rte-ask-field rte-ask-grow">
        <span>{{ pending.kind === 'image' ? 'Picture address' : 'Address' }}</span>
        <input :id="`${id ?? 'rte'}-url`" ref="urlField" v-model="pending.url" class="form-input" type="url" inputmode="url" :placeholder="pending.kind === 'image' ? 'https://…' : 'https://…, mailto: or tel:'" required>
      </label>
      <div class="rte-ask-actions">
        <button type="submit" class="btn btn-primary btn-sm">{{ pending.kind === 'image' ? 'Add picture' : pending.kind === 'button' ? 'Add button' : 'Add link' }}</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="pending = null">Cancel</button>
      </div>
      <p v-if="urlError" class="form-error rte-ask-error" role="alert">{{ urlError }}</p>
    </form>

    <div v-show="mode === 'visual'" class="rte-body" :style="style">
      <EditorContent v-if="editor" :editor="editor" :id="id" />
    </div>

    <template v-if="mode === 'html'">
      <textarea
        :id="id"
        ref="sourceField"
        class="form-textarea rte-source"
        :style="style"
        :value="shown"
        :disabled="disabled"
        spellcheck="false"
        :aria-label="`${label} as HTML`"
        @input="onSource"
      />
      <p class="rte-hint">Going back to the Visual tab tidies any markup the editor does not know.</p>
    </template>
  </div>
</template>
