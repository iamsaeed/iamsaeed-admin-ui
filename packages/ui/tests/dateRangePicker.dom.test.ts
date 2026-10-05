// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import DateRangePicker from '../src/components/ui/DateRangePicker.vue'

/**
 * DateRangePicker's behaviour, as a person meets it: the draft only becomes the value on Apply
 * (one change, both ends), a preset applies at once, a typed date that is not a day is refused in
 * words, the grid is one tab stop moved by arrows, Escape steps out of a view before it closes,
 * and only the phone sheet — which claims aria-modal — traps focus.
 *
 * "Today" is pinned to 5 October 2026 so the presets and disabled days are stable.
 */

let wide = true

function stubEnvironment() {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('min-width') ? wide : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  })) as unknown as typeof window.matchMedia
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value: () => ({ width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10, x: 0, y: 0 }),
  })
}

let wrapper: VueWrapper | null = null

function mountPicker(props: Record<string, unknown> = {}) {
  wrapper = mount(DateRangePicker, {
    attachTo: document.body,
    props: { from: '', to: '', label: 'Decided', locale: 'en-GB', max: '2026-10-05', ...props },
  })
  return wrapper
}

const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)
const qa = <T extends Element = HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T>(sel))
const day = (iso: string) => q<HTMLButtonElement>(`[data-day="${iso}"]`)!

async function click(el: Element | null) {
  ;(el as HTMLElement).click()
  await nextTick()
  await nextTick()
}

async function openPanel(w: VueWrapper) {
  await w.find('.daterange-button').trigger('click')
  await nextTick()
  await nextTick()
}

async function type(input: HTMLInputElement, value: string, commit = false) {
  input.value = value
  input.dispatchEvent(new Event('input'))
  if (commit) input.dispatchEvent(new Event('change'))
  await nextTick()
}

describe('DateRangePicker', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 9, 5, 12, 0))
    wide = true
    stubEnvironment()
    document.body.innerHTML = ''
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  it('names itself by its label and value', () => {
    const w = mountPicker({ from: '2026-09-29', to: '2026-10-05' })
    const button = w.find('.daterange-button')
    expect(button.text()).toContain('Last 7 days')
    expect(button.attributes('aria-label')).toBe('Decided: Last 7 days')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('keeps clicks as a draft until Apply, then emits both ends once', async () => {
    const w = mountPicker({ from: '2026-09-17', to: '2026-09-26' })
    await openPanel(w)

    await click(day('2026-09-08'))
    await click(day('2026-09-12'))
    expect(w.emitted('update:from')).toBeUndefined()
    expect(q('.daterange-note')?.textContent).toBe('5 days')

    await click(qa<HTMLButtonElement>('.daterange-actions .btn').find((b) => b.textContent?.trim() === 'Apply')!)
    expect(w.emitted('update:from')).toEqual([['2026-09-08']])
    expect(w.emitted('update:to')).toEqual([['2026-09-12']])
    expect(w.emitted('change')).toEqual([[{ from: '2026-09-08', to: '2026-09-12' }]])
    expect(q('.daterange-panel')).toBeNull()
  })

  it('swaps the ends when the second click is earlier than the first', async () => {
    const w = mountPicker()
    await openPanel(w)
    await click(day('2026-09-20'))
    await click(day('2026-09-10'))
    await click(qa<HTMLButtonElement>('.daterange-actions .btn')[1])
    expect(w.emitted('change')).toEqual([[{ from: '2026-09-10', to: '2026-09-20' }]])
  })

  it('applies a preset at once and closes', async () => {
    const w = mountPicker()
    await openPanel(w)
    await click(qa('.daterange-preset').find((b) => b.textContent?.trim() === 'Last financial year')!)
    expect(w.emitted('change')).toEqual([[{ from: '2025-04-01', to: '2026-03-31' }]])
    expect(q('.daterange-panel')).toBeNull()
  })

  it('refuses a typed date that is not a day, in words, and disables Apply', async () => {
    const w = mountPicker()
    await openPanel(w)
    const [fromInput] = qa<HTMLInputElement>('.daterange-field input')
    await type(fromInput, '31/02/2020', true)

    expect(q('[role="alert"]')?.textContent).toBe('Enter a real date as DD/MM/YYYY.')
    expect(fromInput.getAttribute('aria-invalid')).toBe('true')
    expect(qa<HTMLButtonElement>('.daterange-actions .btn')[1].disabled).toBe(true)
  })

  it('jumps the calendar to a typed date years back', async () => {
    const w = mountPicker()
    await openPanel(w)
    const [fromInput] = qa<HTMLInputElement>('.daterange-field input')
    await type(fromInput, '05/10/2006')
    await nextTick()
    expect(q('.daterange-title')?.textContent).toContain('October 2006')
    expect(day('2006-10-05').classList.contains('is-endpoint')).toBe(true)
  })

  it('refuses a day after the maximum', async () => {
    const w = mountPicker()
    await openPanel(w)
    const [, toInput] = qa<HTMLInputElement>('.daterange-field input')
    await type(toInput, '06/10/2026', true)
    expect(q('[role="alert"]')?.textContent).toBe('Choose a date on or before 05/10/2026.')
  })

  it('says when a range is longer than allowed', async () => {
    const w = mountPicker({ maxDays: 31 })
    await openPanel(w)
    await click(day('2026-09-01'))
    await click(day('2026-10-05'))
    expect(q('[role="alert"]')?.textContent).toBe('Choose 31 days or fewer.')
  })

  it('reaches a year far back through the month and year views', async () => {
    const w = mountPicker()
    await openPanel(w)
    await click(q('.daterange-title'))
    expect(qa('.daterange-pick')).toHaveLength(12)
    await click(q('.daterange-title'))
    expect(q('.daterange-title')?.textContent).toContain('2016 – 2027')
    expect(qa<HTMLButtonElement>('.daterange-pick').find((b) => b.textContent?.trim() === '2027')!.disabled).toBe(true)

    await click(qa('.daterange-nav')[0])
    await click(qa('.daterange-pick').find((b) => b.textContent?.trim() === '2006')!)
    await click(qa('.daterange-pick').find((b) => b.textContent?.trim() === 'Oct')!)
    expect(q('.daterange-title')?.textContent).toContain('October 2006')
  })

  it('is one tab stop, moved by the arrow keys', async () => {
    const w = mountPicker({ from: '2026-09-17', to: '2026-09-26' })
    await openPanel(w)
    const focusable = qa('.daterange-day').filter((b) => b.getAttribute('tabindex') === '0')
    expect(focusable).toHaveLength(1)
    expect(document.activeElement?.getAttribute('data-day')).toBe('2026-09-17')

    q('.daterange-months')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    await nextTick()
    expect(document.activeElement?.getAttribute('data-day')).toBe('2026-09-24')
  })

  it('closes on Escape and gives focus back to the trigger, stepping out of a view first', async () => {
    const w = mountPicker()
    await openPanel(w)
    await click(q('.daterange-title'))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(q('.daterange-panel')).not.toBeNull()
    expect(qa('.daterange-day').length).toBeGreaterThan(0)

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()
    expect(q('.daterange-panel')).toBeNull()
    expect(document.activeElement).toBe(w.find('.daterange-button').element)
  })

  it('is a non-modal popover on desktop and a modal sheet on a phone', async () => {
    const desk = mountPicker()
    await openPanel(desk)
    expect(q('.daterange-panel')?.getAttribute('aria-modal')).toBeNull()
    expect(q('.scrim')).toBeNull()
    expect(qa('.daterange-month')).toHaveLength(2)
    desk.unmount()
    wrapper = null
    document.body.innerHTML = ''

    wide = false
    const phone = mountPicker()
    await openPanel(phone)
    expect(q('.daterange-panel')?.getAttribute('aria-modal')).toBe('true')
    expect(q('.scrim')).not.toBeNull()
    expect(qa('.daterange-month')).toHaveLength(1)
  })

  it('lines the panel up with the far edge when it would run off the screen', async () => {
    const w = mountPicker()
    const real = HTMLElement.prototype.getBoundingClientRect
    Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
      configurable: true,
      value(this: HTMLElement) {
        return this.classList.contains('daterange-panel')
          ? { width: 760, height: 400, top: 0, left: 900, right: 1660, bottom: 400, x: 900, y: 0 }
          : real.call(this)
      },
    })
    await openPanel(w)
    expect(q('.daterange-panel')?.classList.contains('is-align-end')).toBe(true)
  })

  it('shifts an applied range by its own length, and not past the maximum', async () => {
    const w = mountPicker({ from: '2026-09-22', to: '2026-09-28', shiftable: true })
    const [back, fwd] = w.findAll('.daterange-shift')
    await back.trigger('click')
    expect(w.emitted('change')![0]).toEqual([{ from: '2026-09-15', to: '2026-09-21' }])
    await fwd.trigger('click')
    expect(w.emitted('change')![1]).toEqual([{ from: '2026-09-22', to: '2026-09-28' }])
  })

  it('will not shift forward past the maximum', () => {
    const w = mountPicker({ from: '2026-09-29', to: '2026-10-05', shiftable: true })
    const fwd = w.findAll('.daterange-shift')[1]
    expect((fwd.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('posts hidden fields when named, and treats a malformed value as unset', async () => {
    const w = mountPicker({ name: 'decided', from: '2026-09-17', to: 'yesterday' })
    await nextTick()
    expect(w.emitted('update:to')).toEqual([['']])
    expect(w.find('input[name="decided[from]"]').attributes('value')).toBe('2026-09-17')
  })
})
