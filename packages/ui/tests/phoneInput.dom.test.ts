// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import { nextTick } from 'vue'
import PhoneInput from '../src/components/ui/PhoneInput.vue'
import { fromE164, readTypedPhone, toE164 } from '../src/utils/phone'

/**
 * PhoneInput as a person meets it: a number box beside a flag + calling code that opens a
 * searchable country list; typing a full international number switches the country and drops the
 * code; the list is a combobox moved by arrows and closed by Escape.
 */

let wrapper: VueWrapper | null = null

function mountInput(props: Record<string, unknown> = {}) {
  wrapper = mount(PhoneInput, {
    attachTo: document.body,
    props: {
      modelValue: '',
      countryCode: 'US',
      'onUpdate:modelValue': (v: string) => wrapper?.setProps({ modelValue: v }),
      'onUpdate:countryCode': (v: string) => wrapper?.setProps({ countryCode: v }),
      ...props,
    },
  })
  return wrapper
}

const q = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel)
const qa = <T extends Element = HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T>(sel))

async function openList() {
  q<HTMLButtonElement>('.phone-country')!.click()
  await nextTick()
  await nextTick()
}

afterEach(() => {
  wrapper?.unmount()
  wrapper = null
  document.body.innerHTML = ''
})

describe('PhoneInput', () => {
  it('shows the selected country as a flag and calling code', () => {
    mountInput({ countryCode: 'IN' })
    expect(q('.phone-calling')!.textContent).toBe('+91')
    expect(q('.phone-country .fi-in')).not.toBeNull()
    expect(q('.phone-country')!.getAttribute('aria-label')).toContain('India')
  })

  it('typing a full international number switches the country and strips the code', async () => {
    const w = mountInput({ countryCode: 'US' })
    const input = w.get('input[type=tel]')
    await input.setValue('+91 91614 59446')
    expect(w.props('countryCode')).toBe('IN')
    expect(w.props('modelValue')).toBe('9161459446')
  })

  it('keeps a national number as typed', async () => {
    const w = mountInput({ countryCode: 'IN' })
    await w.get('input[type=tel]').setValue('91614 59446')
    expect(w.props('countryCode')).toBe('IN')
    expect(w.props('modelValue')).toBe('91614 59446')
  })

  it('opens a listbox with a Preferred section first and the search focused', async () => {
    mountInput({ preferredCountries: ['AE', 'IN'] })
    await openList()
    expect(q('.phone-heading')!.textContent).toBe('Preferred')
    expect(document.activeElement).toBe(q('.phone-search-input'))
    expect(q('.phone-country')!.getAttribute('aria-expanded')).toBe('true')
    expect(qa('.phone-option').length).toBeGreaterThan(200)
  })

  it('shows the best match first: "India" lists India above the Indian Ocean territory, "+44" the UK first', async () => {
    mountInput()
    await openList()
    const search = q<HTMLInputElement>('.phone-search-input')!
    search.value = 'India'
    search.dispatchEvent(new Event('input'))
    await nextTick()
    const india = qa('.phone-option-name').map((n) => n.textContent)
    expect(india[0]).toBe('India')
    expect(india.indexOf('British Indian Ocean Territory')).toBeGreaterThan(0)

    search.value = '+44'
    search.dispatchEvent(new Event('input'))
    await nextTick()
    expect(qa('.phone-option-name')[0]!.textContent).toBe('United Kingdom')
  })

  it('filters by name, ISO code and calling code', async () => {
    mountInput()
    await openList()
    const search = q<HTMLInputElement>('.phone-search-input')!
    search.value = 'united arab'
    search.dispatchEvent(new Event('input'))
    await nextTick()
    expect(qa('.phone-option-name').map((n) => n.textContent)).toEqual(['United Arab Emirates'])

    search.value = '+971'
    search.dispatchEvent(new Event('input'))
    await nextTick()
    expect(qa('.phone-option-name').map((n) => n.textContent)).toContain('United Arab Emirates')

    search.value = 'zzzz'
    search.dispatchEvent(new Event('input'))
    await nextTick()
    expect(q('.phone-empty')!.textContent).toContain('No countries found')
  })

  it('picking a country emits update:countryCode and closes the list', async () => {
    const w = mountInput()
    await openList()
    const row = qa('.phone-option').find((li) => li.querySelector('.phone-option-name')!.textContent === 'India')!
    row.click()
    await nextTick()
    expect(w.props('countryCode')).toBe('IN')
    expect(q('.phone-popover')).toBeNull()
  })

  it('moves with the arrow keys, picks with Enter, and Escape closes without changing', async () => {
    const w = mountInput({ countryCode: 'US', preferredCountries: ['US', 'GB'] })
    await openList()
    const search = q<HTMLInputElement>('.phone-search-input')!
    expect(q('.phone-option.is-active .phone-option-name')!.textContent).toBe('United States')
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
    await nextTick()
    expect(q('.phone-option.is-active .phone-option-name')!.textContent).toBe('United Kingdom')
    expect(search.getAttribute('aria-activedescendant')).toBe(q('.phone-option.is-active')!.id)
    search.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await nextTick()
    expect(w.props('countryCode')).toBe('GB')

    await openList()
    q<HTMLInputElement>('.phone-search-input')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    await nextTick()
    expect(q('.phone-popover')).toBeNull()
    expect(w.props('countryCode')).toBe('GB')
  })

  it('closes on an outside click', async () => {
    mountInput()
    await openList()
    document.body.click()
    await nextTick()
    expect(q('.phone-popover')).toBeNull()
  })

  it('an error marks the field invalid and is shown in words', () => {
    mountInput({ error: 'Enter a full mobile number.' })
    expect(q('.phone-field')!.classList.contains('is-invalid')).toBe(true)
    expect(q('input[type=tel]')!.getAttribute('aria-invalid')).toBe('true')
    expect(q('.form-error')!.textContent).toBe('Enter a full mobile number.')
  })

  it('disabled blocks opening and typing', async () => {
    mountInput({ disabled: true })
    expect(q<HTMLButtonElement>('.phone-country')!.disabled).toBe(true)
    expect(q<HTMLInputElement>('input[type=tel]')!.disabled).toBe(true)
  })
})

describe('phone helpers', () => {
  it('toE164 joins country and national digits', () => {
    expect(toE164('IN', '91614 59446')).toBe('+919161459446')
    expect(toE164('US', '(408) 909-7717')).toBe('+14089097717')
    expect(toE164('IN', '')).toBe('')
    expect(toE164('IN', 'abc')).toBe('')
  })

  it('toE164 drops a trunk zero', () => {
    expect(toE164('GB', '07911 123456')).toBe('+447911123456')
  })

  it('fromE164 splits a stored value and falls back for a bare number', () => {
    expect(fromE164('+919161459446', 'US')).toEqual({ iso: 'IN', national: '9161459446' })
    expect(fromE164('9161459446', 'IN')).toEqual({ iso: 'IN', national: '9161459446' })
    expect(fromE164('', 'IN')).toEqual({ iso: 'IN', national: '' })
    expect(fromE164(null, 'US')).toEqual({ iso: 'US', national: '' })
  })

  it('fromE164 never loses an unreadable value', () => {
    expect(fromE164('call reception', 'US')).toEqual({ iso: 'US', national: 'call reception' })
  })

  it('readTypedPhone leaves a number without a plus alone', () => {
    expect(readTypedPhone('98765', 'IN')).toEqual({ iso: 'IN', national: '98765' })
    expect(readTypedPhone('+44 20 7946 0958', 'IN')).toEqual({ iso: 'GB', national: '2079460958' })
  })
})
