<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../../components/ui/Icon.vue'
import KitBlock from '../../components/kit/KitBlock.vue'

const on = ref(true)
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Inputs & forms</h1>
      <p class="page-sub">
        Fields are 16px on phones — anything smaller makes iOS Safari zoom on focus and strands the
        user mid-form.
      </p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Text">
      <div class="w-full max-w-sm form-group">
        <label class="form-label" for="f1">Email address</label>
        <input id="f1" class="form-input" type="email" placeholder="you@example.com" />
        <p class="form-hint">We never share this.</p>
      </div>
    </KitBlock>

    <KitBlock label="With leading icon">
      <div class="w-full max-w-sm input-group">
        <span class="input-group-icon"><Icon name="search" :size="15" /></span>
        <input class="form-input" placeholder="Search posts…" />
      </div>
    </KitBlock>

    <KitBlock label="Invalid">
      <div class="w-full max-w-sm form-group">
        <label class="form-label" for="f2">Slug</label>
        <input id="f2" class="form-input" aria-invalid="true" value="not a slug!" />
        <p class="form-error">Lowercase letters, numbers and hyphens only.</p>
      </div>
    </KitBlock>

    <KitBlock label="Select & textarea">
      <div class="w-full max-w-sm form-group">
        <label class="form-label" for="f3">Status</label>
        <select id="f3" class="form-select">
          <option>Draft</option><option>Published</option><option>Archived</option>
        </select>
      </div>
      <div class="w-full max-w-sm form-group">
        <label class="form-label" for="f4">Excerpt</label>
        <textarea id="f4" class="form-textarea" placeholder="A short summary…" />
      </div>
    </KitBlock>

    <KitBlock label="Disabled">
      <input class="form-input max-w-sm" value="Read only" aria-label="Read-only example" disabled />
    </KitBlock>

    <KitBlock label="Switch">
      <button
        class="switch"
        role="switch"
        :aria-checked="on"
        aria-label="Publish immediately"
        @click="on = !on"
      />
      <span class="text-xs text-muted" aria-hidden="true">Publish immediately</span>
    </KitBlock>

    <KitBlock label="Two-column row — stacks below md">
      <div class="form-row form-row-2 w-full max-w-xl">
        <div class="form-group">
          <label class="form-label" for="f5">First name</label>
          <input id="f5" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label" for="f6">Last name</label>
          <input id="f6" class="form-input" />
        </div>
      </div>
    </KitBlock>
  </div>
</template>
