<script setup lang="ts">
/**
 * Backs Images / Videos / Documents. `kind` only changes the tile treatment:
 * images get a thumbnail, the others an icon plaque.
 */
import { ref } from 'vue'
import Icon from '../../components/ui/Icon.vue'

export interface MediaItem {
  id: string | number
  name: string
  meta: string
  /** Any CSS background — a real app passes a URL. */
  swatch?: string
}

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    kind: 'image' | 'video' | 'document'
    items: MediaItem[]
  }>(),
  {},
)

const view = ref<'grid' | 'list'>('grid')
const iconFor = { image: 'image', video: 'video', document: 'file-text' } as const
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">{{ title }}</h1>
      <p v-if="subtitle" class="page-sub">{{ subtitle }}</p>
    </div>
    <div class="page-actions">
      <div class="btn-group">
        <button class="btn" :aria-pressed="view === 'grid'" @click="view = 'grid'">
          <Icon name="layers" :size="14" /> Grid
        </button>
        <button class="btn" :aria-pressed="view === 'list'" @click="view = 'list'">
          <Icon name="menu" :size="14" /> List
        </button>
      </div>
      <button class="btn btn-primary"><Icon name="upload" :size="15" /> Upload</button>
    </div>
  </div>

  <div v-if="view === 'grid'" class="grid-auto">
    <figure v-for="m in items" :key="m.id" class="card card-interactive overflow-hidden">
      <div
        class="aspect-[4/3] grid place-items-center bg-sunken text-subtle"
        :style="m.swatch ? { background: m.swatch } : undefined"
      >
        <Icon v-if="!m.swatch" :name="iconFor[kind]" :size="28" />
      </div>
      <figcaption class="p-3">
        <div class="text-xs font-medium truncate">{{ m.name }}</div>
        <div class="text-[0.6875rem] text-subtle">{{ m.meta }}</div>
      </figcaption>
    </figure>
  </div>

  <div v-else class="card">
    <div class="table-wrap">
      <table class="data-table data-table-stack" role="table">
        <thead><tr role="row"><th role="columnheader">Name</th><th role="columnheader">Details</th><th role="columnheader" class="w-10"><span class="sr-only">Actions</span></th></tr></thead>
        <tbody>
          <tr role="row" v-for="m in items" :key="m.id">
            <td role="cell" data-label="Name">
              <span class="flex items-center gap-3">
                <span class="grid place-items-center w-8 h-8 rounded-xs bg-sunken text-subtle shrink-0">
                  <Icon :name="iconFor[kind]" :size="15" />
                </span>
                <span class="font-medium">{{ m.name }}</span>
              </span>
            </td>
            <td role="cell" data-label="Details" class="text-muted">{{ m.meta }}</td>
            <td role="cell" data-label="">
              <button class="btn btn-ghost btn-icon btn-sm"><Icon name="more" label="Actions" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
