// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import UserMenu from '../src/components/layout/UserMenu.vue'

/**
 * The menu-button pattern, asserted rather than assumed.
 *
 * A dropdown that opens on click and looks right is the easy half. The half
 * that gets skipped is the keyboard contract: focus landing on the first item,
 * arrows wrapping, Escape handing focus BACK to the trigger. Without that last
 * one a keyboard user is dropped on <body> and has to Tab from the top of the
 * document again.
 */

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(UserMenu, {
    attachTo: document.body,
    props: { userName: 'Marcus Tan', userEmail: 'marcus@example.com', ...props },
  })
}

const trigger = (w: ReturnType<typeof mountMenu>) => w.get('button[aria-haspopup="menu"]')
const items = (w: ReturnType<typeof mountMenu>) => w.findAll('[role="menuitem"]')

function keyOn(el: Element, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

describe('UserMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('is closed initially and says so to assistive tech', () => {
    const w = mountMenu()

    expect(trigger(w).attributes('aria-expanded')).toBe('false')
    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('opens on click and offers settings and sign out by default', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')

    expect(trigger(w).attributes('aria-expanded')).toBe('true')
    expect(items(w).map((i) => i.text())).toEqual(['Settings', 'Sign out'])
  })

  it('takes its entries as data when given some', async () => {
    const w = mountMenu({
      items: [
        { id: 'profile', label: 'Profile' },
        { id: 'workspace', label: 'Switch workspace' },
      ],
    })
    await trigger(w).trigger('click')

    expect(items(w).map((i) => i.text())).toEqual(['Profile', 'Switch workspace'])
  })

  it('emits the selected id and closes', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await items(w)[1].trigger('click')

    expect(w.emitted('select')).toEqual([['sign-out']])
    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('moves focus to the first item when opened', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    expect(document.activeElement).toBe(items(w)[0].element)
  })

  it('opens onto the LAST item when opened with ArrowUp', async () => {
    const w = mountMenu()
    keyOn(trigger(w).element, 'ArrowUp')
    await w.vm.$nextTick()
    await w.vm.$nextTick()

    const all = items(w)
    expect(document.activeElement).toBe(all[all.length - 1].element)
  })

  it('wraps arrow navigation at both ends', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    const all = items(w).map((i) => i.element)

    keyOn(document.activeElement!, 'ArrowUp')
    expect(document.activeElement).toBe(all[all.length - 1])

    keyOn(document.activeElement!, 'ArrowDown')
    expect(document.activeElement).toBe(all[0])
  })

  it('jumps to the ends with Home and End', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    const all = items(w).map((i) => i.element)

    keyOn(document.activeElement!, 'End')
    expect(document.activeElement).toBe(all[all.length - 1])

    keyOn(document.activeElement!, 'Home')
    expect(document.activeElement).toBe(all[0])
  })

  it('closes on Escape and gives focus back to the trigger', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    keyOn(document.activeElement!, 'Escape')
    await w.vm.$nextTick()

    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('still closes on Escape when focus has left the menu', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()
    ;(document.activeElement as HTMLElement)?.blur()

    keyOn(document.body, 'Escape')
    await w.vm.$nextTick()

    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('closes on Tab without stealing focus back', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    const first = items(w)[0].element
    keyOn(first, 'Tab')
    await w.vm.$nextTick()

    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).not.toBe(trigger(w).element)
  })

  it('closes when a pointer lands outside it', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()

    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('stays open when the pointer lands inside it', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    items(w)[0].element.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()

    expect(w.find('[role="menu"]').exists()).toBe(true)
  })

  it('is not marked aria-modal — a menu is not a dialog', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')

    expect(w.get('[role="menu"]').attributes('aria-modal')).toBeUndefined()
  })
})
