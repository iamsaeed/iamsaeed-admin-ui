// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import Typeahead from '../src/components/ui/Typeahead.vue'

/** Typeahead as a person meets it: type, pause, pick; and only the last search counts. */

let wrapper: VueWrapper | null = null
const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)
const qa = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(sel))
const labels = () => qa('.search-select-option-label').map((e) => e.textContent)
const tick = async (ms: number) => { await vi.advanceTimersByTimeAsync(ms); await nextTick() }

function mountIt(search: (t: string, s: AbortSignal) => Promise<{ value: string; label: string }[]>, props: Record<string, unknown> = {}) {
  wrapper = mount(Typeahead, {
    attachTo: document.body,
    props: { modelValue: null, search, delay: 100, minChars: 2, label: 'Company', 'onUpdate:modelValue': (v: unknown) => wrapper?.setProps({ modelValue: v }), ...props },
  })
  return wrapper
}
async function type(text: string) {
  const input = q<HTMLInputElement>('input.typeahead-input')!
  input.value = text
  input.dispatchEvent(new Event('input'))
  await nextTick()
}
async function key(k: string) {
  q('input.typeahead-input')!.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  await nextTick()
}
const found = (...names: string[]) => names.map((n) => ({ value: n, label: n }))

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
  vi.useRealTimers()
})

describe('Typeahead', () => {
  it('asks to type more until the minimum, and does not search', async () => {
    const search = vi.fn(async () => found('x'))
    mountIt(search)
    await type('a')
    await tick(500)
    expect(search).not.toHaveBeenCalled()
    expect(q('.search-select-empty')!.textContent).toBe('Type at least 2 characters')
  })

  it('a burst of typing sends one search with the final text, then lists the answer', async () => {
    const search = vi.fn(async (t: string) => found(`${t} Ltd`, `${t} Foods`))
    mountIt(search)
    for (const t of ['ac', 'acm', 'acme']) { await type(t); await tick(40) }
    expect(search).not.toHaveBeenCalled()
    await tick(150)
    expect(search).toHaveBeenCalledTimes(1)
    expect(search.mock.calls[0]![0]).toBe('acme')
    expect(labels()).toEqual(['acme Ltd', 'acme Foods'])
  })

  it('shows Searching… while waiting and Nothing found for an empty answer', async () => {
    let answer: (v: { value: string; label: string }[]) => void = () => {}
    mountIt(() => new Promise((r) => { answer = r }))
    await type('zz')
    expect(q('.search-select-empty')!.textContent).toBe('Searching…')
    await tick(100)
    answer([])
    await tick(0)
    expect(q('.search-select-empty')!.textContent).toBe('Nothing found')
  })

  it('aborts the older search and ignores its late answer', async () => {
    const pending: { text: string; signal: AbortSignal; answer: (v: { value: string; label: string }[]) => void }[] = []
    mountIt((text, signal) => new Promise((resolve) => { pending.push({ text, signal, answer: resolve }) }))
    await type('ab'); await tick(100)
    await type('abc'); await tick(100)
    expect(pending[0]!.signal.aborted).toBe(true)
    pending[1]!.answer(found('abc Ltd')); await tick(0)
    pending[0]!.answer(found('OLD')); await tick(0)
    expect(labels()).toEqual(['abc Ltd'])
  })

  it('arrows and Enter choose; the field then shows the choice', async () => {
    const w = mountIt(async () => found('Acme Ltd', 'Acme Foods'))
    await type('ac'); await tick(150)
    await key('ArrowDown')
    await key('Enter')
    expect(w.props('modelValue')).toEqual({ value: 'Acme Foods', label: 'Acme Foods' })
    expect(q('.search-select-popover')).toBeNull()
    expect(q<HTMLInputElement>('input.typeahead-input')!.value).toBe('Acme Foods')
  })

  it('Enter with no results does nothing harmful', async () => {
    const w = mountIt(async () => [])
    await type('zz'); await tick(150)
    await key('Enter')
    expect(w.props('modelValue')).toBeNull()
  })

  it('Escape abandons what was typed but keeps the choice; the clear button empties it', async () => {
    const w = mountIt(async () => found('Acme Ltd'), { modelValue: { value: 'Kept Ltd', label: 'Kept Ltd' } })
    await type('ac'); await tick(150)
    await key('Escape')
    expect(q('.search-select-popover')).toBeNull()
    expect(q<HTMLInputElement>('input.typeahead-input')!.value).toBe('Kept Ltd')
    expect(w.props('modelValue')).toEqual({ value: 'Kept Ltd', label: 'Kept Ltd' })
    q<HTMLButtonElement>('.typeahead-clear')!.click()
    await nextTick()
    expect(w.props('modelValue')).toBeNull()
    expect(q<HTMLInputElement>('input.typeahead-input')!.value).toBe('')
  })

  it('shows the failure of the current search', async () => {
    mountIt(async () => { throw new Error('Service down') })
    await type('ac'); await tick(150)
    expect(q('.search-select-empty')!.textContent).toBe('Service down')
  })

  it('a click outside closes the list and restores the chosen text', async () => {
    mountIt(async () => found('Acme Ltd'), { modelValue: { value: 'Kept', label: 'Kept' } })
    await type('ac'); await tick(150)
    document.body.click()
    await nextTick()
    expect(q('.search-select-popover')).toBeNull()
    expect(q<HTMLInputElement>('input.typeahead-input')!.value).toBe('Kept')
  })

  it('a disabled one does not open', async () => {
    mountIt(async () => found('x'), { disabled: true })
    expect(q<HTMLInputElement>('input.typeahead-input')!.disabled).toBe(true)
  })
})
