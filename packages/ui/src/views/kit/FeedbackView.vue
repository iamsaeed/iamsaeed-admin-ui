<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../../components/ui/Icon.vue'
import KitBlock from '../../components/kit/KitBlock.vue'

const modalOpen = ref(false)
</script>

<template>
  <div class="page-header">
    <div>
      <h1 class="page-title">Feedback & status</h1>
      <p class="page-sub">
        Open the modal on a phone-width window: it becomes a bottom sheet, because a centred dialog
        is out of thumb reach.
      </p>
    </div>
  </div>

  <div class="card card-p">
    <KitBlock label="Alerts">
      <div class="w-full flex flex-col gap-2 max-w-2xl">
        <div class="alert alert-success"><Icon name="check-circle" :size="16" /> Post published successfully.</div>
        <div class="alert alert-warn"><Icon name="alert-triangle" :size="16" /> Two images are missing alt text.</div>
        <div class="alert alert-danger" role="alert"><Icon name="x" :size="16" /> Could not reach the publishing service.</div>
        <div class="alert alert-info"><Icon name="info" :size="16" /> Scheduled for 09:00 tomorrow.</div>
      </div>
    </KitBlock>

    <KitBlock label="Toast">
      <!-- role="status" + aria-live="polite" is what makes a toast exist for a
           screen reader. "polite" rather than "assertive" so it waits for a
           pause instead of interrupting mid-sentence; use "alert" only for
           something the user must act on immediately. -->
      <div class="toast max-w-sm" role="status" aria-live="polite">
        <Icon name="check-circle" :size="16" class="text-success" />
        <span class="flex-1">Draft saved</span>
        <button class="btn btn-ghost btn-icon btn-sm"><Icon name="x" :size="14" label="Dismiss" /></button>
      </div>
    </KitBlock>

    <KitBlock label="Skeleton">
      <div class="w-full max-w-sm flex flex-col gap-2">
        <div class="skeleton h-4 w-3/4" />
        <div class="skeleton h-4 w-full" />
        <div class="skeleton h-4 w-1/2" />
      </div>
    </KitBlock>

    <KitBlock label="Empty state">
      <div class="w-full empty-state">
        <span class="empty-state-icon"><Icon name="inbox" :size="22" /></span>
        <div>
          <div class="font-medium text-fg">No drafts yet</div>
          <div class="text-xs">Anything you start will show up here.</div>
        </div>
        <button class="btn btn-primary btn-sm"><Icon name="plus" :size="14" /> New draft</button>
      </div>
    </KitBlock>

    <KitBlock label="Modal / bottom sheet">
      <button class="btn btn-primary" @click="modalOpen = true">Open dialog</button>
    </KitBlock>
  </div>

  <Teleport to="body">
    <div v-if="modalOpen" class="scrim" @click="modalOpen = false" />
    <div v-if="modalOpen" class="modal" role="dialog" aria-modal="true" aria-label="Delete post">
      <div class="modal-handle" />
      <div class="modal-hd">
        <div class="card-title">Delete this post?</div>
        <div class="card-sub">This cannot be undone.</div>
      </div>
      <div class="modal-body">
        <p class="text-muted">
          “Designing for clarity” and its 12,480 views will be permanently removed.
        </p>
      </div>
      <div class="modal-ft">
        <button class="btn btn-secondary" @click="modalOpen = false">Cancel</button>
        <button class="btn btn-danger" @click="modalOpen = false">Delete</button>
      </div>
    </div>
  </Teleport>
</template>
