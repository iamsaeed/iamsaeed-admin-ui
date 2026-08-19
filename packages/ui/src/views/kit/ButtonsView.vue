<script setup lang="ts">
import Icon from '../../components/ui/Icon.vue'
import KitBlock from '../../components/kit/KitBlock.vue'
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Buttons</h1>
      <p class="page-sub">Every variant is a class, not a utility string — `.btn` plus one modifier.</p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Variants">
      <button class="btn btn-primary">Primary</button>
      <button class="btn btn-secondary">Secondary</button>
      <button class="btn btn-soft">Soft</button>
      <button class="btn btn-ghost">Ghost</button>
      <button class="btn btn-danger">Danger</button>
      <button class="btn btn-danger-soft">Danger soft</button>
      <button class="btn btn-link">Link button</button>
      <button class="btn btn-primary" disabled>Disabled</button>
    </KitBlock>

    <KitBlock label="Sizes — heights come from the density axis">
      <button class="btn btn-primary btn-sm">Small</button>
      <button class="btn btn-primary">Medium</button>
      <button class="btn btn-primary btn-lg">Large</button>
    </KitBlock>

    <KitBlock label="With icons">
      <button class="btn btn-primary"><Icon name="plus" :size="15" /> New post</button>
      <button class="btn btn-secondary"><Icon name="search" :size="15" /> Search</button>
      <button class="btn btn-secondary"><Icon name="filter" :size="15" /> Filter</button>
      <button class="btn btn-soft"><Icon name="send" :size="15" /> Publish</button>
    </KitBlock>

    <KitBlock label="Icon only — note the aria-label, since there is no visible text">
      <button class="btn btn-ghost btn-icon"><Icon name="more" label="More options" /></button>
      <button class="btn btn-secondary btn-icon"><Icon name="edit" label="Edit" /></button>
      <button class="btn btn-ghost btn-icon"><Icon name="trash" label="Delete" /></button>
    </KitBlock>

    <KitBlock label="Button group">
      <div class="btn-group">
        <button class="btn">Day</button>
        <button class="btn" aria-pressed="true">Week</button>
        <button class="btn">Month</button>
        <button class="btn">Year</button>
      </div>
    </KitBlock>

    <KitBlock label="Full width — the mobile default for a primary action">
      <div class="w-full max-w-sm"><button class="btn btn-primary btn-block">Continue</button></div>
    </KitBlock>
  </div>
</template>
