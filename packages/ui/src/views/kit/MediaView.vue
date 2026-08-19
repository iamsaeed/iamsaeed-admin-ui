<script setup lang="ts">
import KitBlock from '../../components/kit/KitBlock.vue'
import Icon from '../../components/ui/Icon.vue'

const grads = [
  'linear-gradient(135deg, var(--lm-c1), var(--lm-c2))',
  'linear-gradient(135deg, var(--lm-c3), var(--lm-c4))',
  'linear-gradient(135deg, var(--lm-c5), var(--lm-c1))',
  'linear-gradient(135deg, var(--lm-c2), var(--lm-c4))',
]
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Media &amp; avatars</h1>
      <p class="page-sub">Thumbnails, avatars and upload affordances.</p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Avatars">
      <span class="avatar avatar-sm">A</span>
      <span class="avatar">EM</span>
      <span class="avatar avatar-lg">MT</span>
      <span class="avatar-stack flex">
        <span class="avatar">A</span><span class="avatar">B</span><span class="avatar">C</span>
        <span class="avatar !bg-sunken !text-muted">+4</span>
      </span>
      <span class="relative inline-flex">
        <span class="avatar">JO</span>
        <span class="absolute -bottom-0.5 -right-0.5 dot bg-success ring-2 ring-[var(--lm-surface)]" />
      </span>
    </KitBlock>

    <KitBlock label="Thumbnails">
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl">
        <figure v-for="(g, i) in grads" :key="i" class="card overflow-hidden">
          <div class="aspect-[4/3]" :style="{ background: g }" />
          <figcaption class="p-2 text-[0.6875rem] text-muted truncate">image-{{ i + 1 }}.jpg</figcaption>
        </figure>
      </div>
    </KitBlock>

    <KitBlock label="Upload dropzone">
      <div class="w-full max-w-md panel border-dashed !border-2 p-8 text-center">
        <span class="empty-state-icon mx-auto mb-3"><Icon name="upload" :size="22" /></span>
        <div class="font-medium">Drop files here</div>
        <p class="text-xs text-muted mt-1">or <button class="btn btn-link text-xs">browse</button> — up to 25 MB each</p>
      </div>
    </KitBlock>

    <KitBlock label="Upload in progress">
      <div class="w-full max-w-md card card-p flex-col !items-stretch gap-2">
        <div class="flex items-center gap-3">
          <span class="grid place-items-center w-8 h-8 rounded-xs bg-sunken text-subtle shrink-0"><Icon name="image" :size="15" /></span>
          <span class="flex-1 min-w-0">
            <span class="block text-xs font-medium truncate">hero-launch.jpg</span>
            <span class="block text-[0.6875rem] text-subtle">840 KB · 68%</span>
          </span>
          <button class="btn btn-ghost btn-icon btn-sm"><Icon name="x" :size="14" label="Cancel upload" /></button>
        </div>
        <div class="progress"><div class="progress-bar" style="width: 68%" /></div>
      </div>
    </KitBlock>
  </div>
</template>
