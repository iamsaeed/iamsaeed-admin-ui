// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Dialog from '../src/components/ui/Dialog.vue'

/**
 * The library had `.modal` styles and no component, so consumers hand-rolled the markup or reached
 * for `window.prompt`. These assert the parts a hand-rolled copy kept forgetting: focus goes to the
 * field rather than the close button, Escape closes, `aria-modal` is backed by a real trap, and a
 * confirm announces itself as an alertdialog rather than an ordinary one.
 */

/** jsdom has no layout, so every element reports a zero rect and the trap would skip them all. */
function stubLayout() {
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10, x: 0, y: 0 }),
  })
}

function mountDialog(props: Record<string, unknown> = {}) {
  return mount(Dialog, {
    attachTo: document.body,
    props: { open: true, title: 'Sign in as Casey', ...props },
  })
}

const panel = () => document.querySelector('[aria-modal="true"]') as HTMLElement | null

describe('Dialog', () => {
  beforeEach(() => {
    stubLayout()
    document.body.innerHTML = ''
  })

  it('shows nothing until it is opened', () => {
    mountDialog({ open: false })
    expect(panel()).toBeNull()
  })

  it('names itself by its title, for assistive tech', () => {
    mountDialog()
    const labelledBy = panel()?.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    expect(document.getElementById(labelledBy as string)?.textContent).toContain('Sign in as Casey')
  })

  it('announces a confirm as an alertdialog and a form as a dialog', () => {
    mountDialog({ mode: 'confirm' })
    expect(panel()?.getAttribute('role')).toBe('alertdialog')

    document.body.innerHTML = ''
    mountDialog({ mode: 'prompt' })
    expect(panel()?.getAttribute('role')).toBe('dialog')
  })

  it('opens a prompt with focus in the field, not on the close button', async () => {
    // Opened by a change, not mounted open: the trap watches for the transition, so a dialog that
    // was already open before it existed is never handed focus. Every overlay here behaves so.
    const w = mountDialog({ open: false, mode: 'prompt', label: 'Why?' })
    await w.setProps({ open: true })
    await new Promise((r) => setTimeout(r, 0))

    expect(document.activeElement?.tagName).toBe('INPUT')
    w.unmount()
  })

  it('closes on Escape', async () => {
    const w = mountDialog()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(w.emitted('close')).toBeTruthy()
  })

  it('will not close on Escape while work is in flight', async () => {
    const w = mountDialog({ busy: true })
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))

    expect(w.emitted('close')).toBeFalsy()
  })

  it('closes when the scrim is clicked', async () => {
    const w = mountDialog()
    await (document.querySelector('.scrim') as HTMLElement).click()

    expect(w.emitted('close')).toBeTruthy()
  })

  it('hands back what was typed', async () => {
    const w = mountDialog({ mode: 'prompt', label: 'Why?', minLength: 5 })
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    input.value = '  checking the account  '
    input.dispatchEvent(new Event('input'))

    ;(document.querySelector('.modal-ft .btn-primary') as HTMLElement).click()

    // Trimmed: leading and trailing space is never part of the answer.
    expect(w.emitted('confirm')?.[0]).toEqual(['checking the account'])
  })

  it('refuses an answer that is too short, and says so', async () => {
    const w = mountDialog({ mode: 'prompt', label: 'Why?', minLength: 5 })
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    input.value = 'test'
    input.dispatchEvent(new Event('input'))

    ;(document.querySelector('.modal-ft .btn-primary') as HTMLElement).click()
    await w.vm.$nextTick()

    expect(w.emitted('confirm')).toBeFalsy()
    expect(document.querySelector('.form-error')?.textContent).toContain('at least 5')
    expect(input.getAttribute('aria-invalid')).toBe('true')
  })

  it('shows a message from the server as given', () => {
    mountDialog({ error: 'The reason must be at least 5 characters.' })
    expect(document.querySelector('[role="alert"]')?.textContent).toContain('at least 5 characters')
  })

  it('confirms without a value when it is not a prompt', async () => {
    const w = mountDialog({ mode: 'confirm', confirmLabel: 'Discard' })
    ;(document.querySelector('.modal-ft .btn-primary') as HTMLElement).click()

    expect(w.emitted('confirm')).toBeTruthy()
  })
})
