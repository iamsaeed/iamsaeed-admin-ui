// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import NotificationsMenu from '../src/components/layout/NotificationsMenu.vue'
import type { NotificationItem } from '../src/types/notifications'

/**
 * The bell shipped as a red dot on a button that did nothing. These assert the
 * two halves of fixing that: it opens, and it is legible to someone who cannot
 * see the dot — the unread count belongs in the accessible name, not only in
 * a coloured circle.
 */

const ITEMS: NotificationItem[] = [
  { id: 'n1', title: 'Invoice paid', body: 'Talbot & Rowe', time: '2h ago', unread: true },
  { id: 'n2', title: 'Deal stalled', body: 'Kestrel Health', time: '2d ago' },
]

function mountMenu(props: Record<string, unknown> = {}) {
  return mount(NotificationsMenu, { attachTo: document.body, props: { items: ITEMS, ...props } })
}

const trigger = (w: ReturnType<typeof mountMenu>) => w.get('button[aria-haspopup="menu"]')

function keyOn(el: Element, key: string) {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }))
}

describe('NotificationsMenu', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('opens the menu when the bell is clicked', async () => {
    const w = mountMenu()
    expect(w.find('[role="menu"]').exists()).toBe(false)

    await trigger(w).trigger('click')

    expect(w.find('[role="menu"]').exists()).toBe(true)
    expect(trigger(w).attributes('aria-expanded')).toBe('true')
  })

  it('lists the notifications it was given', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')

    const text = w.get('[role="menu"]').text()
    expect(text).toContain('Invoice paid')
    expect(text).toContain('Kestrel Health')
  })

  it('puts the unread count in the accessible name, not only in the dot', () => {
    const w = mountMenu()

    expect(trigger(w).attributes('aria-label')).toBe('Notifications, 1 unread')
  })

  it('says plain Notifications when nothing is unread', () => {
    const w = mountMenu({ items: [{ id: 'n1', title: 'Read already' }] })

    expect(trigger(w).attributes('aria-label')).toBe('Notifications')
  })

  it('lets an explicit count override the derived one', () => {
    const w = mountMenu({ count: 9 })

    expect(trigger(w).attributes('aria-label')).toBe('Notifications, 9 unread')
  })

  it('shows an empty state rather than a blank panel', async () => {
    const w = mountMenu({ items: [] })
    await trigger(w).trigger('click')

    expect(w.get('[role="menu"]').text()).toContain("You're all caught up.")
  })

  it('hides mark-all-read when there is nothing unread', async () => {
    const w = mountMenu({ items: [{ id: 'n1', title: 'Read already' }] })
    await trigger(w).trigger('click')

    expect(w.get('[role="menu"]').text()).not.toContain('Mark all read')
  })

  it('emits the id of the notification clicked, and closes', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.findAll('[role="menuitem"]')[1].trigger('click')

    expect(w.emitted('select')).toEqual([['n1']])
    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('emits viewAll from the footer action', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')

    const all = w.findAll('[role="menuitem"]')
    await all[all.length - 1].trigger('click')

    expect(w.emitted('viewAll')).toHaveLength(1)
  })

  it('emits markAllRead without closing, so the list can be seen to change', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.findAll('[role="menuitem"]')[0].trigger('click')

    expect(w.emitted('markAllRead')).toHaveLength(1)
    expect(w.find('[role="menu"]').exists()).toBe(true)
  })

  it('moves focus into the list and wraps with the arrows', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    const all = w.findAll('[role="menuitem"]').map((i) => i.element)
    expect(document.activeElement).toBe(all[0])

    keyOn(document.activeElement!, 'ArrowUp')
    expect(document.activeElement).toBe(all[all.length - 1])
  })

  it('closes on Escape and gives focus back to the bell', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    keyOn(document.activeElement!, 'Escape')
    await w.vm.$nextTick()

    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('closes when a pointer lands outside it', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }))
    await w.vm.$nextTick()

    expect(w.find('[role="menu"]').exists()).toBe(false)
  })

  it('still closes on Escape after focus has fallen out of the menu', async () => {
    // Regression: mark-all-read removes its own button, dropping focus to
    // <body>. A menu-scoped Escape handler never fires from there, leaving an
    // open menu the keyboard cannot dismiss.
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()
    ;(document.activeElement as HTMLElement)?.blur()

    keyOn(document.body, 'Escape')
    await w.vm.$nextTick()

    expect(w.find('[role="menu"]').exists()).toBe(false)
    expect(document.activeElement).toBe(trigger(w).element)
  })

  it('pulls focus back into the menu when the focused item disappears', async () => {
    // A removed element takes the focus ring with it and the browser reports a
    // focusout whose relatedTarget is null — that is the signal this handles.
    // jsdom does not dispatch that event on removal, so the event is raised
    // directly here; what is under test is the response to it, not the DOM
    // semantics that produce it.
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()
    ;(document.activeElement as HTMLElement)?.blur()

    w.get('[role="menu"]').element.dispatchEvent(
      new FocusEvent('focusout', { relatedTarget: null, bubbles: true }),
    )
    await w.vm.$nextTick()
    await w.vm.$nextTick()

    expect(w.get('[role="menu"]').element.contains(document.activeElement)).toBe(true)
  })

  it('leaves focus alone when it moves somewhere real', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')
    await w.vm.$nextTick()

    const outside = document.createElement('button')
    document.body.appendChild(outside)

    w.get('[role="menu"]').element.dispatchEvent(
      new FocusEvent('focusout', { relatedTarget: outside, bubbles: true }),
    )
    outside.focus()
    await w.vm.$nextTick()
    await w.vm.$nextTick()

    expect(document.activeElement).toBe(outside)
  })

  it('is not marked aria-modal — a menu is not a dialog', async () => {
    const w = mountMenu()
    await trigger(w).trigger('click')

    expect(w.get('[role="menu"]').attributes('aria-modal')).toBeUndefined()
  })
})
