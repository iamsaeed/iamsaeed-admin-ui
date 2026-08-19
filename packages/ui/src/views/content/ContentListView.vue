<script setup lang="ts">
/**
 * One component backs Posts / Pages / Drafts / Archive.
 *
 * The four screens in the original template were four near-identical files;
 * they differ only in title, rows, and which bulk actions apply. Collapsing
 * them means a fix to the table reaches all four.
 */
import { computed, ref } from 'vue'
import Icon from '../../components/ui/Icon.vue'

export interface ContentRow {
  id: string | number
  title: string
  author: string
  status: 'Published' | 'Draft' | 'Scheduled' | 'Archived'
  views?: string
  updated: string
}

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    rows: ContentRow[]
    createLabel?: string
  }>(),
  { createLabel: 'New post' },
)

const emit = defineEmits<{ create: []; open: [id: string | number] }>()

const query = ref('')
const selected = ref<Set<string | number>>(new Set())

const filtered = computed(() =>
  props.rows.filter((r) => r.title.toLowerCase().includes(query.value.toLowerCase())),
)

const badgeFor = (s: ContentRow['status']) =>
  ({ Published: 'badge-success', Draft: 'badge-warn', Scheduled: 'badge-info', Archived: 'badge-neutral' })[s]

function toggle(id: string | number) {
  const next = new Set(selected.value)
  next.has(id) ? next.delete(id) : next.add(id)
  selected.value = next
}
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-sub">{{ subtitle }}</p>
    </div>
    <div class="page-actions">
      <button class="btn btn-secondary"><Icon name="upload" :size="15" /> Import</button>
      <button class="btn btn-primary" @click="emit('create')">
        <Icon name="plus" :size="15" /> {{ createLabel }}
      </button>
    </div>
  </div>

  <div class="toolbar">
    <div class="input-group flex-1 min-w-52">
      <span class="input-group-icon"><Icon name="search" :size="15" /></span>
      <input v-model="query" class="form-input" placeholder="Search by title…" />
    </div>
    <button class="btn btn-secondary"><Icon name="filter" :size="15" /> Filter</button>
    <button class="btn btn-secondary"><Icon name="sliders" :size="15" /> Sort</button>
  </div>

  <!-- Bulk bar appears only with a selection; it must never occupy layout otherwise. -->
  <div v-if="selected.size" class="alert alert-info mb-4 items-center">
    <span class="flex-1">{{ selected.size }} selected</span>
    <button class="btn btn-ghost btn-sm"><Icon name="archive" :size="14" /> Archive</button>
    <button class="btn btn-ghost btn-sm text-danger"><Icon name="trash" :size="14" /> Delete</button>
  </div>

  <div class="card">
    <div class="table-wrap">
      <table class="data-table data-table-stack" role="table">
        <thead>
          <tr role="row">
            <th role="columnheader" class="w-10"><span class="sr-only">Select</span></th>
            <th role="columnheader">Title</th><th role="columnheader">Author</th><th role="columnheader">Status</th><th role="columnheader" class="num">Views</th><th role="columnheader">Updated</th>
            <th role="columnheader" class="w-10"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody>
          <tr role="row" v-for="r in filtered" :key="r.id">
            <td role="cell" data-label="">
              <input type="checkbox" :checked="selected.has(r.id)" @change="toggle(r.id)" />
            </td>
            <td role="cell" data-label="Title">
              <button class="font-medium text-left hover:text-accent" @click="emit('open', r.id)">
                {{ r.title }}
              </button>
            </td>
            <td role="cell" data-label="Author">
              <span class="flex items-center gap-2">
                <span class="avatar avatar-sm">{{ r.author.slice(0, 1) }}</span>
                <span class="text-muted">{{ r.author }}</span>
              </span>
            </td>
            <td role="cell" data-label="Status"><span class="badge" :class="badgeFor(r.status)">{{ r.status }}</span></td>
            <td role="cell" data-label="Views" class="num tnum text-muted">{{ r.views ?? '—' }}</td>
            <td role="cell" data-label="Updated" class="text-muted">{{ r.updated }}</td>
            <td role="cell" data-label="">
              <button class="btn btn-ghost btn-icon btn-sm"><Icon name="more" label="Row actions" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="!filtered.length" class="empty-state">
      <span class="empty-state-icon"><Icon name="inbox" :size="22" /></span>
      <div class="font-medium text-fg">Nothing here</div>
      <div class="text-xs">Try a different search.</div>
    </div>

    <div class="card-ft flex items-center justify-between text-xs text-muted">
      <span>{{ filtered.length }} of {{ rows.length }}</span>
      <span class="flex gap-1">
        <button class="btn btn-ghost btn-icon btn-sm"><Icon name="chevron-left" :size="14" label="Previous" /></button>
        <button class="btn btn-ghost btn-icon btn-sm"><Icon name="chevron-right" :size="14" label="Next" /></button>
      </span>
    </div>
  </div>
</template>
