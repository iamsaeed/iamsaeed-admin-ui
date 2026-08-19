<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../components/ui/Icon.vue'

const tab = ref('categories')
const categories = [
  { name: 'Engineering', slug: 'engineering', count: 42 },
  { name: 'Design', slug: 'design', count: 31 },
  { name: 'Product', slug: 'product', count: 18 },
  { name: 'Company', slug: 'company', count: 9 },
]
const tags = ['design-system','oklch','accessibility','vue','tailwind','tokens','mobile','performance','testing','release']
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Taxonomies</h1>
      <p class="page-sub">How content is grouped and found.</p>
    </div>
  </div>

  <div class="tabs mb-5">
    <button class="tab" :class="tab === 'categories' ? 'is-active' : ''" @click="tab = 'categories'">Categories</button>
    <button class="tab" :class="tab === 'tags' ? 'is-active' : ''" @click="tab = 'tags'">Tags</button>
  </div>

  <div v-if="tab === 'categories'" class="grid gap-4 lg:grid-cols-[2fr_1fr]">
    <div class="card">
      <div class="table-wrap">
        <table class="data-table data-table-stack" role="table">
          <thead><tr role="row"><th role="columnheader">Name</th><th role="columnheader">Slug</th><th role="columnheader" class="num">Posts</th><th role="columnheader" class="w-10"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>
            <tr role="row" v-for="c in categories" :key="c.slug">
              <td role="cell" data-label="Name" class="font-medium">{{ c.name }}</td>
              <td role="cell" data-label="Slug"><code class="font-mono text-xs text-muted">{{ c.slug }}</code></td>
              <td role="cell" data-label="Posts" class="num tnum text-muted">{{ c.count }}</td>
              <td role="cell" data-label=""><button class="btn btn-ghost btn-icon btn-sm"><Icon name="more" label="Actions" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card card-p">
      <div class="card-title mb-3">Add category</div>
      <form class="flex flex-col gap-3">
        <div class="form-group">
          <label class="form-label" for="cat-name">Name</label>
          <input id="cat-name" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label" for="cat-slug">Slug</label>
          <input id="cat-slug" class="form-input" />
          <p class="form-hint">Lowercase, hyphenated.</p>
        </div>
        <button class="btn btn-primary btn-block">Add</button>
      </form>
    </div>
  </div>

  <div v-else class="card card-p">
    <div class="flex flex-wrap gap-2">
      <span v-for="t in tags" :key="t" class="chip">
        {{ t }}
        <button class="btn btn-ghost btn-icon btn-sm !h-5 !w-5"><Icon name="x" :size="11" label="Remove" /></button>
      </span>
    </div>
  </div>
</template>
