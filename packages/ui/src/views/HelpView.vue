<script setup lang="ts">
import Icon from '../components/ui/Icon.vue'

const topics = [
  { icon: 'zap', title: 'Getting started', desc: 'Install the package, wire the shell, ship your first screen.' },
  { icon: 'sparkles', title: 'Theming', desc: 'The four axes, how skins work, and per-tenant brand colours.' },
  { icon: 'layers', title: 'Components', desc: 'Every primitive with its class names and props.' },
  { icon: 'shield', title: 'Accessibility', desc: 'Focus, touch targets, reduced motion and forced colours.' },
  { icon: 'plug', title: 'Integrations', desc: 'Laravel Blade, Vite, and router-less usage.' },
  { icon: 'code', title: 'Contributing', desc: 'Adding a component or a skin without forking.' },
]
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Help &amp; docs</h1>
      <p class="page-sub">Everything about building on this design system.</p>
    </div>
  </div>

  <div class="input-group max-w-lg mb-6">
    <span class="input-group-icon"><Icon name="search" :size="15" /></span>
    <input class="form-input" placeholder="Search the docs…" />
  </div>

  <div class="grid-auto">
    <a v-for="t in topics" :key="t.title" href="#" class="card card-p card-interactive">
      <span class="kpi-icon mb-3"><Icon :name="t.icon" :size="16" /></span>
      <div class="card-title text-fg">{{ t.title }}</div>
      <p class="text-xs text-muted mt-1">{{ t.desc }}</p>
    </a>
  </div>

  <div class="card card-p mt-6 flex-col !items-start sm:!flex-row sm:!items-center gap-4">
    <div class="flex-1">
      <div class="card-title">Still stuck?</div>
      <p class="text-xs text-muted mt-1">We usually reply within a working day.</p>
    </div>
    <button class="btn btn-primary btn-block-mobile"><Icon name="mail" :size="15" /> Contact support</button>
  </div>
</template>
