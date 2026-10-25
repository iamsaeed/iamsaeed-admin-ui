<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../../components/ui/Icon.vue'
import KitBlock from '../../components/kit/KitBlock.vue'
import KanbanBoard from '../../components/ui/KanbanBoard.vue'
import type { KanbanColumn, KanbanMove } from '../../types/kanban'

// Filter-chip demo: one selected value, toggled off by clicking it again.
const region = ref<string | null>('Dubai')
const toggleRegion = (r: string) => { region.value = region.value === r ? null : r }

const rows = [
  { title: 'Designing for clarity', author: 'Marcus Tan', status: 'Published', views: '12,480', updated: '2h ago' },
  { title: 'The case for oklch', author: 'Elena Marsh', status: 'Draft', views: '—', updated: '5h ago' },
  { title: 'Shipping a design system', author: 'Priya N.', status: 'Published', views: '8,204', updated: '1d ago' },
  { title: 'Density without regret', author: 'Sam R.', status: 'Archived', views: '3,118', updated: '3d ago' },
]

// Kanban demo: the page owns the data and applies each move the board asks for.
type Card = { id: string; title: string; key: string }
const board = ref<KanbanColumn<Card>[]>([
  { id: 'todo', title: 'To do', items: [{ id: 'k1', key: 'ASK-1', title: 'Sign-in page' }, { id: 'k2', key: 'ASK-2', title: 'Password reset email' }] },
  { id: 'doing', title: 'In progress', items: [{ id: 'k3', key: 'ASK-3', title: 'Billing settings' }] },
  { id: 'review', title: 'In review', items: [] },
  { id: 'done', title: 'Done', items: [{ id: 'k4', key: 'ASK-4', title: 'Project setup' }] },
])
function applyMove(m: KanbanMove) {
  const from = board.value.find((c) => c.id === m.fromColumn)!
  const to = board.value.find((c) => c.id === m.toColumn)!
  const card = from.items.splice(from.items.findIndex((i) => i.id === m.itemId), 1)[0]
  const at = m.beforeId ? to.items.findIndex((i) => i.id === m.beforeId) : to.items.length
  to.items.splice(at < 0 ? to.items.length : at, 0, card)
}

const badgeFor = (s: string) =>
  s === 'Published' ? 'badge-success' : s === 'Draft' ? 'badge-warn' : 'badge-neutral'
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Data display</h1>
      <p class="page-sub">
        Below md the table re-flows into stacked rows via <code class="font-mono">.data-table-stack</code> —
        headers come from <code class="font-mono">data-label</code>, so there is no duplicate markup.
        Narrow the window to see it.
      </p>
    </div>
  </div>

  <KitBlock label="KPI cards" />
  <div class="grid-auto mb-8">
    <div class="card kpi">
      <div class="flex items-start justify-between">
        <div class="kpi-label">Total readers</div>
        <span class="kpi-icon"><Icon name="users" :size="15" /></span>
      </div>
      <div class="kpi-value">284,592</div>
      <span class="kpi-delta kpi-delta-up"><Icon name="trend-up" :size="11" /> 12.4%</span>
    </div>
    <div class="card kpi">
      <div class="flex items-start justify-between">
        <div class="kpi-label">Published posts</div>
        <span class="kpi-icon"><Icon name="file-text" :size="15" /></span>
      </div>
      <div class="kpi-value">1,247</div>
      <span class="kpi-delta kpi-delta-up"><Icon name="trend-up" :size="11" /> 8.1%</span>
    </div>
    <div class="card kpi">
      <div class="flex items-start justify-between">
        <div class="kpi-label">Avg. read time</div>
        <span class="kpi-icon"><Icon name="zap" :size="15" /></span>
      </div>
      <div class="kpi-value">4m 38s</div>
      <span class="kpi-delta kpi-delta-down"><Icon name="trend-down" :size="11" /> 2.3%</span>
    </div>
  </div>

  <KitBlock label="Table" />
  <div class="card mb-8">
    <div class="card-hd">
      <div>
        <div class="card-title">Recent content</div>
        <div class="card-sub">Latest posts and pages</div>
      </div>
      <button class="btn btn-secondary btn-sm">View all <Icon name="arrow-right" :size="14" /></button>
    </div>
    <div class="table-wrap">
      <table class="data-table data-table-stack" role="table">
        <thead>
          <tr role="row"><th role="columnheader">Title</th><th role="columnheader">Author</th><th role="columnheader">Status</th><th role="columnheader" class="num">Views</th><th role="columnheader">Updated</th></tr>
        </thead>
        <tbody>
          <tr role="row" v-for="r in rows" :key="r.title">
            <td role="cell" data-label="Title"><span class="font-medium">{{ r.title }}</span></td>
            <td role="cell" data-label="Author">
              <span class="flex items-center gap-2">
                <span class="avatar avatar-sm">{{ r.author.slice(0, 1) }}</span>
                <span class="text-muted">{{ r.author }}</span>
              </span>
            </td>
            <td role="cell" data-label="Status"><span class="badge" :class="badgeFor(r.status)">{{ r.status }}</span></td>
            <td role="cell" data-label="Views" class="num tnum text-muted">{{ r.views }}</td>
            <td role="cell" data-label="Updated" class="text-muted">{{ r.updated }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Badges">
      <span class="badge badge-neutral">Neutral</span>
      <span class="badge badge-accent">Accent</span>
      <span class="badge badge-success">Success</span>
      <span class="badge badge-warn">Warning</span>
      <span class="badge badge-danger">Danger</span>
      <span class="badge badge-info">Info</span>
      <span class="badge badge-accent pill">Pill</span>
    </KitBlock>

    <KitBlock label="Filter chips">
      <div class="toolbar !mb-0">
        <button
          v-for="r in ['Dubai', 'Sharjah', 'Ajman']"
          :key="r"
          class="chip"
          :class="{ 'is-active': region === r }"
          :aria-pressed="region === r"
          @click="toggleRegion(r)"
        >
          {{ r }}
        </button>
        <span class="toolbar-sep" aria-hidden="true" />
        <button class="chip" aria-pressed="false">Not contacted</button>
      </div>
    </KitBlock>

    <KitBlock label="Chips & avatars">
      <span class="chip"><span class="dot bg-success" /> Live now</span>
      <span class="chip">design-system <Icon name="x" :size="12" /></span>
      <span class="avatar avatar-sm">A</span>
      <span class="avatar">EM</span>
      <span class="avatar avatar-lg">MT</span>
      <span class="avatar-stack flex">
        <span class="avatar avatar-sm">A</span>
        <span class="avatar avatar-sm">B</span>
        <span class="avatar avatar-sm">C</span>
      </span>
    </KitBlock>

    <KitBlock label="Progress">
      <div class="w-full max-w-sm progress"><div class="progress-bar" style="width: 68%" /></div>
    </KitBlock>
  </div>

  <KitBlock label="Kanban board — drag, Alt+arrows, or the Move menu on touch screens" />
  <KanbanBoard :columns="board" label="Demo board" class="mb-8" @move="applyMove">
    <template #card="{ item, column, moveTo }">
      <div class="text-xs text-muted font-mono">{{ item.key }}</div>
      <div class="text-sm font-medium">{{ item.title }}</div>
      <select class="form-select mt-2 md:hidden" :aria-label="`Move ${item.key}`" :value="column.id" @change="moveTo(($event.target as HTMLSelectElement).value)">
        <option v-for="c in board" :key="c.id" :value="c.id">{{ c.title }}</option>
      </select>
    </template>
  </KanbanBoard>
</template>
