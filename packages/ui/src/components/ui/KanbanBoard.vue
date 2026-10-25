<script setup lang="ts" generic="T extends { id: string }">
/**
 * A board of columns holding cards. It never moves a card itself: it emits `move` with where the card should go and
 * the consumer updates its data (usually after the server agrees). Three ways to move, so no one is left out:
 *  - drag and drop (desktop, native HTML5, no library);
 *  - keyboard on a focused card: Alt+Left / Alt+Right to the neighbouring column, Alt+Up / Alt+Down to reorder;
 *  - the `card` slot's `moveTo(columnId)` helper, for a "Move to" control on touch screens, where native drag is absent.
 * Mobile-first: columns sit in a horizontal, snap-scrolling strip; from md they share the width.
 *
 * Links inside a card should carry `draggable="false"`: a browser drags a link by itself, so without it grabbing the
 * card on its title drags the link and the board never sees a move.
 */
import { ref } from 'vue'
import type { KanbanColumn, KanbanMove } from '../../types/kanban'

const props = withDefaults(defineProps<{
  columns: KanbanColumn<T>[]
  /** Accessible name of the whole board. */
  label: string
  /** Text in an empty column. */
  emptyText?: string
  /** Disables every way of moving (read-only board). */
  readonly?: boolean
  testid?: string
}>(), { emptyText: 'Nothing here', readonly: false, testid: 'kanban' })

const emit = defineEmits<{ move: [move: KanbanMove] }>()

const dragging = ref<{ id: string; from: string } | null>(null)
const over = ref<{ column: string; beforeId: string | null } | null>(null)
const announcement = ref('')

function columnOf(itemId: string): KanbanColumn<T> | undefined {
  return props.columns.find((c) => c.items.some((i) => i.id === itemId))
}

/** Neighbours of a card at a position, ignoring the card itself (it is leaving that spot). */
function neighbours(column: KanbanColumn<T>, beforeId: string | null, movingId: string) {
  const ids = column.items.map((i) => i.id).filter((id) => id !== movingId)
  const at = beforeId === null ? ids.length : ids.indexOf(beforeId)
  const index = at < 0 ? ids.length : at
  return { beforeId: ids[index] ?? null, afterId: index > 0 ? ids[index - 1] : null }
}

function request(itemId: string, toColumn: string, beforeId: string | null) {
  const from = columnOf(itemId)
  const to = props.columns.find((c) => c.id === toColumn)
  if (props.readonly || !from || !to || (to.locked && to.id !== from.id)) return
  const n = neighbours(to, beforeId, itemId)
  const currentIndex = from.items.findIndex((i) => i.id === itemId)
  const currentBefore = from.items[currentIndex + 1]?.id ?? null
  if (from.id === to.id && n.beforeId === currentBefore) return // dropped where it already was
  emit('move', { itemId, fromColumn: from.id, toColumn: to.id, beforeId: n.beforeId, afterId: n.afterId })
  announcement.value = `Moved to ${to.title}.`
}

function moveTo(itemId: string, toColumn: string) {
  request(itemId, toColumn, null)
}

/* ── drag and drop ─────────────────────────────────────────────────────── */
function onDragStart(e: DragEvent, item: T, column: KanbanColumn<T>) {
  if (props.readonly) return
  dragging.value = { id: item.id, from: column.id }
  e.dataTransfer?.setData('text/plain', item.id)
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move'
}
function onDragOverCard(e: DragEvent, column: KanbanColumn<T>, item: T) {
  if (!dragging.value || column.locked) return
  e.preventDefault()
  const el = e.currentTarget as HTMLElement
  const rect = el.getBoundingClientRect()
  const below = e.clientY > rect.top + rect.height / 2
  const idx = column.items.findIndex((i) => i.id === item.id)
  over.value = { column: column.id, beforeId: below ? (column.items[idx + 1]?.id ?? null) : item.id }
}
function onDragOverColumn(e: DragEvent, column: KanbanColumn<T>) {
  if (!dragging.value || column.locked) return
  e.preventDefault()
  if (over.value?.column !== column.id) over.value = { column: column.id, beforeId: null }
}
function onDrop(e: DragEvent, column: KanbanColumn<T>) {
  e.preventDefault()
  const id = dragging.value?.id ?? e.dataTransfer?.getData('text/plain')
  const beforeId = over.value?.column === column.id ? over.value.beforeId : null
  if (id) request(id, column.id, beforeId)
  onDragEnd()
}
function onDragEnd() {
  dragging.value = null
  over.value = null
}

/* ── keyboard ──────────────────────────────────────────────────────────── */
function onKey(e: KeyboardEvent, item: T, column: KanbanColumn<T>) {
  if (!e.altKey || props.readonly) return
  const ci = props.columns.findIndex((c) => c.id === column.id)
  const ii = column.items.findIndex((i) => i.id === item.id)
  let handled = true
  if (e.key === 'ArrowRight' && ci < props.columns.length - 1) request(item.id, props.columns[ci + 1].id, null)
  else if (e.key === 'ArrowLeft' && ci > 0) request(item.id, props.columns[ci - 1].id, null)
  else if (e.key === 'ArrowUp' && ii > 0) request(item.id, column.id, column.items[ii - 1].id)
  else if (e.key === 'ArrowDown' && ii < column.items.length - 1) request(item.id, column.id, column.items[ii + 2]?.id ?? null)
  else handled = false
  if (handled) e.preventDefault()
}
</script>

<template>
  <div class="kanban" role="region" :aria-label="label" :data-testid="testid">
    <section
      v-for="column in columns"
      :key="column.id"
      class="kanban-col"
      :class="{ 'is-over': over?.column === column.id, 'is-locked': column.locked }"
      :aria-label="column.title"
      :data-testid="`${testid}-col-${column.id}`"
      @dragover="onDragOverColumn($event, column)"
      @drop="onDrop($event, column)"
    >
      <header class="kanban-col-hd">
        <span class="kanban-col-title">{{ column.title }}</span>
        <span class="kanban-col-count">{{ column.countLabel ?? column.items.length }}</span>
      </header>
      <ol class="kanban-list">
        <li
          v-for="item in column.items"
          :key="item.id"
          class="kanban-card"
          :class="{ 'is-dragging': dragging?.id === item.id, 'is-drop-before': over?.column === column.id && over.beforeId === item.id }"
          :draggable="!readonly"
          tabindex="0"
          :aria-roledescription="readonly ? undefined : 'Movable card'"
          :aria-keyshortcuts="readonly ? undefined : 'Alt+ArrowLeft Alt+ArrowRight Alt+ArrowUp Alt+ArrowDown'"
          :data-testid="`${testid}-card-${item.id}`"
          @dragstart="onDragStart($event, item, column)"
          @dragover="onDragOverCard($event, column, item)"
          @dragend="onDragEnd"
          @keydown="onKey($event, item, column)"
        >
          <slot name="card" :item="item" :column="column" :move-to="(to: string) => moveTo(item.id, to)" />
        </li>
        <li v-if="over?.column === column.id && over.beforeId === null && dragging" class="kanban-drop-end" aria-hidden="true" />
      </ol>
      <p v-if="!column.items.length" class="kanban-empty">{{ emptyText }}</p>
    </section>
    <p class="sr-only" aria-live="polite">{{ announcement }}</p>
  </div>
</template>
