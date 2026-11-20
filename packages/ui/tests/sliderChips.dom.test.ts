// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import SliderField from '../src/components/ui/SliderField.vue'
import ChoiceChips from '../src/components/ui/ChoiceChips.vue'

const OPTIONS = [{ value: 'a', label: 'A' }, { value: 'b', label: 'B', hint: 'Second' }, { value: 'c', label: 'C' }]

describe('SliderField', () => {
  const base = { id: 's', label: 'Speed', min: 0.5, max: 2, step: 0.05, unit: 'x', decimals: 2 }

  it('shows the label and the value beside the slider', () => {
    const w = mount(SliderField, { props: { ...base, modelValue: 1.25 } })
    expect(w.find('label').text()).toBe('Speed')
    expect(w.find('output').text()).toBe('1.25x')
    expect(w.find('input').attributes('aria-valuetext')).toBe('1.25x')
  })

  it('uses the fallback when no value is set, then the minimum', () => {
    expect(mount(SliderField, { props: { ...base, modelValue: null, fallback: 1 } }).find('output').text()).toBe('1.00x')
    expect(mount(SliderField, { props: { ...base, modelValue: null } }).find('output').text()).toBe('0.50x')
  })

  it('clamps an out-of-range value into the range', () => {
    expect(mount(SliderField, { props: { ...base, modelValue: 9 } }).find('output').text()).toBe('2.00x')
  })

  it('emits a number when moved', async () => {
    const w = mount(SliderField, { props: { ...base, modelValue: 1 } })
    await w.find('input').setValue('1.5')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([1.5])
  })

  it('shows end labels and a hint only when given, and can be disabled', () => {
    const w = mount(SliderField, { props: { ...base, modelValue: 1, minLabel: 'Slow', maxLabel: 'Fast', hint: 'Pace', disabled: true } })
    expect(w.find('.slider-ends').text()).toContain('Slow')
    expect(w.find('.slider-ends').text()).toContain('Fast')
    expect(w.text()).toContain('Pace')
    expect(w.find('input').attributes('disabled')).toBeDefined()
    expect(mount(SliderField, { props: { ...base, modelValue: 1 } }).find('.slider-ends').exists()).toBe(false)
  })
})

describe('ChoiceChips', () => {
  it('marks the chosen option as a radio and emits the pick', async () => {
    const w = mount(ChoiceChips, { props: { label: 'Look', options: OPTIONS, modelValue: 'b' } })
    expect(w.find('[role=radiogroup]').exists()).toBe(true)
    const r = w.findAll('button')
    expect(r.map((b) => b.attributes('aria-checked'))).toEqual(['false', 'true', 'false'])
    expect(r[1]!.attributes('title')).toBe('Second')
    await r[2]!.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual(['c'])
  })

  it('with multiple, toggles values in and out and uses pressed buttons', async () => {
    const w = mount(ChoiceChips, { props: { label: 'Tags', options: OPTIONS, modelValue: ['a'], multiple: true } })
    expect(w.find('[role=group]').exists()).toBe(true)
    expect(w.findAll('button').map((b) => b.attributes('aria-pressed'))).toEqual(['true', 'false', 'false'])
    await w.findAll('button')[1]!.trigger('click')
    expect(w.emitted('update:modelValue')?.[0]).toEqual([['a', 'b']])
    await w.findAll('button')[0]!.trigger('click')
    expect(w.emitted('update:modelValue')?.[1]).toEqual([[]])
  })

  it('does not emit when disabled', async () => {
    const w = mount(ChoiceChips, { props: { label: 'Look', options: OPTIONS, modelValue: 'a', disabled: true } })
    await w.findAll('button')[1]!.trigger('click')
    expect(w.emitted('update:modelValue')).toBeUndefined()
  })
})
