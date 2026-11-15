// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import SearchSelect from '../src/components/ui/SearchSelect.vue'

/**
 * SearchSelect as a person meets it: a button that reads like a select, a popover with a search box
 * that narrows the options, arrows + Enter to take one, the empty choice to clear, Escape to leave.
 */

let wrapper: VueWrapper | null = null
const OPTIONS = [
  { value: 'bug', label: 'bug' }, { value: 'billing', label: 'billing' }, { value: 'ui', label: 'UI polish' }, { value: 'api', label: 'api' },
]

function mountSelect(props: Record<string, unknown> = {}) {
  wrapper = mount(SearchSelect, {
    attachTo: document.body,
    props: {
      modelValue: '', options: OPTIONS, placeholder: 'Any label', label: 'Label',
      'onUpdate:modelValue': (v: string) => wrapper?.setProps({ modelValue: v }),
      ...props,
    },
  })
  return wrapper
}
const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)
const qa = (sel: string) => Array.from(document.querySelectorAll<HTMLElement>(sel))
const labels = () => qa('.search-select-option-label').map((e) => e.textContent)
async function openList() {
  q<HTMLButtonElement>('.search-select-trigger')!.click()
  await nextTick()
  await nextTick()
}
async function type(text: string) {
  const input = q<HTMLInputElement>('.search-select-input')!
  input.value = text
  input.dispatchEvent(new Event('input'))
  await nextTick()
}
async function key(k: string) {
  q('.search-select-input')!.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }))
  await nextTick()
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('SearchSelect', () => {
  it('shows the placeholder, then the chosen option, on a form-select button', () => {
    const w = mountSelect()
    expect(q('.search-select-trigger')!.classList.contains('form-select')).toBe(true)
    expect(q('.search-select-value')!.textContent).toBe('Any label')
    w.setProps({ modelValue: 'ui' })
    return nextTick().then(() => expect(q('.search-select-value')!.textContent).toBe('UI polish'))
  })

  it('opens with the search focused and the empty choice first', async () => {
    mountSelect()
    await openList()
    expect(document.activeElement).toBe(q('.search-select-input'))
    expect(q('.search-select-trigger')!.getAttribute('aria-expanded')).toBe('true')
    expect(labels()).toEqual(['Any label', 'bug', 'billing', 'UI polish', 'api'])
  })

  it('narrows as you type, matches anywhere, and puts words that start with it first', async () => {
    mountSelect()
    await openList()
    await type('b')
    expect(labels()).toEqual(['bug', 'billing'])
    await type('i')
    expect(labels()).toEqual(['billing', 'UI polish', 'api'].filter((l) => l.toLowerCase().includes('i')))
    await type('polish')
    expect(labels()).toEqual(['UI polish'])
  })

  it('says so when nothing matches, and hides the empty choice while searching', async () => {
    mountSelect()
    await openList()
    await type('zzz')
    expect(q('.search-select-empty')!.textContent).toBe('Nothing matches')
    expect(qa('.search-select-option').length).toBe(0)
  })

  it('arrows move, Enter takes, and the popover closes with focus back on the button', async () => {
    const w = mountSelect()
    await openList()
    await key('ArrowDown')
    await key('ArrowDown')
    await key('Enter')
    expect(w.props('modelValue')).toBe('billing')
    expect(q('.search-select-popover')).toBeNull()
    await nextTick()
    expect(document.activeElement).toBe(q('.search-select-trigger'))
  })

  it('clicking an option takes it; the empty choice clears it', async () => {
    const w = mountSelect({ modelValue: 'api' })
    await openList()
    qa('.search-select-option').find((e) => e.textContent?.includes('billing'))!.click()
    await nextTick()
    expect(w.props('modelValue')).toBe('billing')
    await openList()
    qa('.search-select-option')[0]!.click()
    await nextTick()
    expect(w.props('modelValue')).toBe('')
  })

  it('marks the chosen option and opens with it highlighted', async () => {
    mountSelect({ modelValue: 'ui' })
    await openList()
    expect(q('.search-select-option.is-selected')!.textContent).toContain('UI polish')
    expect(q('.search-select-option.is-active')!.textContent).toContain('UI polish')
    expect(q('.search-select-option.is-selected')!.getAttribute('aria-selected')).toBe('true')
  })

  it('Escape closes without changing anything', async () => {
    const w = mountSelect({ modelValue: 'bug' })
    await openList()
    await key('Escape')
    expect(q('.search-select-popover')).toBeNull()
    expect(w.props('modelValue')).toBe('bug')
  })

  it('a click outside closes it', async () => {
    mountSelect()
    await openList()
    document.body.click()
    await nextTick()
    expect(q('.search-select-popover')).toBeNull()
  })

  it('a required field has no empty choice', async () => {
    mountSelect({ clearable: false })
    await openList()
    expect(labels()).toEqual(['bug', 'billing', 'UI polish', 'api'])
  })

  it('a disabled one does not open', async () => {
    mountSelect({ disabled: true })
    q<HTMLButtonElement>('.search-select-trigger')!.click()
    await nextTick()
    expect(q('.search-select-popover')).toBeNull()
  })
})
