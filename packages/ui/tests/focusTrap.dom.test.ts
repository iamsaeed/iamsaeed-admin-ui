// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { effectScope, nextTick, ref } from 'vue'
import { useFocusTrap } from '../src/composables/useFocusTrap'

/**
 * These assert the behaviour that `aria-modal="true"` promises. A trap that
 * merely moves focus in — which is what this library shipped before — passes
 * a casual eyeball test and still lets Tab walk into the page behind.
 */

function mount(html: string) {
  document.body.innerHTML = html
  return document.getElementById('panel') as HTMLElement
}

/** jsdom does not implement layout, so every element reports a zero rect. */
function stubLayout() {
  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    configurable: true,
    value() {
      return { width: 10, height: 10, top: 0, left: 0, right: 10, bottom: 10, x: 0, y: 0 }
    },
  })
}

function tab(shift = false) {
  const e = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: shift, bubbles: true, cancelable: true })
  document.dispatchEvent(e)
  return e
}

describe('useFocusTrap', () => {
  beforeEach(() => {
    stubLayout()
    document.body.innerHTML = ''
  })

  it('moves focus into the container when it opens', async () => {
    const panel = mount(`
      <button id="trigger">open</button>
      <div id="panel"><button id="a">a</button><button id="b">b</button></div>`)
    const open = ref(false)
    const scope = effectScope()
    scope.run(() => useFocusTrap(open, ref(panel)))

    document.getElementById('trigger')!.focus()
    open.value = true
    await nextTick()
    await nextTick()

    expect(document.activeElement?.id).toBe('a')
    scope.stop()
  })

  it('wraps Tab from the last element back to the first', async () => {
    const panel = mount(`<div id="panel"><button id="a">a</button><button id="b">b</button></div>`)
    const open = ref(false)
    const scope = effectScope()
    scope.run(() => useFocusTrap(open, ref(panel)))

    open.value = true
    await nextTick(); await nextTick()

    document.getElementById('b')!.focus()
    const e = tab()
    expect(e.defaultPrevented).toBe(true)
    expect(document.activeElement?.id).toBe('a')
    scope.stop()
  })

  it('wraps Shift+Tab from the first element back to the last', async () => {
    const panel = mount(`<div id="panel"><button id="a">a</button><button id="b">b</button></div>`)
    const open = ref(false)
    const scope = effectScope()
    scope.run(() => useFocusTrap(open, ref(panel)))

    open.value = true
    await nextTick(); await nextTick()

    document.getElementById('a')!.focus()
    const e = tab(true)
    expect(e.defaultPrevented).toBe(true)
    expect(document.activeElement?.id).toBe('b')
    scope.stop()
  })

  it('pulls focus back when it has escaped the container', async () => {
    // The case a naive "focus the first child on open" implementation misses
    // entirely: focus is already outside, and Tab must not continue outward.
    const panel = mount(`
      <button id="outside">outside</button>
      <div id="panel"><button id="a">a</button><button id="b">b</button></div>`)
    const open = ref(false)
    const scope = effectScope()
    scope.run(() => useFocusTrap(open, ref(panel)))

    open.value = true
    await nextTick(); await nextTick()

    document.getElementById('outside')!.focus()
    tab()
    expect(document.activeElement?.id).toBe('a')
    scope.stop()
  })

  it('skips disabled controls', async () => {
    const panel = mount(`
      <div id="panel">
        <button id="a">a</button>
        <button id="skipme" disabled>nope</button>
        <button id="c">c</button>
      </div>`)
    const open = ref(false)
    const scope = effectScope()
    scope.run(() => useFocusTrap(open, ref(panel)))

    open.value = true
    await nextTick(); await nextTick()

    document.getElementById('c')!.focus()
    tab()
    expect(document.activeElement?.id).toBe('a')

    document.getElementById('a')!.focus()
    tab(true)
    expect(document.activeElement?.id).toBe('c') // not the disabled one
    scope.stop()
  })

  it('restores focus to the trigger when it closes', async () => {
    const panel = mount(`
      <button id="trigger">open</button>
      <div id="panel"><button id="a">a</button></div>`)
    const open = ref(false)
    const scope = effectScope()
    scope.run(() => useFocusTrap(open, ref(panel)))

    document.getElementById('trigger')!.focus()
    open.value = true
    await nextTick(); await nextTick()
    expect(document.activeElement?.id).toBe('a')

    open.value = false
    await nextTick(); await nextTick()
    // Without this, focus lands on <body> and the next Tab restarts from the
    // top of the document — the user loses their place on every close.
    expect(document.activeElement?.id).toBe('trigger')
    scope.stop()
  })

  it('stops intercepting Tab once closed', async () => {
    const panel = mount(`<div id="panel"><button id="a">a</button></div>`)
    const open = ref(false)
    const scope = effectScope()
    scope.run(() => useFocusTrap(open, ref(panel)))

    open.value = true
    await nextTick(); await nextTick()
    open.value = false
    await nextTick(); await nextTick()

    // A listener left bound after close would trap the whole page.
    expect(tab().defaultPrevented).toBe(false)
    scope.stop()
  })
})
