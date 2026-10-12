// @vitest-environment jsdom
import { beforeAll, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import RichTextEditor from '../src/components/editor/RichTextEditor.vue'

/**
 * The editor exists so people who cannot write HTML can still make a decent email, without a
 * browser dialog and without being locked away from the markup. These cover what they touch:
 * typing in either tab, the toolbar, links, buttons and pictures (and refusing unsafe addresses),
 * merge fields at the cursor, and the value staying in step with whatever the outside sets.
 */

beforeAll(() => {
  // jsdom has no layout; ProseMirror asks for it when the selection moves.
  const rect = { width: 0, height: 0, top: 0, left: 0, right: 0, bottom: 0, x: 0, y: 0, toJSON: () => ({}) }
  Range.prototype.getClientRects = () => ({ length: 0, item: () => null, [Symbol.iterator]: function* () {} }) as unknown as DOMRectList
  Range.prototype.getBoundingClientRect = () => rect as DOMRect
  Object.defineProperty(document, 'elementFromPoint', { configurable: true, value: () => null })
})

async function mountEditor(props: Record<string, unknown> = {}) {
  const wrapper = mount(RichTextEditor, { attachTo: document.body, props: { modelValue: '', ...props } })
  await flushPromises()
  await nextTick()
  return wrapper
}

const lastEmit = (w: ReturnType<typeof mount>): string => {
  const calls = w.emitted('update:modelValue') ?? []
  return (calls[calls.length - 1]?.[0] as string) ?? ''
}

const tool = (w: ReturnType<typeof mount>, label: string) => w.find(`button[aria-label="${label}"]`)
const tab = (w: ReturnType<typeof mount>, name: string) => w.findAll('[role="tab"]').find((t) => t.text() === name)!

describe('RichTextEditor', () => {
  it('shows the wording it is given, with the tabs and a toolbar', async () => {
    const w = await mountEditor({ modelValue: '<p>Hello <strong>there</strong></p>' })

    expect(w.find('.rte-content').html()).toContain('<strong>there</strong>')
    expect(w.findAll('[role="tab"]').map((t) => t.text())).toEqual(['Visual', 'HTML'])
    expect(w.find('[role="toolbar"]').exists()).toBe(true)
    expect(tool(w, 'Bold').attributes('aria-pressed')).toBe('false')
  })

  it('names the writing area for people who cannot see it', async () => {
    const w = await mountEditor({ label: 'Email message' })

    expect(w.find('.rte-content').attributes('aria-label')).toBe('Email message')
    expect(w.find('.rte-content').attributes('role')).toBe('textbox')
  })

  it('shows the raw HTML on the HTML tab and takes typing there', async () => {
    const w = await mountEditor({ modelValue: '<p>Hi</p>' })

    await tab(w, 'HTML').trigger('click')
    const field = w.find('textarea.rte-source')
    expect((field.element as HTMLTextAreaElement).value).toBe('<p>Hi</p>')
    expect(w.find('.rte-toolbar').exists()).toBe(false)

    await field.setValue('<p>Hi</p><p>More</p>')

    expect(lastEmit(w)).toBe('<p>Hi</p><p>More</p>')
  })

  it('goes back to the visual tab with what was typed, tidied, and says so to the outside', async () => {
    const w = await mountEditor({ modelValue: '<p>Hi</p>' })
    await tab(w, 'HTML').trigger('click')
    await w.find('textarea').setValue('<p>Hi <b>there</b><script>alert(1)</script></p>')

    await tab(w, 'Visual').trigger('click')
    await nextTick()

    const html = w.find('.rte-content').html()
    expect(html).toContain('<strong>there</strong>')
    expect(html).not.toContain('<script')
    expect(lastEmit(w)).not.toContain('script')
    expect(lastEmit(w)).toContain('<strong>there</strong>')
  })

  it('puts a merge field at the cursor in the HTML tab', async () => {
    const w = await mountEditor({ modelValue: '<p>Hi , welcome</p>' })
    await tab(w, 'HTML').trigger('click')
    const field = w.find('textarea').element as HTMLTextAreaElement
    field.setSelectionRange(6, 6)

    ;(w.vm as unknown as { insertText: (t: string) => void }).insertText('{{first_name}}')
    await nextTick()

    expect(lastEmit(w)).toBe('<p>Hi {{first_name}}, welcome</p>')
  })

  it('puts a merge field into the visual tab too', async () => {
    const w = await mountEditor({ modelValue: '<p>Hello</p>' })

    ;(w.vm as unknown as { insertText: (t: string) => void }).insertText('{{first_name}}')
    await nextTick()

    expect(lastEmit(w)).toContain('{{first_name}}')
  })

  it('turns the toolbar into formatting', async () => {
    const w = await mountEditor({ modelValue: '<p>Hello</p>' })
    ;(w.vm as unknown as { focus: () => void }).focus()

    await tool(w, 'Bulleted list').trigger('click')
    await nextTick()

    expect(lastEmit(w)).toContain('<ul>')
  })

  it('asks for a link inside the editor, refuses an unsafe address and adds a good one', async () => {
    const w = await mountEditor({ modelValue: '' })

    await tool(w, 'Link').trigger('click')
    const url = w.find('input[type="url"]')
    expect(url.exists()).toBe(true)

    await url.setValue('javascript:alert(1)')
    await w.find('form.rte-ask').trigger('submit')
    expect(w.find('.rte-ask-error').text()).toContain('https://')
    expect(lastEmit(w)).not.toContain('javascript')

    await url.setValue('https://example.com/quote')
    await w.find('form.rte-ask').trigger('submit')
    await nextTick()

    expect(lastEmit(w)).toContain('href="https://example.com/quote"')
    expect(w.find('form.rte-ask').exists()).toBe(false)
  })

  it('makes a button: a link carrying data-button', async () => {
    const w = await mountEditor({ modelValue: '' })

    await tool(w, 'Button').trigger('click')
    const inputs = w.findAll('form.rte-ask input')
    await inputs[0].setValue('Get a quote')
    await inputs[1].setValue('https://example.com/quote')
    await w.find('form.rte-ask').trigger('submit')
    await nextTick()

    const html = lastEmit(w)
    expect(html).toContain('data-button="true"')
    expect(html).toContain('Get a quote')
    expect(html).toContain('href="https://example.com/quote"')
  })

  it('puts a button on a line of its own, not in the middle of a sentence', async () => {
    const w = await mountEditor({ modelValue: '<p>Reply to this email.</p>' })
    ;(w.vm as unknown as { focus: () => void }).focus()

    await tool(w, 'Button').trigger('click')
    const inputs = w.findAll('form.rte-ask input')
    await inputs[0].setValue('Get a quote')
    await inputs[1].setValue('https://example.com/quote')
    await w.find('form.rte-ask').trigger('submit')
    await nextTick()

    expect(lastEmit(w)).toMatch(/<p><a [^>]*data-button="true"[^>]*>Get a quote<\/a><\/p>/)
  })

  it('shows the HTML with a line for each block, and looking at it changes nothing', async () => {
    const w = await mountEditor({ modelValue: '<p>One</p><ul><li>A</li><li>B</li></ul><p>Two</p>' })

    await tab(w, 'HTML').trigger('click')

    const shown = (w.find('textarea').element as HTMLTextAreaElement).value
    expect(shown.split('\n').length).toBeGreaterThan(4)
    expect(shown.replace(/\n/g, '')).toBe('<p>One</p><ul><li>A</li><li>B</li></ul><p>Two</p>')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('keeps what is typed in the HTML tab exactly as typed', async () => {
    const w = await mountEditor({ modelValue: '<p>One</p><p>Two</p>' })
    await tab(w, 'HTML').trigger('click')

    await w.find('textarea').setValue('<p>One</p>\n<p>Two and more</p>')

    expect(lastEmit(w)).toBe('<p>One</p>\n<p>Two and more</p>')
    expect((w.find('textarea').element as HTMLTextAreaElement).value).toBe('<p>One</p>\n<p>Two and more</p>')
  })

  it('adds a picture only from a secure address', async () => {
    const w = await mountEditor({ modelValue: '' })

    await tool(w, 'Picture').trigger('click')
    const inputs = w.findAll('form.rte-ask input')
    await inputs[0].setValue('Our crew')
    await inputs[1].setValue('http://example.com/a.png')
    await w.find('form.rte-ask').trigger('submit')
    expect(w.find('.rte-ask-error').text()).toContain('https://')

    await inputs[1].setValue('https://example.com/a.png')
    await w.find('form.rte-ask').trigger('submit')
    await nextTick()

    expect(lastEmit(w)).toContain('<img')
    expect(lastEmit(w)).toContain('alt="Our crew"')
  })

  it('can cancel the address row without changing anything', async () => {
    const w = await mountEditor({ modelValue: '<p>Hi</p>' })
    await tool(w, 'Link').trigger('click')

    await w.find('form.rte-ask button[type="button"]').trigger('click')

    expect(w.find('form.rte-ask').exists()).toBe(false)
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('follows a value set from outside, and does not echo its own', async () => {
    const w = await mountEditor({ modelValue: '<p>One</p>' })

    await w.setProps({ modelValue: '<p>Two</p>' })
    await nextTick()

    expect(w.find('.rte-content').text()).toBe('Two')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })

  it('treats an empty document as an empty string, never "<p></p>"', async () => {
    const w = await mountEditor({ modelValue: '<p>Hi</p>' })
    await tab(w, 'HTML').trigger('click')
    await w.find('textarea').setValue('')

    await tab(w, 'Visual').trigger('click')
    await nextTick()

    expect(lastEmit(w)).toBe('')
  })

  it('locks every control while disabled', async () => {
    const w = await mountEditor({ modelValue: '<p>Hi</p>', disabled: true })

    expect(tool(w, 'Bold').attributes('disabled')).toBeDefined()
    expect(w.find('.rte-content').attributes('contenteditable')).toBe('false')
  })

  it('hides the HTML tab where raw markup should not be offered', async () => {
    const w = await mountEditor({ allowHtml: false })

    expect(w.find('[role="tablist"]').exists()).toBe(false)
    expect(w.find('[role="toolbar"]').exists()).toBe(true)
  })

  it('keeps headings to the two sizes an email needs', async () => {
    const w = await mountEditor({ modelValue: '<h1>Big</h1><h4>Odd</h4><p>Text</p>' })

    const html = w.find('.rte-content').html()
    expect(html).not.toContain('<h1')
    expect(html).not.toContain('<h4')
  })
})
