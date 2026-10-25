/** Shapes for KanbanBoard.vue: a column of cards, and where a card should move to. */
export interface KanbanColumn<I> {
  id: string
  title: string
  items: I[]
  /** Shown beside the title instead of the item count, e.g. "3 of 12". */
  countLabel?: string
  /** Drops are refused (no drop target, no keyboard move into it). */
  locked?: boolean
}

/** Where a card should go. `beforeId` is the card it now sits above; null means the end of the column. */
export interface KanbanMove {
  itemId: string
  fromColumn: string
  toColumn: string
  beforeId: string | null
  afterId: string | null
}
