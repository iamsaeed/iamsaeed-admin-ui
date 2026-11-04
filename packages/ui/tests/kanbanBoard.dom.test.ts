// @vitest-environment jsdom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import KanbanBoard from '../src/components/ui/KanbanBoard.vue'

/**
 * The board never moves a card itself; it says where the card should go. These pin the three ways to ask (drag,
 * keyboard, the slot's moveTo for touch screens), the neighbours it reports, and the cases that must emit nothing:
 * a drop where the card already was, a locked column, a read-only board.
 */

const columns = () => [
  { id: 'todo', title: 'To do', items: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
  { id: 'doing', title: 'In progress', items: [{ id: 'd' }] },
  { id: 'done', title: 'Done', items: [], locked: false },
]

function mountBoard(props: Record<string, unknown> = {}) {
  return mount(KanbanBoard, {
    props: { columns: columns(), label: 'Board', ...props },
    slots: { card: `<template #card="{ item, moveTo }"><span class="t">{{ item.id }}</span><button class="mv" @click="moveTo('done')">Move</button></template>` },
  })
}

const card = (w: ReturnType<typeof mountBoard>, id: string) => w.get(`[data-testid="kanban-card-${id}"]`)

describe('KanbanBoard: opening a card', () => {
  const openBoard = (props: Record<string, unknown> = {}) => mount(KanbanBoard, {
    props: { columns: columns(), label: 'Board', openable: true, ...props },
    slots: { card: `<template #card="{ item }"><span class="t">{{ item.id }}</span><a class="lnk" href="#">link</a><button class="ctl">x</button><span class="plain" data-kanban-ignore>y</span></template>` },
  })

  it('emits open when the card is clicked anywhere on it', async () => {
    const w = openBoard()
    await card(w, 'b').trigger('click')
    await card(w, 'c').get('.t').trigger('click')
    expect(w.emitted('open')).toEqual([['b'], ['c']])
  })

  it('does not open from a link, a button or an element marked data-kanban-ignore', async () => {
    const w = openBoard()
    await card(w, 'a').get('.lnk').trigger('click')
    await card(w, 'a').get('.ctl').trigger('click')
    await card(w, 'a').get('.plain').trigger('click')
    expect(w.emitted('open')).toBeUndefined()
  })

  it('opens from Enter or Space on the focused card, and keeps Alt+arrow for moving', async () => {
    const w = openBoard()
    await card(w, 'a').trigger('keydown', { key: 'Enter' })
    await card(w, 'a').trigger('keydown', { key: ' ' })
    await card(w, 'a').trigger('keydown', { key: 'ArrowRight', altKey: true })
    expect(w.emitted('open')).toEqual([['a'], ['a']])
    expect(w.emitted('move')).toHaveLength(1)
  })

  it('marks cards as openable only when asked, and emits nothing otherwise', async () => {
    const plain = mountBoard()
    await card(plain, 'a').trigger('click')
    await card(plain, 'a').trigger('keydown', { key: 'Enter' })
    expect(plain.emitted('open')).toBeUndefined()
    expect(card(plain, 'a').classes()).not.toContain('is-openable')
    expect(card(openBoard(), 'a').classes()).toContain('is-openable')
  })
})

describe('KanbanBoard', () => {
  it('renders each column with its cards and count, and names the board', () => {
    const w = mountBoard()
    expect(w.get('[role="region"]').attributes('aria-label')).toBe('Board')
    expect(w.findAll('.kanban-col')).toHaveLength(3)
    expect(w.get('[data-testid="kanban-col-todo"] .kanban-col-count').text()).toBe('3')
    expect(w.get('[data-testid="kanban-col-done"] .kanban-empty').text()).toBe('Nothing here')
  })

  it('Alt+Right moves a card to the end of the next column', async () => {
    const w = mountBoard()
    await card(w, 'b').trigger('keydown', { key: 'ArrowRight', altKey: true })
    expect(w.emitted('move')?.[0]?.[0]).toEqual({ itemId: 'b', fromColumn: 'todo', toColumn: 'doing', beforeId: null, afterId: 'd' })
  })

  it('Alt+Down and Alt+Up reorder within a column with the right neighbours', async () => {
    const w = mountBoard()
    await card(w, 'a').trigger('keydown', { key: 'ArrowDown', altKey: true })
    expect(w.emitted('move')?.[0]?.[0]).toEqual({ itemId: 'a', fromColumn: 'todo', toColumn: 'todo', beforeId: 'c', afterId: 'b' })
    await card(w, 'c').trigger('keydown', { key: 'ArrowUp', altKey: true })
    expect(w.emitted('move')?.[1]?.[0]).toEqual({ itemId: 'c', fromColumn: 'todo', toColumn: 'todo', beforeId: 'b', afterId: 'a' })
  })

  it('arrows without Alt and moves past the edge do nothing', async () => {
    const w = mountBoard()
    await card(w, 'b').trigger('keydown', { key: 'ArrowRight' })
    await card(w, 'a').trigger('keydown', { key: 'ArrowLeft', altKey: true })
    await card(w, 'a').trigger('keydown', { key: 'ArrowUp', altKey: true })
    expect(w.emitted('move')).toBeUndefined()
  })

  it('the slot helper moves a card for touch screens', async () => {
    const w = mountBoard()
    await card(w, 'd').get('.mv').trigger('click')
    expect(w.emitted('move')?.[0]?.[0]).toMatchObject({ itemId: 'd', fromColumn: 'doing', toColumn: 'done', beforeId: null, afterId: null })
  })

  it('a drop on a column puts the card at its end', async () => {
    const w = mountBoard()
    const dataTransfer = { setData: () => {}, getData: () => 'a', effectAllowed: '' }
    await card(w, 'a').trigger('dragstart', { dataTransfer })
    const col = w.get('[data-testid="kanban-col-doing"]')
    await col.trigger('dragover', { dataTransfer })
    await col.trigger('drop', { dataTransfer })
    expect(w.emitted('move')?.[0]?.[0]).toEqual({ itemId: 'a', fromColumn: 'todo', toColumn: 'doing', beforeId: null, afterId: 'd' })
  })

  it('a drop where the card already is emits nothing', async () => {
    const w = mountBoard()
    const dataTransfer = { setData: () => {}, getData: () => 'c', effectAllowed: '' }
    await card(w, 'c').trigger('dragstart', { dataTransfer })
    const col = w.get('[data-testid="kanban-col-todo"]')
    await col.trigger('dragover', { dataTransfer })
    await col.trigger('drop', { dataTransfer })
    expect(w.emitted('move')).toBeUndefined()
  })

  it('a locked column refuses cards, and a read-only board refuses everything', async () => {
    const locked = columns()
    locked[2].locked = true
    const w = mountBoard({ columns: locked })
    await card(w, 'd').get('.mv').trigger('click')
    expect(w.emitted('move')).toBeUndefined()

    const r = mountBoard({ readonly: true })
    await card(r, 'b').trigger('keydown', { key: 'ArrowRight', altKey: true })
    expect(r.emitted('move')).toBeUndefined()
    expect(card(r, 'b').attributes('draggable')).toBe('false')
  })

  it('announces a move for screen readers', async () => {
    const w = mountBoard()
    await card(w, 'b').trigger('keydown', { key: 'ArrowRight', altKey: true })
    expect(w.get('[aria-live="polite"]').text()).toBe('Moved to In progress.')
  })
})
