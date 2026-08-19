<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../../components/ui/Icon.vue'
import KitBlock from '../../components/kit/KitBlock.vue'

const tab = ref('general')
const tabs = [
  { id: 'general', label: 'General' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'billing', label: 'Billing' },
]
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Navigation</h1>
      <p class="page-sub">Tabs scroll horizontally on narrow screens rather than wrapping or truncating.</p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Tabs">
      <div class="w-full">
        <div class="tabs">
          <button
            v-for="t in tabs"
            :key="t.id"
            class="tab"
            :class="tab === t.id ? 'is-active' : ''"
            @click="tab = t.id"
          >
            {{ t.label }}
          </button>
        </div>
        <div class="pt-4 text-muted text-xs">Panel: {{ tab }}</div>
      </div>
    </KitBlock>

    <KitBlock label="Breadcrumb">
      <nav class="breadcrumb">
        <a href="#">Content</a><Icon name="chevron-right" :size="12" />
        <a href="#">Posts</a><Icon name="chevron-right" :size="12" />
        <span class="text-fg">Designing for clarity</span>
      </nav>
    </KitBlock>

    <KitBlock label="Nav items">
      <div class="w-full max-w-xs">
        <div class="nav-section">Workspace</div>
        <button class="nav-item w-full is-active"><Icon name="home" :size="18" /> Dashboard</button>
        <button class="nav-item w-full"><Icon name="file-text" :size="18" /> Content <span class="badge badge-neutral ml-auto">24</span></button>
        <button class="nav-item nav-item-sub w-full">Posts</button>
        <button class="nav-item nav-item-sub w-full">Drafts</button>
      </div>
    </KitBlock>

    <KitBlock label="Menu">
      <div class="menu">
        <button class="menu-item"><Icon name="edit" :size="15" /> Edit</button>
        <button class="menu-item"><Icon name="copy" :size="15" /> Duplicate</button>
        <button class="menu-item"><Icon name="download" :size="15" /> Export</button>
        <div class="menu-sep" />
        <button class="menu-item menu-item-danger"><Icon name="trash" :size="15" /> Delete</button>
      </div>
    </KitBlock>

    <KitBlock label="Tooltip">
      <span class="tooltip">Publishes immediately</span>
    </KitBlock>
  </div>
</template>
